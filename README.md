# Rugs.fun Trading Bot

A TypeScript/Node.js trading bot for the rugs.fun platform with multiple trading strategies.

## Features

- **Multiple Bot Strategies**: Choose from 4 different trading strategies
  - **Conservative**: Exits early with small profits (3% target)
  - **Aggressive**: Holds longer for bigger gains (15% target)
  - **Timing**: Uses specific tick intervals for entry/exit
  - **Momentum**: Follows momentum patterns and trends

- **Solana Integration**: Built on Solana Web3.js for blockchain interactions
- **Configurable**: Easy configuration via environment variables
- **Logging**: Comprehensive logging with Winston
- **Risk Management**: Built-in position sizing and loss thresholds

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Solana wallet with some SOL for trading
- Solana RPC endpoint (can use public or private RPC)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/michalstefanow/rugs.fun-trading-bot-set.git
cd rugs.fun-trading-bot-set
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Create a `.env` file in the root directory:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_PATH=./wallet.json
# OR use private key directly (less secure)
# PRIVATE_KEY=[1,2,3,...]

# Bot Configuration
BOT_TYPE=conservative
MAX_POSITION_SIZE=0.1
MIN_PROFIT_THRESHOLD=5
MAX_LOSS_THRESHOLD=10

# Logging
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### Bot Types

- `conservative` - Low risk, quick exits
- `aggressive` - Higher risk, bigger targets
- `timing` - Entry/exit at specific ticks
- `momentum` - Follows momentum patterns

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `WALLET_PATH` | Path to wallet JSON file | Required |
| `PRIVATE_KEY` | Wallet private key (JSON array) | Alternative to WALLET_PATH |
| `BOT_TYPE` | Bot strategy type | `conservative` |
| `MAX_POSITION_SIZE` | Maximum SOL per position | `0.1` |
| `MIN_PROFIT_THRESHOLD` | Minimum profit % to exit | `5` |
| `MAX_LOSS_THRESHOLD` | Maximum loss % before exit | `10` |
| `ENABLE_LOGGING` | Enable/disable logging | `true` |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | `info` |

## Usage

### Development Mode

Run in development mode with TypeScript:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

### Watch Mode

Build and watch for changes:
```bash
npm run watch
```

## Project Structure

```
rug.fun/
├── src/
│   ├── bots/              # Bot strategy implementations
│   │   ├── base-bot.ts    # Base bot class
│   │   ├── conservative-bot.ts
│   │   ├── aggressive-bot.ts
│   │   ├── timing-bot.ts
│   │   └── momentum-bot.ts
│   ├── config/            # Configuration management
│   ├── services/          # Core services
│   │   ├── game-monitor.ts
│   │   └── bot-manager.ts
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   ├── solana.ts
│   │   └── logger.ts
│   └── index.ts           # Main entry point
├── dist/                  # Compiled JavaScript (generated)
├── logs/                  # Log files (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Game Monitor**: Monitors rugs.fun game rounds, tracking ticks, multipliers, and rug pull events
2. **Bot Analysis**: Each bot analyzes rounds and generates buy/sell signals based on its strategy
3. **Position Management**: The bot manager executes trades and manages positions
4. **Risk Management**: Built-in safeguards prevent excessive losses

## Bot Strategies Explained

### Conservative Bot
- Enters early (first 5 ticks)
- Exits at 3% profit or after 20 ticks
- Low risk, consistent small gains

### Aggressive Bot
- Enters when momentum builds (multiplier > 1.2x)
- Targets 15% profit
- Holds up to 100 ticks
- Higher risk/reward

### Timing Bot
- Enters at specific ticks: 1, 5, 10, 15
- Exits at planned ticks: 10, 20, 30, 40
- Systematic approach

### Momentum Bot
- Analyzes multiplier trends
- Enters on strong positive momentum (>5% increase)
- Exits on momentum reversal
- Trend-following strategy

## Important Notes

⚠️ **DISCLAIMER**: Trading bots involve financial risk. This bot is for educational purposes. Always:
- Test thoroughly before using real funds
- Start with small amounts
- Monitor the bot closely
- Understand the risks involved
- The rugs.fun platform has inherent risks (rug pulls)

## Security

- Never commit your `.env` file or wallet files
- Use environment variables for sensitive data
- Consider using a hardware wallet for larger amounts
- Keep your private keys secure

## Troubleshooting

### Insufficient Balance
Make sure your wallet has enough SOL for:
- Transaction fees
- Position sizes
- Gas costs

### RPC Connection Issues
- Check your RPC URL
- Consider using a private RPC for better reliability
- Public RPCs may have rate limits

### Bot Not Trading
- Check logs in `logs/` directory
- Verify wallet configuration
- Ensure bot is receiving game round updates

## Development

### Adding a New Bot Strategy

1. Create a new bot class extending `BaseBot`:
```typescript
export class MyBot extends BaseBot {
  getName(): string {
    return 'MyBot';
  }
  
  analyzeRound(round: GameRound): TradeSignal {
    // Your strategy logic
  }
  
  shouldExit(position: Position, round: GameRound): boolean {
    // Your exit logic
  }
}
```

2. Add it to `src/bots/index.ts`
3. Add the bot type to `BotConfig` interface
4. Add case in `createBot()` function in `src/index.ts`

