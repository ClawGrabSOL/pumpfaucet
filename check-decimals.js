const { Connection, PublicKey } = require('@solana/web3.js');

async function checkDecimals() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=65bbfc43-5b86-4c8f-8019-cf77117947e0');
  const mint = new PublicKey('pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn');
  
  try {
    const info = await connection.getParsedAccountInfo(mint);
    const decimals = info.value?.data?.parsed?.info?.decimals;
    console.log('Decimals:', decimals);
    console.log('For 10 tokens, use:', 10 * Math.pow(10, decimals));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkDecimals();
