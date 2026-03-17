# Research Phase - Sybil-Resistant ENS Social Graph

## ENS SDK
- **Purpose**: Manage ENS names and text records
- **Package**: @ensdomains/ensjs
- **Key Features**: 
  - Resolve ENS names to addresses
  - Read/write text records
  - Support for Ethereum mainnet and L2s
- **API Docs**: https://docs.ens.domains/
- **Setup**: Requires Ethereum provider (Infura/Alchemy)

## Self SDK
- **Purpose**: ZK passport verification for sybil resistance
- **Package**: @selfxyz/sdk
- **Key Features**:
  - Generate ZK proofs for identity verification
  - Verify proofs without revealing PII
  - Store proofs as text records
- **API Docs**: https://docs.self.xyz/
- **Setup**: Requires Self API credentials

## Talent Protocol API
- **Purpose**: Builder profiles and reputation scores
- **API Docs**: https://docs.talentprotocol.com/
- **Key Features**:
  - Create and manage builder profiles
  - Query reputation scores
  - Link external identities
- **Setup**: Requires Talent API access

## PostgreSQL
- **Purpose**: Graph indexing and storage
- **Setup**: Standard PostgreSQL database
- **Key Features**:
  - Store ENS-Talent mappings
  - Graph relationships
  - Query optimization

## Security Considerations
- **ZK Proofs**: Ensure no PII is stored
- **Rate Limiting**: Prevent abuse of verification endpoints
- **CORS**: Secure API access
- **Input Validation**: Sanitize all inputs

## Dependencies Analysis
- **Express**: Web framework
- **Dotenv**: Environment variables
- **Ethers**: Ethereum interactions
- **Node-fetch**: HTTP requests
- **Rate-limit**: API protection
- **Helmet**: Security headers
- **CORS**: Cross-origin requests

## Implementation Challenges
1. ENS text record limitations (size, cost)
2. ZK proof generation time
3. Talent API rate limits
4. Graph query performance
5. Error handling for external services

## Next Steps
1. Create project structure
2. Set up database schema
3. Implement ENS verification service
4. Integrate Self SDK for ZK proofs
5. Connect Talent Protocol API
6. Build graph indexing
7. Create API endpoints
8. Add tests and documentation