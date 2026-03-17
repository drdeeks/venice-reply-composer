# Natural Language Staking via Bankr × Lido — Setup & Deployment

## Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript
- Bankr Skills SDK access
- Ethereum provider (Infura/Alchemy)
- Base/Ethereum wallet for testing

## Quick Start

```bash
npm install
npm run build
npm test
```

## Configuration

Create `.env`:

```
BANKR_SKILL_ID=your_skill_id
BANKR_API_KEY=your_api_key
ETHEREUM_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_for_signing (optional, for live staking)
```

## Skill Registration

1. Log into Bankr Developer Portal
2. Create new Skill pointing to your hosted endpoint
3. Set action type to `onMessage`
4. Save API credentials

## Lido Integration

- Lido contract on Base: `0x4200000000000000000000000000000000000006` (example)
- Use `@lido-finance/lido` SDK for contract calls
- Staking: `lido.submit(amount)` — requires user signature
- Unstaking: `lido.unstake(amount)` — queued, 1-3 days wait

## Supported Commands

| Command | Description |
|---------|-------------|
| `stake 0.5 ETH` | Stake 0.5 ETH into Lido |
| `stake 100 USD` | Stake equivalent ETH amount |
| `unstake 1 stETH` | Queue unstake of 1 stETH |
| `check my stETH balance` | Show current stETH balance |
| `what's my yield?` | Show stETH yield/APY |

## Testing

- Unit tests: `npm test`
- Manual testing via Bankr sandbox
- Testnet deployment before mainnet

## Production Deployment

- Deploy skill to Bankr
- Verify webhook endpoint is HTTPS
- Enable rate limiting
- Set up logging (e.g., Papertrail, Logtail)
- Monitor transaction success rate

## Security

- Never expose private keys in logs
- Validate command amounts
- Use slippage protection for swaps
- Implement per-user rate limits
- Keep SDK dependencies updated

## Troubleshooting

**Skill not responding:** Check Bankr webhook config and endpoint health.

**Lido transactions failing:** Ensure sufficient ETH for gas and correct network.

**Balance always zero:** Confirm address mapping from Bankr context to Ethereum address.

## License

MIT