# Sybil-Resistant ENS Social Graph

Attach Self ZK passport proof to any .eth name as verifiable text record, auto-seed Talent builder profile from ENS identity; graph is cryptographically human-only.

## Overview

Creates a sybil-resistant social layer for the ENS ecosystem. Every .eth username in the resulting graph is cryptographically guaranteed to represent a unique human.

### How It Works

1. **User** connects wallet with ENS name
2. **Verification**: Self ZK passport proof is generated and stored as ENS text record
3. **Profile**: Talent Protocol builder profile is auto-created and linked to ENS
4. **Graph**: Apps can query ENS → check Self proof flag → read Talent score

## Architecture

```
ENS Name → Self ZK Proof (text record) → Talent Protocol Profile → Social Graph
```

## Stack

- **Node.js/Express** - Backend API
- **ENS SDK** - ENS name management
- **Self SDK** - ZK passport verification
- **Talent Protocol API** - Builder profiles
- **PostgreSQL** - Graph indexing
- **React** - Admin dashboard

## Features

- One-click ENS linking
- ZK proof generation and verification
- Automatic Talent profile seeding
- Public graph query API
- Verification badge display

## Setup

1. Install dependencies
2. Configure ENS provider (Ethereum/L2)
3. Set up Self API credentials
4. Configure Talent API access
5. Deploy backend and frontend

## API Keys

- Ethereum provider (Infura/Alchemy)
- Self Protocol API
- Talent Protocol API

## Testing

- Unit tests for proof generation
- Integration tests with ENS testnet
- Graph query performance tests
- End-to-end verification flow

## Security

- ZK proofs ensure no PII stored
- Rate limiting on verification endpoints
- Secure key management
- CORS and input validation

## Future Enhancements

- Batch verification for bulk ENS imports
- Graph analytics dashboard
- Mobile app for verification
- Support for additional identity protocols

## License

MIT