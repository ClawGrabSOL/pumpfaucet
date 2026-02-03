require('dotenv').config();
const express = require('express');
const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');
const bs58 = require('bs58');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Config
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PUMP_TOKEN_MINT = process.env.PUMP_TOKEN_MINT;
const PUMP_AMOUNT = BigInt(process.env.PUMP_AMOUNT || '10000000');

// Initialize Solana connection
const connection = new Connection(HELIUS_RPC, 'confirmed');

// Load faucet wallet
let faucetWallet;
try {
  if (process.env.FAUCET_PRIVATE_KEY) {
    faucetWallet = Keypair.fromSecretKey(bs58.decode(process.env.FAUCET_PRIVATE_KEY));
    console.log('Faucet wallet loaded:', faucetWallet.publicKey.toBase58());
  } else {
    console.log('⚠️  No faucet wallet configured - running in demo mode');
  }
} catch (e) {
  console.error('Failed to load faucet wallet:', e.message);
}

// Send $PUMP tokens
async function sendPumpTokens(recipientAddress) {
  if (!faucetWallet) {
    throw new Error('Faucet wallet not configured');
  }
  
  if (!PUMP_TOKEN_MINT) {
    throw new Error('Token mint not configured');
  }

  const mintPubkey = new PublicKey(PUMP_TOKEN_MINT);
  const recipientPubkey = new PublicKey(recipientAddress);

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
    PUMP_AMOUNT
  );

  // Build and send transaction
  const transaction = new Transaction().add(transferIx);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = faucetWallet.publicKey;

  transaction.sign(faucetWallet);
  
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}

// API endpoint to claim tokens
app.post('/api/claim', async (req, res) => {
  const { walletAddress, mathAnswer, mathExpected } = req.body;

  // Validate wallet address
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  // Basic math check
  if (mathAnswer !== mathExpected) {
    return res.status(400).json({ error: 'Captcha failed' });
  }

  try {
    new PublicKey(walletAddress);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  // Send tokens
  try {
    const signature = await sendPumpTokens(walletAddress);
    console.log(`✅ Sent $PUMP to ${walletAddress} - tx: ${signature}`);
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
});

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
  res.json({
    pumpAmount: '10',
    configured: !!(faucetWallet && PUMP_TOKEN_MINT)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚰 $PUMP Faucet running on port ${PORT}\n`);
});
