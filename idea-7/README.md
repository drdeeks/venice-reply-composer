# LATAM Creator Social Tipping

## Overview
A mobile-first social tipping platform for LATAM creators, enabling fans to tip creators in Celo stablecoins via Bankr's natural language interface.

## Partners
- **Frutero**: Creator community platform (frutero.club)
- **Celo**: Mobile-first blockchain with stablecoins
- **Bankr**: Natural language crypto interface (bankr.bot)

## Features
- Creator dashboard with tipping stats
- Mobile web app for fans to tip creators
- Bankr integration for natural language tipping
- Low data usage optimized
- First-time crypto user friendly
- Celo stablecoin payments

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Blockchain: Celo
- Payment: Bankr API
- Database: SQLite
- Deployment: Vercel

## Installation & Setup
```bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in Bankr API key, Celo network details, etc.

# Start development server
npm run dev
```

## Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linting
```

## API Endpoints
- `GET /api/creators` - List all creators
- `POST /api/tips` - Create new tip
- `GET /api/tips/:id` - Get tip details
- `GET /api/creator/:id` - Get creator dashboard

## Bankr Integration
Uses Bankr's natural language interface for:
- "Send 5 USD to creator@example.com"
- "Tip $10 to @creator123"
- "Donate 50 pesos to artist"

## Celo Integration
- Uses Celo's mobile-first blockchain
- Supports Celo Dollar (cUSD) stablecoin
- Low transaction fees
- Fast confirmation times

## Mobile Optimization
- Progressive Web App (PWA)
- Offline capability
- Data usage optimization
- Touch-friendly interface

## Testing
- Unit tests for core functions
- Integration tests for API endpoints
- E2E tests for user flows
- Performance testing for mobile devices

## Deployment
- Vercel for frontend hosting
- Railway for backend API
- Celo network for payments
- Custom domain setup

## Security
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure environment variable handling
- HTTPS everywhere

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
MIT License