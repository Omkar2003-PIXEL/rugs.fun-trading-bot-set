import * as dotenv from 'dotenv';

dotenv.config();

export interface BotConfig {
  rpcUrl: string;
  walletPath?: string;
  privateKey?: string;
  botType: 'conservative' | 'aggressive' | 'timing' | 'momentum';
  maxPositionSize: number; // SOL
  minProfitThreshold: number; // percentage
  maxLossThreshold: number; // percentage
  tickInterval: number; // milliseconds (default 250ms)
  rugPullChance: number; // 0.05% per tick
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const defaultConfig: BotConfig = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  walletPath: process.env.WALLET_PATH,
  privateKey: process.env.PRIVATE_KEY,
  botType: (process.env.BOT_TYPE as BotConfig['botType']) || 'conservative',
  maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '0.1'),
  minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD || '5'),
  maxLossThreshold: parseFloat(process.env.MAX_LOSS_THRESHOLD || '10'),
  tickInterval: parseInt(process.env.TICK_INTERVAL || '250'),
  rugPullChance: 0.0005, // 0.05%
  enableLogging: process.env.ENABLE_LOGGING !== 'false',
  logLevel: (process.env.LOG_LEVEL as BotConfig['logLevel']) || 'info',
};

export function loadConfig(): BotConfig {
  return { ...defaultConfig };
}

