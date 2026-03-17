# Human-Verified Social Tipping

A Bankr skill that requires both sender and receiver to verify their humanity via Self ZK passport before a tip executes.

## Overview

This skill intercepts Bankr tip commands and enforces a two-step verification:
1. Sender must have a valid Self ZK passport attestation.
2. Receiver must have a valid Self ZK passport attestation.

If either party fails verification, the tip is rejected with a clear message. This prevents bot-farming from social tipping flows.

## Architecture

```
Bankr Tip Command → Skill Interceptor → Self ZK Verify (Sender) → Self ZK Verify (Receiver) → Execute Tip (Base)
```

## Stack

- **Bankr Skills SDK** - Skill framework
- **Self Protocol SDK** - ZK passport verification
- **Base L2** - Execution layer for tips
- **TypeScript/Node.js** - Implementation

## Setup

1. Install dependencies
2. Configure API keys
3. Deploy skill to Bankr
4. Test with verified and unverified accounts

## API Keys

- Bankr Skills SDK (provided by Bankr)
- Self Protocol API (from Self)

## Testing

- Mock Self SDK for unit tests
- Integration tests with simulated tip commands
- End-to-end flow tests

## Deployment

- Deploy as Bankr skill
- Monitor verification failures
- Log analytics for debugging

## Security

- No personal data stored
- All verification done via ZK proofs
- Minimal on-chain footprint

## Future Enhancements

- Support for additional verification methods
- Rate limiting per user
- Analytics dashboard

## License

MIT