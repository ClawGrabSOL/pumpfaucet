import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import bs58 from 'bs58';

// Verify hCaptcha
async function verifyCaptcha(token) {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) return true;
  
  try {
    const res = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error('Captcha verification failed:', e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress, captchaToken } = req.body;

  // Validate wallet address
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  let recipientPubkey;
  try {
    recipientPubkey = new PublicKey(walletAddress);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  // Verify captcha
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return res.status(400).json({ error: 'Captcha verification failed' });
  }

  // Check configuration
  const privateKey = process.env.FAUCET_PRIVATE_KEY;
  const tokenMint = process.env.PUMP_TOKEN_MINT;
  const heliusKey = process.env.HELIUS_API_KEY;
  const amount = BigInt(process.env.PUMP_AMOUNT || '10000000');

  if (!privateKey || !tokenMint || !heliusKey) {
    return res.status(500).json({ error: 'Faucet not configured' });
  }

  try {
    // Initialize connection and wallet
    const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, 'confirmed');
    const faucetWallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    const mintPubkey = new PublicKey(tokenMint);

    // Get or create recipient's token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetWallet,
      mintPubkey,
      recipientPubkey
    );

    // Get faucet's token account
    const faucetTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      faucetWallet.publicKey
    );

    // Create transfer instruction
    const transferIx = createTransferInstruction(
      faucetTokenAccount,
      recipientTokenAccount.address,
      faucetWallet.publicKey,
      amount
    );

    // Build and send transaction
    const transaction = new Transaction().add(transferIx);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetWallet.publicKey;

    transaction.sign(faucetWallet);
    
    const signature = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`✅ Sent ${amount} $PUMP to ${walletAddress} - tx: ${signature}`);
    
    res.json({ 
      success: true, 
      message: 'Tokens sent!',
      signature,
      explorer: `https://solscan.io/tx/${signature}`
    });
  } catch (e) {
    console.error('Transfer failed:', e.message);
    res.status(500).json({ error: e.message });
  }
}
