const https = require('https');

const data = JSON.stringify({
  walletAddress: 'J8tRieR8ppRXze3HqkjcSamKu9e571gR3URnJ3nrDoaR',
  mathAnswer: 5,
  mathExpected: 5
});

const options = {
  hostname: 'pumpfaucet-production.up.railway.app',
  path: '/api/claim',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
