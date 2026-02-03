# $PUMP Faucet 🚰

A clean, modern token faucet for distributing $PUMP tokens on Solana.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your values:
   - `HELIUS_API_KEY` - Get one at https://helius.dev
   - `FAUCET_PRIVATE_KEY` - Base58 encoded private key of wallet holding $PUMP
   - `PUMP_TOKEN_MINT` - Your $PUMP token's mint address
   - `HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET_KEY` - Get at https://hcaptcha.com

3. **Run the faucet:**
   ```bash
   npm start
   ```

4. **Open** http://localhost:3000

## Configuration

| Variable | Description |
|----------|-------------|
| `HELIUS_API_KEY` | Helius RPC API key |
| `FAUCET_PRIVATE_KEY` | Wallet private key (base58) |
| `PUMP_TOKEN_MINT` | SPL token mint address |
| `PUMP_AMOUNT` | Tokens per claim (in smallest units, default: 10000000000 = 10 tokens with 9 decimals) |
| `HCAPTCHA_SITE_KEY` | hCaptcha public key |
| `HCAPTCHA_SECRET_KEY` | hCaptcha secret key |
| `PORT` | Server port (default: 3000) |

## Demo Mode

The faucet runs in demo mode without configured keys - useful for previewing the UI.

## Stack

- Express.js backend
- Vanilla JS frontend
- @solana/web3.js + @solana/spl-token
- Helius RPC
- hCaptcha
