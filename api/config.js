module.exports = function handler(req, res) {
  res.json({
    pumpAmount: '10',
    configured: !!(process.env.FAUCET_PRIVATE_KEY && process.env.PUMP_TOKEN_MINT)
  });
};
