# Natural Language Staking via Bankr × Lido

A Bankr Skill that enables users to stake ETH into Lido, check stETH yields, and unstake via natural language commands.

## Overview

This skill allows users to interact with Lido's liquid staking protocol through simple natural language commands in Farcaster, X, or Base chat.

### Supported Commands

- `stake 0.5 ETH in Lido`
- `check my stETH balance`
- `unstake 0.3 ETH`
- `what's my stETH yield?`
- `stake 100 USD worth of ETH`

## Architecture

```
Bankr Chat Command → Skill Interceptor → Lido Smart Contract → Base/Ethereum
```

## Stack

- **Bankr Skills SDK** - Skill framework
- **Lido Smart Contract** - Liquid staking protocol
- **Web3.js / Ethers.js** - Ethereum interaction
- **TypeScript/Node.js** - Implementation

## Features

- Natural language processing for staking commands
- Real-time stETH balance tracking
- Yield calculation and reporting
- Unstaking with slippage protection
- Error handling and user feedback

## Setup

1. Install dependencies
2. Configure Ethereum provider
3. Set up Bankr skill endpoint
4. Test with Lido testnet

## API Keys

- Bankr Skills SDK (provided)
- Ethereum provider (e.g., Infura, Alchemy)

## Testing

- Unit tests for command parsing
- Integration tests with Lido contract
- End-to-end flow tests

## Deployment

- Deploy to Bankr platform
- Configure webhook endpoints
- Set up monitoring and logging

## Security

- Validate all inputs
- Use safe math for calculations
- Implement rate limiting
- Secure API keys and private keys

## Future Enhancements

- Support for other liquid staking protocols
- Yield optimization suggestions
- Multi-language support
- Mobile app integration

## License

MIT