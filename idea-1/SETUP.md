# Human-Verified Social Tipping — Setup & Deployment

## Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript
- Bankr Skills SDK access
- Self Protocol API credentials

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

4. Deploy to Bankr:
```bash
npm run deploy
```

## Configuration

Create a `.env` file in the root:

```
BANKR_SKILL_ID=your_skill_id
BANKR_API_KEY=your_api_key
SELF_API_KEY=your_self_api_key
BASE_RPC_URL=https://mainnet.base.org
```

## Skill Registration

To register this skill with Bankr:

1. Log into Bankr Developer Portal
2. Create new Skill
3. Provide the endpoint URL where this skill will be hosted
4. Use the `onTip` action as the intercept point
5. Save the skill ID and API key

## Self Integration

You need to:

- Create a Self Protocol application
- Get API credentials
- The skill will call Self's `/has_passport` and `/passport_status` endpoints
- These endpoints are read-only and rate-limited

## Supported Commands

This skill intercepts the following Bankr tip commands:

- `tip @user 10 ETH`
- `send @user 5 USDC`
- `donate @creator 20 DAI`

The skill will verify both the sender (from the authenticated Bankr session) and the receiver (the target username) before allowing the tip to proceed.

## Testing

The included Jest tests cover:

- Verification of sender and receiver
- Rejection when either party is not verified
- Error handling and graceful degradation

Run tests with:
```bash
npm test
```

## Production Readiness

Before deploying:

- [ ] All tests pass
- [ ] Rate limiting on Self API calls (cache results)
- [ ] Logging and monitoring setup
- [ ] Error handling for Self API downtime
- [ ] Deploy to a secure hosting environment (AWS, GCP, Azure)
- [ ] Configure HTTPS endpoint
- [ ] Set up environment variables securely
- [ ] Review Bankr skill permissions

## Monitoring

Key metrics to track:

- Tip verification success/failure rates
- Self API latency
- Verification cache hit rate
- Total tips processed

## Security Notes

- Never store Self API responses that contain PII
- Use short-lived cache (5 minutes)
- Do not log addresses or amounts in plain text
- Regularly rotate API keys
- Restrict endpoint to Bankr IPs if possible

## Troubleshooting

**Skill not intercepting tips:** Ensure Bankr skill is properly associated with the bot and the `onTip` handler is registered.

**Self API errors:** Check API key and rate limits. Implement exponential backoff.

**Verification always failing:** Ensure the addresses being checked are correctly mapped to Bankr user wallets.

## License

MIT