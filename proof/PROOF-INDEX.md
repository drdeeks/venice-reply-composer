# Proof of Functionality — Synthesis Hackathon Submissions

## Project 1: Venice AI Reply Composer
| File | What it shows |
|------|--------------|
| project-1-venice/01-build.txt | Clean Vite production build output |
| project-1-venice/02-tests.txt | 218/219 tests passing across 11 suites |
| project-1-venice/03-manifest.json | Chrome Extension manifest with all permissions |
| project-1-venice/04-structure.txt | Full source + dist file tree |

## Project 2: Email-Native Crypto Remittance
| File | What it shows |
|------|--------------|
| project-2-remittance/01-api-flow.txt | Full API flow: health → Celo network → wallet gen → transaction → email validation |
| project-2-remittance/02-tests.txt | 16 tests across health, transactions, Celo, email endpoints |
| project-2-remittance/03-structure.txt | Source file tree |

### API Flow Demonstrated:
1. **Health Check** — Server running, version 1.0.0
2. **Celo Network** — Connected to Alfajores testnet (chain 44787)
3. **Wallet Generation** — Creates fresh Celo wallet on demand
4. **Create Remittance** — Send 25 cUSD from drdeeks@proton.me to family@example.com
5. **Email Validation** — Blocks disposable emails (tempmail.com), allows legitimate ones
6. **Verification Attributes** — Supports email, phone, name, address, birthdate, nationality

## Project 3: Contributor Attribution Engine
| File | What it shows |
|------|--------------|
| project-3-attribution/01-tests.txt | 10 tests: git analysis, contribution weighting, normalization |
| project-3-attribution/02-structure.txt | Source file tree |
| project-3-attribution/03-readme.txt | Full documentation |

### Pipeline Demonstrated:
1. **Git Analysis** — Reads commit history, extracts contributor stats
2. **Venice AI Weighting** — Private inference to evaluate contribution quality
3. **Slice Encoding** — Generates on-chain payment split config
4. **Credential Generation** — Creates verifiable credential attestations
