# Project 4: Builder Credential ENS Namespace - Research

## Overview
Integrate Merit Systems attestations and Talent Protocol builder scores to issue ENS subdomains with cryptographic proofs.

## APIs & Services

### Merit Systems
- **API Base URL:** https://api.merits.xyz
- **Contract:** 0xMeritContractAddress (placeholder)
- **Features:**
  - Get attestations by address/issuer/recipient
  - Verify attestation validity
  - Search attestations by type/data
  - Get attestation statistics

### Talent Protocol
- **API Base URL:** https://api.talentprotocol.com
- **Features:**
  - Get builder profile by Ethereum address
  - Get top builders by score
  - Search builders by skill
  - Get reputation and achievements

### ENS
- **Registry:** @ensdomains/ensjs
- **Public Resolver:** 0x1234... (placeholder)
- **Features:**
  - Register subdomains
  - Check availability
  - Set DNS records
  - Transfer ownership

## Dependencies
- `@ensdomains/ensjs`: ^2.0.0
- `ethers`: ^6.0.0
- `typescript`: ^5.0.0
- `ts-node`: ^10.0.0

## Contract Interfaces
```typescript
// Merit contract interface (simplified)
interface MeritContract {
  function attest(address _recipient, string memory _data) external;
  function revoke(uint256 _attestationId) external;
  function getAttestations(address _recipient) external view returns (Attestation[] memory);
}

// Talent contract interface (simplified)
interface TalentContract {
  function getScore(address _address) external view returns (uint256);
  function getRank(address _address) external view returns (uint256);
}
```

## Implementation Strategy
1. **Credential Issuer** - Main class handling credential creation
2. **ENS Manager** - Handle subdomain registration
3. **Merit Client** - API integration for attestations
4. **Talent Client** - API integration for builder scores
5. **CLI Tool** - Command-line interface for operations

## Security Considerations
- Never commit private keys or API keys
- Use environment variables for sensitive data
- Validate all inputs
- Implement rate limiting for API calls
- Use EIP-712 for secure signature verification

## Testing Strategy
- Unit tests for each class
- Integration tests with mocked APIs
- E2E tests for credential lifecycle
- Security tests for cryptographic operations

## Deployment
- Docker container for easy deployment
- Environment-specific configuration
- Health checks and monitoring
- Rollback procedures

## Known Limitations
- Rate limits on Merit/Talent APIs
- ENS registration costs
- Network congestion on Ethereum
- API availability and uptime