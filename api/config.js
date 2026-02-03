export default function handler(req, res) {
  res.json({
    hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '',
    pumpAmount: process.env.PUMP_AMOUNT ? (Number(process.env.PUMP_AMOUNT) / 1e6).toString() : '10',
    configured: !!(process.env.FAUCET_PRIVATE_KEY && process.env.PUMP_TOKEN_MINT)
  });
}
