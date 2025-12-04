import { SolanaClient } from './utils/solana';
import { createLogger } from './utils/logger';
import { loadConfig, BotConfig } from './config/config';
import { GameMonitor } from './services/game-monitor';
import { BotManager } from './services/bot-manager';
import {
  ConservativeBot,
  AggressiveBot,
  TimingBot,
  MomentumBot,
  BaseBot,
} from './bots';

function createBot(
  botType: BotConfig['botType'],
  solanaClient: SolanaClient,
  config: BotConfig,
  logger: any
): BaseBot {
  switch (botType) {
    case 'conservative':
      return new ConservativeBot(solanaClient, config, logger);
    case 'aggressive':
      return new AggressiveBot(solanaClient, config, logger);
    case 'timing':
      return new TimingBot(solanaClient, config, logger);
    case 'momentum':
      return new MomentumBot(solanaClient, config, logger);
    default:
      throw new Error(`Unknown bot type: ${botType}`);
  }
}

async function main() {
  const config = loadConfig();
  const logger = createLogger(config);

  logger.info('=== Rugs.fun Trading Bot ===');
  logger.info(`Bot Type: ${config.botType}`);
  logger.info(`RPC URL: ${config.rpcUrl}`);

  try {
    // Initialize Solana client
    const solanaClient = new SolanaClient(config);
    const walletAddress = solanaClient.getWalletAddress();
    logger.info(`Wallet Address: ${walletAddress.toString()}`);

    const balance = await solanaClient.getBalance();
    logger.info(`Wallet Balance: ${balance} SOL`);

    if (balance < 0.01) {
      logger.warn('Low balance detected. Make sure you have enough SOL to trade.');
    }

    // Create bot instance
    const bot = createBot(config.botType, solanaClient, config, logger);
    logger.info(`Created ${bot.getName()} bot`);

    // Create game monitor
    const gameMonitor = new GameMonitor(logger);

    // Create bot manager
    const botManager = new BotManager(bot, gameMonitor, solanaClient, config, logger);

    // Start the bot
    await botManager.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await botManager.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await botManager.stop();
      process.exit(0);
    });

    // Keep the process alive
    logger.info('Bot is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the bot
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };

