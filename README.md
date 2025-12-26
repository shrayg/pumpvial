# PumpAgent - Pump.fun API Toolkit

**PumpAgent** is a comprehensive, beginner-friendly toolkit for building Solana applications, specifically focused on Pump.fun token operations. It provides a complete suite of APIs, WebSocket data feeds, and web applications for token creation, trading, analytics, and automation on the Solana blockchain.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [WebSocket Feeds](#websocket-feeds)
- [Web Applications](#web-applications)
- [Authentication & Rate Limiting](#authentication--rate-limiting)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Key Features](#key-features)
- [Development](#development)

---

## Overview

PumpAgent provides developers and traders with:

- **60+ REST API Endpoints** for Pump.fun operations, wallet management, DEX trading, and more
- **Real-time WebSocket Feeds** for token creation, trades, migrations, and KOL tracking
- **4 Web Applications**: KOLTrader, DexV2, Bundler, and Bump Bot
- **Tiered API Access** with rate limiting and fee management
- **Complete Solana Integration** with support for Pump.fun, Raydium, Jupiter, and Bonk platforms

The platform serves both developers building Solana applications and traders looking for advanced trading tools and automation.

---

## Tech Stack

### Frontend (Client)
- **Framework**: React 19.0.0
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS 4.1.4
- **Routing**: React Router DOM 7.5.2
- **State Management**: React Context API, Hooks
- **Charts**: Lightweight Charts 4.2.3
- **WebSocket Client**: Socket.IO Client 4.8.1
- **Solana Integration**: @solana/web3.js 1.98.2, @solana/spl-token 0.4.13
- **Authentication**: Supabase Auth
- **Other Libraries**:
  - React Helmet (SEO)
  - React Spring (animations)
  - React Draggable
  - Axios
  - BS58 (encoding)

### Backend (Server)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.1.0
- **Solana Integration**: 
  - @solana/web3.js 1.98.2
  - @coral-xyz/anchor 0.31.1
  - @solana/spl-token 0.4.13
- **DEX Integration**:
  - @jup-ag/api 6.0.19 (Jupiter)
  - @raydium-io/raydium-sdk-v2 0.2.8-alpha (Raydium)
- **Database**: Supabase (PostgreSQL)
- **Rate Limiting**: express-rate-limit 7.5.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Other**: CORS, dotenv, bs58, bn.js

### WebSocket Server
- **Framework**: Socket.IO 4.8.1
- **WebSocket Client**: ws 8.18.2
- **Data Source**: Helius WebSocket API
- **Rate Limiting**: Custom connection limiting

### Infrastructure
- **RPC Providers**: Helius, QuickNode, Shyft, Alchemy, Chainstack
- **Storage**: Supabase (user data, API keys, strategies)
- **IPFS**: Custom IPFS integration for metadata
- **Image Upload**: Custom image upload service

---

## Architecture

The project consists of three main components:

### 1. Client (`/client`)
React-based frontend application providing:
- API documentation and code examples
- WebSocket feed demonstrations
- 4 integrated trading/development applications
- User dashboard for API key management
- Authentication and user management

### 2. Server (`/server`)
Express.js REST API server providing:
- 60+ endpoints for Solana operations
- API key authentication and validation
- Tier-based rate limiting
- Transaction building and signing
- Integration with Pump.fun, Raydium, Jupiter, and Bonk programs

### 3. WebSocket Server (`/websocket`)
Real-time data relay server providing:
- Pump.fun token creation events
- Trade events (user-specific and token-specific)
- Token migration events
- KOL (Key Opinion Leader) trade tracking
- Pool creation and trade events
- Real-time candlestick data

---

## Project Structure

```
pumpagent/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Apps/          # Main applications
│   │   │   │   ├── KOLTrader/ # KOL trading terminal
│   │   │   │   ├── DexV2/     # DEX trading interface
│   │   │   │   ├── Bundler/   # Token bundle launcher
│   │   │   │   └── Bump/      # Token bump bot
│   │   │   ├── Routes/
│   │   │   │   ├── HTTPS/     # API endpoint documentation
│   │   │   │   ├── WebSocket/ # WebSocket feed documentation
│   │   │   │   └── Tools/     # Utility tools
│   │   │   ├── Dashboard/     # User dashboard
│   │   │   └── ...
│   │   ├── utils/             # Client utilities
│   │   │   ├── clientcode.js  # Client-side code examples
│   │   │   ├── servercode.js  # Server-side code examples
│   │   │   └── functions.js   # Helper functions
│   │   └── App.jsx            # Main app component
│   ├── public/                # Static assets
│   └── package.json
│
├── server/                    # Express API server
│   ├── routes/                # API route handlers (60+ files)
│   │   ├── pumpsinglebuy.js
│   │   ├── pumpsinglesell.js
│   │   ├── pumplaunchtoken.js
│   │   ├── koltraderbuy.js
│   │   └── ...
│   ├── utils/
│   │   ├── constants.js       # Solana program addresses, RPC configs
│   │   ├── helpers.js         # Utility functions
│   │   ├── checkapikey.js     # API key validation
│   │   ├── ratelimiter.js     # Rate limiting configuration
│   │   ├── supabase.js        # Database client
│   │   └── *.json             # Program IDLs (Pump.fun, Raydium, etc.)
│   ├── Sandbox/               # Test scripts
│   └── server.js              # Main server file
│
└── websocket/                 # WebSocket relay server
    ├── server.js              # Socket.IO server
    ├── heliuspumpsocket.js    # Pump.fun event relay
    ├── heliuspumpswapsocket.js # PumpSwap event relay
    └── utils/
        ├── constants.js
        ├── helpers.js
        └── kols.js            # KOL wallet addresses
```

---

## API Endpoints

### Wallet Management
- `POST /generate-wallets` - Generate multiple Solana wallets
- `POST /fund-wallets` - Fund multiple wallets with SOL
- `GET /get-balance` - Get wallet SOL balance
- `POST /sol-balance` - Get single wallet balance
- `POST /sol-balances` - Get multiple wallet balances
- `POST /claim-profits` - Transfer profits to dashboard wallet

### Pump.fun Token Operations
- `POST /pump-launch-token` - Create a new token on Pump.fun
- `POST /pump-launch-bundle` - Launch multiple tokens in a bundle
- `POST /pump-single-buy` - Buy tokens from bonding curve
- `POST /pump-single-sell` - Sell tokens back to bonding curve
- `POST /pump-multi-buy` - Buy tokens across multiple wallets
- `POST /pump-multi-sell` - Sell tokens from multiple wallets
- `POST /pump-dump-all` - Sell all tokens from a wallet
- `POST /pump-token-bump` - Bump token visibility on Pump.fun
- `GET /pump-token-info` - Get token information
- `GET /pump-bonding-curve` - Get bonding curve data
- `GET /pump-chart` - Get candlestick chart data

### DEX Trading (Raydium/Jupiter)
- `POST /dex-single-buy` - Buy tokens on DEX
- `POST /dex-single-sell` - Sell tokens on DEX
- `POST /dex-paid` - Get paid DEX trading data

### KOL Trader Operations
- `POST /create-koltrade-wallet` - Create trading wallet
- `POST /load-koltrader` - Load trader configuration
- `POST /koltrader-buy` - Execute buy trade
- `POST /koltrader-sell` - Execute sell trade
- `POST /koltrader-dex-buy` - DEX buy via trader
- `POST /koltrader-dex-sell` - DEX sell via trader
- `POST /koltrader-bump` - Bump token via trader
- `POST /koltrader-withdraw` - Withdraw funds
- `POST /load-openpositions` - Load open trading positions
- `POST /update-koltrade-strategies` - Update trading strategies

### Utility Operations
- `POST /create-ipfs` - Upload metadata to IPFS
- `POST /create-lookup-table` - Create address lookup table
- `POST /extend-lookup-table` - Extend lookup table
- `POST /upload-image` - Upload image file
- `POST /mint-holders` - Get token holders
- `POST /get-mint-balances-for-holders` - Get balances for holders
- `GET /token-info` - Get token information
- `GET /asset-info` - Get asset information
- `POST /token-bump` - Generic token bump
- `POST /comment-thread` - Get comment thread data

### PumpSwap Operations
- `GET /pumpswap-chart` - Get PumpSwap candlestick data

### Transaction Building
- `POST /create-pumpfun-buy-transaction` - Build buy transaction
- `POST /create-pumpfun-sell-transaction` - Build sell transaction
- `POST /confirm-transaction` - Confirm transaction
- `POST /confirm-bundle` - Confirm bundle transaction

### Account Management
- `POST /generate-api-key` - Generate new API key
- `POST /sign-up` - User registration
- `GET /dashboard` - Get dashboard data
- `POST /get-tier-payment-wallet` - Get payment wallet for tier upgrade
- `POST /confirm-tier-payment` - Confirm tier payment
- `GET /tier-sol-price` - Get tier pricing in SOL
- `POST /user-withdraw-sol` - Withdraw SOL
- `POST /user-withdraw-usdc` - Withdraw USDC
- `POST /update-discord-profile` - Update Discord profile
- `POST /reclaim-rent` - Reclaim account rent
- `POST /reclaim-sol` - Reclaim SOL from closed accounts

### Bonk Platform
- `POST /bonk-launch-bundle` - Launch bundle on Bonk platform

### Landing & Info
- `GET /landing-info` - Get landing page information

---

## WebSocket Feeds

The WebSocket server (`wss://ws.pumpagent.com`) provides real-time event streams:

### Connection
```javascript
import io from "socket.io-client";
const socket = io("wss://ws.pumpagent.com", {
  query: { mints: JSON.stringify(["mint1", "mint2"]), users: JSON.stringify(["user1"]) }
});
```

### Available Events

#### Token Creation Events
- **Event**: `token-creation`
- **Data**: Token mint address, creator, metadata, timestamp
- **Use Case**: Track new token launches in real-time

#### Trade Events
- **Event**: `token-trades`
- **Data**: Trade details (buyer, seller, amount, price, timestamp)
- **Filter**: Subscribe to specific token mints
- **Use Case**: Real-time trade monitoring, volume tracking

#### User Trade Events
- **Event**: `user-trades`
- **Data**: All trades by a specific wallet address
- **Filter**: Subscribe to specific user addresses
- **Use Case**: Track KOL trades, monitor specific traders

#### Token Migration Events
- **Event**: `token-migration`
- **Data**: Migration details (mint, new pool address, timestamp)
- **Use Case**: Detect when tokens migrate to Raydium

#### KOL Trade Events
- **Event**: `kol-trades`
- **Data**: Trades by tracked KOL wallets
- **Use Case**: Follow influential traders, copy trading signals

#### Pool Creation Events
- **Event**: `pool-creation`
- **Data**: New Raydium pool creation details
- **Use Case**: Track new liquidity pools

#### Pool Trade Events
- **Event**: `pool-trades`
- **Data**: Trades on Raydium pools
- **Use Case**: Monitor DEX trading activity

#### Pool KOL Trades
- **Event**: `pool-kol-trades`
- **Data**: KOL trades on Raydium pools
- **Use Case**: Track KOL DEX activity

---

## Web Applications

### 1. KOLTrader (`/dex`)
Advanced trading terminal for following and copying KOL (Key Opinion Leader) trades.

**Features**:
- Real-time KOL trade feed
- Multi-chart view (up to 4 charts)
- Automated trading strategies
- Position tracking and management
- Wallet management
- Strategy creation and backtesting
- Token search and filtering
- Comment thread integration
- SOL/USD price tracking

**Key Components**:
- Terminal: Real-time trade feed with filtering
- Charts: Interactive price charts with indicators
- Trade Panel: Buy/sell interface with strategy execution
- Strategy Manager: Create and manage automated strategies
- Wallet Manager: Fund and manage trading wallets

### 2. DexV2 (`/dexv2`)
DEX trading interface for Raydium and Jupiter.

**Features**:
- Real-time pool feed
- New token creation feed
- KOL trade tracking
- Interactive trading charts
- Order book visualization
- Trade execution
- Token migration tracking

### 3. Bundler (`/bundler`)
Token bundle launcher for coordinated token launches.

**Features**:
- Multi-token launch setup
- Wallet generation and funding
- Metadata creation and IPFS upload
- Vanity address generation
- Lookup table creation
- Bundle transaction building
- Launch coordination
- Holder tracking
- Comment integration

**Workflow**:
1. Setup: Configure token metadata, images, social links
2. Wallet Setup: Generate and fund wallets
3. Preview: Review launch configuration
4. Launch: Execute bundle transaction
5. Trade: Monitor and manage launched tokens

### 4. Bump Bot (`/bump`)
Automated token bumping bot for Pump.fun visibility.

**Features**:
- Automated token bumping
- Configurable bump amount and interval
- Real-time trade tracking
- Token information display
- Balance monitoring
- Transaction history
- Start/stop bot controls

**Configuration**:
- Bump Amount: SOL amount per bump (default: 0.022)
- Bump Interval: Seconds between bumps (default: 7)
- Token Address: Pump.fun token mint address
- Funder Wallet: Private key of funding wallet

---

## Authentication & Rate Limiting

### API Key Authentication
All API endpoints (except public endpoints) require an API key in the header:
```
x-api-key: YOUR_API_KEY
```

API keys are generated via `/generate-api-key` and stored in Supabase. Keys contain encoded wallet addresses for fee collection.

### Tier System
Three tiers with different rate limits and features:

#### Apprentice (Free Tier)
- **Rate Limits**: 5,000 requests/hour for most endpoints
- **Special Limits**: 
  - `/create-ipfs`: 100/hour
  - `/pump-token-bump`: 10,000/hour
  - `/pump-chart`: 15,000/hour
- **Platform Fee**: Standard fee percentage

#### Alchemist (Paid Tier)
- **Rate Limits**: Higher limits on most endpoints
- **Special Limits**:
  - `/pump-token-bump`: 20,000/hour
  - `/create-ipfs`: 5,000/hour
  - `/token-info`: 5,000/hour
- **Platform Fee**: Reduced fee percentage

#### God (Premium Tier)
- **Rate Limits**: Highest limits across all endpoints
- **Special Limits**:
  - `/pump-token-bump`: 20,000/hour
  - `/create-ipfs`: 5,000/hour
- **Platform Fee**: Lowest fee percentage

### Rate Limiter Implementation
- Per-endpoint rate limiting
- Per-tier configuration
- Cached rate limiters for performance
- IP-based and API key-based tracking
- Configurable windows (typically 60 minutes)

---

## Setup & Installation

### Prerequisites
- Node.js 18+ (ES Modules support)
- npm or yarn
- Supabase account and project
- Helius API key (for WebSocket feeds)
- Solana RPC endpoints (Helius, QuickNode, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shrayg/pumpagent.git
cd pumpagent
```

2. **Install client dependencies**
```bash
cd client
npm install
```

3. **Install server dependencies**
```bash
cd ../server
npm install
```

4. **Install WebSocket server dependencies**
```bash
cd ../websocket
npm install
```

### Environment Setup

Create `.env` files in each directory:

#### Client (`.env`)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Server (`.env`)
```env
# Server
PORT=3000

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# RPC Endpoints (comma-separated)
HELIUS_RPCS=https://rpc1.helius.com,https://rpc2.helius.com
QUICKNODE_RPCS=https://rpc1.quicknode.com
SHYFT_RPCS=https://rpc1.shyft.com
ALCHEMY_RPCS=https://rpc1.alchemy.com
CHAINSTACK_RPCS=https://rpc1.chainstack.com

# Fee Configuration
FEE_PERCENTAGE=0.01
ALCHEMIST_FEE_PERCENTAGE=0.005
GOD_FEE_PERCENTAGE=0.0025
FEE_WALLET=your_fee_wallet_address

# JWT
JWT_SECRET=your_jwt_secret

# Other
NODE_ENV=production
```

#### WebSocket Server (`.env`)
```env
PORT=4000
HELIUS_SOCKET_URL=wss://atlas-mainnet.helius-rpc.com/?api-key=your_helius_key
```

### Running the Application

1. **Start the API server**
```bash
cd server
npm start
# Server runs on http://localhost:3000
```

2. **Start the WebSocket server**
```bash
cd websocket
npm start
# WebSocket server runs on http://localhost:4000
```

3. **Start the client**
```bash
cd client
npm start
# Client runs on http://localhost:5173
```

### Production Deployment

- **Client**: Build with `npm run build` and deploy to Vercel, Netlify, or similar
- **Server**: Deploy to Railway, Render, or AWS
- **WebSocket**: Deploy to a persistent server (Railway, Render, or VPS)

---

## Environment Variables

### Server Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `HELIUS_RPCS` | Comma-separated Helius RPC URLs | Yes |
| `QUICKNODE_RPCS` | Comma-separated QuickNode RPC URLs | No |
| `SHYFT_RPCS` | Comma-separated Shyft RPC URLs | No |
| `ALCHEMY_RPCS` | Comma-separated Alchemy RPC URLs | No |
| `CHAINSTACK_RPCS` | Comma-separated Chainstack RPC URLs | No |
| `FEE_PERCENTAGE` | Apprentice tier fee (e.g., 0.01 = 1%) | Yes |
| `ALCHEMIST_FEE_PERCENTAGE` | Alchemist tier fee | Yes |
| `GOD_FEE_PERCENTAGE` | God tier fee | Yes |
| `FEE_WALLET` | Platform fee collection wallet | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### WebSocket Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | WebSocket server port | No (default: 4000) |
| `HELIUS_SOCKET_URL` | Helius WebSocket URL with API key | Yes |

### Client Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

---

## Key Features

### 1. Multi-Wallet Operations
- Generate unlimited wallets
- Batch fund operations
- Parallel transaction execution
- Wallet management and tracking

### 2. Bonding Curve Integration
- Complete Pump.fun bonding curve calculations
- Buy/sell operations with slippage protection
- Real-time curve data
- Token amount calculations

### 3. Transaction Building
- Versioned transaction support
- Address lookup tables (ALTs)
- Priority fee estimation
- Jito bundle support
- Transaction signing and serialization

### 4. Real-Time Data
- WebSocket event streams
- Candlestick chart data
- Trade history
- Holder tracking
- Volume analytics

### 5. IPFS Integration
- Metadata upload
- Image storage
- URI generation
- Content addressing

### 6. DEX Integration
- Raydium V2 SDK integration
- Jupiter aggregator support
- Swap route calculation
- Slippage protection
- Multi-DEX routing

### 7. KOL Tracking
- Pre-configured KOL wallet list
- Real-time trade monitoring
- Strategy automation
- Copy trading signals

### 8. Fee Management
- Tier-based fee structure
- Optional fee charges
- Fee wallet collection
- Profit claiming system

### 9. Security
- API key authentication
- Rate limiting
- Input validation
- Transaction verification
- Secure key storage

### 10. Developer Tools
- Code examples (client & server)
- API documentation
- Test scripts
- Sandbox environment

---

## Development

### Code Structure

#### Server Routes
Each route file exports an Express router with:
- Request validation
- API key checking (via middleware)
- Rate limiting (via middleware)
- Business logic
- Transaction building
- Response formatting

#### Client Components
React components organized by feature:
- **Apps**: Full-featured applications
- **Routes**: Documentation and examples
- **Dashboard**: User management
- **Utils**: Shared utilities

#### WebSocket Handlers
- Event parsing from Helius
- Client subscription management
- Efficient event broadcasting
- Connection management

### Adding New Endpoints

1. Create route file in `server/routes/`
2. Implement router with validation
3. Add route to `server/server.js`
4. Configure rate limits in `server/utils/ratelimiter.js`
5. Add documentation in client

### Testing

Test scripts are available in:
- `server/Sandbox/` - Server-side tests
- `client/src/Sandbox/` - Client-side tests

Run tests individually or integrate with your testing framework.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

[Specify your license here]

---

## Support

For issues, questions, or contributions:
- GitHub Issues: [Link to issues]
- Documentation: https://pumpagent.com
- API Base URL: https://api.pumpagent.com
- WebSocket URL: wss://ws.pumpagent.com

---

## Acknowledgments

- Pump.fun for the token launch platform
- Solana Foundation for blockchain infrastructure
- Helius for RPC and WebSocket services
- Raydium and Jupiter for DEX integration
- All contributors and users of PumpAgent

---

**Built with ❤️ for the Solana ecosystem**
