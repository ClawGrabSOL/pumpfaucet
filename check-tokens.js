const { Connection, PublicKey } = require('@solana/web3.js');

async function checkTokens() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=65bbfc43-5b86-4c8f-8019-cf77117947e0');
  
  const walletPubkey = new PublicKey('J8tRieR8ppRXze3HqkjcSamKu9e571gR3URnJ3nrDoaR');
  
  // Get all token accounts for this wallet
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
  });
  
  console.log('Token accounts found:', tokenAccounts.value.length);
  
  tokenAccounts.value.forEach(account => {
    const info = account.account.data.parsed.info;
    console.log('\nMint:', info.mint);
    console.log('Balance:', info.tokenAmount.uiAmount);
  });
}

checkTokens();
