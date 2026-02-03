const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const privateKey = '39kMmygLw9cHSjBjx15imbd8h7YdVjQHTXG6h4Ewm7Aiuog18iqZsUqA2y68NRJm4D2aVZ6DfAtuhzw5DudTErTj';

try {
  const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
  console.log('Wallet address from private key:', wallet.publicKey.toBase58());
} catch (e) {
  console.error('Error:', e.message);
}
