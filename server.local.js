require('dotenv').config();
const express = require('express');
const axios = require('axios');
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
const PUMP_AMOUNT = BigInt(process.env.PUMP_AMOUNT || '10000000000');
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;

// Initialize Solana connection
const connection = new Connection(HELIUS_RPC, 'confirmed');

// Load faucet wallet
let faucetWallet;
try {
  if (process.env.FAUCET_PRIVATE_KEY && process.env.FAUCET_PRIVATE_KEY !== 'your_base58_private_key_here') {
    faucetWallet = Keypair.fromSecretKey(bs58.decode(process.env.FAUCET_PRIVATE_KEY));
    console.log('Faucet wallet loaded:', faucetWallet.publicKey.toBase58());
  } else {
    console.log('⚠️  No faucet wallet configured - running in demo mode');
  }
} catch (e) {
  console.error('Failed to load faucet wallet:', e.message);
}

// Verify hCaptcha
async function verifyCaptcha(token) {
  if (!HCAPTCHA_SECRET || HCAPTCHA_SECRET === 'your_hcaptcha_secret_key_here') {
    console.log('⚠️  hCaptcha not configured - skipping verification');
    return true;
  }
  
  try {
    const response = await axios.post('https://hcaptcha.com/siteverify', null, {
      params: {
        secret: HCAPTCHA_SECRET,
        response: token
      }
    });
    return response.data.success;
  } catch (e) {
    console.error('Captcha verification failed:', e.message);
    return false;
  }
}

// Send $PUMP tokens
async function sendPumpTokens(recipientAddress) {
  if (!faucetWallet) {
    throw new Error('Faucet wallet not configured');
  }
  
  if (!PUMP_TOKEN_MINT || PUMP_TOKEN_MINT === 'your_pump_token_mint_address_here') {
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
  const { walletAddress, captchaToken } = req.body;

  // Validate wallet address
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    new PublicKey(walletAddress);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  // Verify captcha
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return res.status(400).json({ error: 'Captcha verification failed' });
  }

  // Send tokens
  try {
    const signature = await sendPumpTokens(walletAddress);
    console.log(`✅ Sent ${PUMP_AMOUNT} $PUMP to ${walletAddress} - tx: ${signature}`);
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
    hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '',
    pumpAmount: process.env.PUMP_AMOUNT ? (Number(process.env.PUMP_AMOUNT) / 1e9).toString() : '10',
    configured: !!(faucetWallet && PUMP_TOKEN_MINT && PUMP_TOKEN_MINT !== 'your_pump_token_mint_address_here')
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚰 $PUMP Faucet running at http://localhost:${PORT}\n`);
});
