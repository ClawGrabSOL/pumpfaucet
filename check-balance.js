const { Connection, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');

async function checkBalance() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=65bbfc43-5b86-4c8f-8019-cf77117947e0');
  
  const walletPubkey = new PublicKey('J8tRieR8ppRXze3HqkjcSamKu9e571gR3URnJ3nrDoaR');
  const mintPubkey = new PublicKey('pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn');
  
  console.log('Wallet:', walletPubkey.toBase58());
  console.log('Token mint:', mintPubkey.toBase58());
  
  try {
    const tokenAccount = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    console.log('Token account address:', tokenAccount.toBase58());
    
    const account = await getAccount(connection, tokenAccount);
    console.log('Token balance:', account.amount.toString());
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkBalance();
