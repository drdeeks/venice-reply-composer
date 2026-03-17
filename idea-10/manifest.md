# Project 10: Staking Yield as Email Micropayments

## Overview
A system that stakes ETH via Lido, tracks the yield, bridges it to Celo, and automatically disburses it as email micropayments via Ampersend — recipients don't need a wallet.

## Partners
- **Lido** - Liquid staking protocol (stETH)
- **Celo** - Mobile-first, EVM-compatible L2 for payments
- **Ampersend** - Email-native crypto remittance platform

## Bounties Targeting
1. Go Gasless
2. Ethereum Web Auth / ERC-8128
3. The Future of Commerce

## Problem Statement
Traditional staking yield requires users to have a wallet and understand DeFi. This project enables anyone with an email address to receive staking yield without managing private keys, gas, or crypto wallets.

## Solution Architecture
```
ETH Staker → Lido (stETH) → Yield Tracker → Bridge to Celo → Ampersend → Email Recipient
```

### Key Components
1. **Staking Module** - Stake ETH via Lido to get stETH
2. **Yield Tracker** - Monitor stETH yield accumulation in real-time
3. **Bridge Manager** - Bridge yield from Ethereum to Celo (stETH → cUSD or other stable)
4. **Email Disbursement** - Send micropayment emails via Ampersend API
5. **Configuration & API** - REST API for configuration, webhook for trigger events

## Technical Stack
- **Language**: TypeScript/Node.js
- **Framework**: Express.js for REST API
- **Blockchain**: Ethereum (Lido), Celo L2
- **Bridging**: Official Celo Bridge or Socket/Connext
- **Email**: Ampersend API (SMTP/REST)
- **Monitoring**: on-chain event listeners, webhooks
- **Testing**: Jest + Supertest
- **Deployment**: Docker, environment-based config

## On-Chain Footprint
- Lido stETH deposit/withdraw (Ethereum mainnet)
- Bridge transaction (Ethereum → Celo)
- Optional: Smart contract for automated yield distribution (Celo)

## Data Flow
1. User stakes ETH (or we stake on behalf of a system)
2. Yield accumulates in stETH balance over time
3. Periodic yield harvest: calculate yield amount, bridge to Celo
4. Disburse bridged funds to email recipients via Ampersend
5. Email contains claim link (gasless, wallet-less)

## Security Considerations
- Private key management (use AWS/GCP secrets manager)
- Rate limiting on API
- Input validation
- Event replay protection
- Transaction monitoring
- PII handling compliance (GDPR)

## Success Metrics
- Accurate yield tracking (±1% tolerance)
- Reliable bridging (99%+ success rate)
- Email delivery >95%
- Zero unauthorized access incidents

## Development Phases
1. **Phase 1**: Research & Architecture (complete)
2. **Phase 2**: Core Development (in progress)
   - Yield tracker implementation
   - Bridge integration
   - Ampersend API integration
3. **Phase 3**: API & Orchestration
4. **Phase 4**: Testing & Security Audit
5. **Phase 5**: Deployment & Monitoring

## Current Status
- Project scaffold created
- Research phase complete
- Implementation starting

## Resources
- Lido Docs: https://docs.lido.fi
- Celo Docs: https://docs.celo.org
- Ampersend: https://github.com/ampersend
