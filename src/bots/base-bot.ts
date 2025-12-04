import { SolanaClient } from '../utils/solana';
import { Logger } from 'winston';
import { BotConfig } from '../config/config';
import { GameRound, Position, TradeSignal } from '../types/game';

export abstract class BaseBot {
  protected solanaClient: SolanaClient;
  protected config: BotConfig;
  protected logger: Logger;
  protected positions: Map<string, Position> = new Map();
  protected isRunning: boolean = false;

  constructor(solanaClient: SolanaClient, config: BotConfig, logger: Logger) {
    this.solanaClient = solanaClient;
    this.config = config;
    this.logger = logger;
  }

  abstract getName(): string;
  abstract analyzeRound(round: GameRound): TradeSignal;
  abstract shouldExit(position: Position, currentRound: GameRound): boolean;

  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info(`${this.getName()} bot started`);
    await this.initialize();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info(`${this.getName()} bot stopped`);
    await this.cleanup();
  }

  protected async initialize(): Promise<void> {
    const balance = await this.solanaClient.getBalance();
    this.logger.info(`Wallet balance: ${balance} SOL`);
    this.logger.info(`Bot type: ${this.config.botType}`);
    this.logger.info(`Max position size: ${this.config.maxPositionSize} SOL`);
  }

  protected async cleanup(): Promise<void> {
    // Close all open positions if needed
    for (const [roundId, position] of this.positions.entries()) {
      this.logger.warn(`Closing position in round ${roundId} during cleanup`);
      // Implement position closing logic here
    }
  }

  protected calculateProfit(position: Position, currentMultiplier: number): number {
    const profitMultiplier = currentMultiplier / position.entryMultiplier;
    return position.solAmount * profitMultiplier - position.solAmount;
  }

  protected calculateProfitPercent(position: Position, currentMultiplier: number): number {
    const profitMultiplier = currentMultiplier / position.entryMultiplier;
    return (profitMultiplier - 1) * 100;
  }

  public updatePosition(position: Position, currentMultiplier: number): void {
    position.currentMultiplier = currentMultiplier;
    position.currentProfit = this.calculateProfit(position, currentMultiplier);
    position.currentProfitPercent = this.calculateProfitPercent(position, currentMultiplier);
  }

  public addPosition(position: Position): void {
    this.positions.set(position.roundId, position);
    this.logger.info(`Opened position in round ${position.roundId}`, {
      entryTick: position.entryTick,
      solAmount: position.solAmount,
      entryMultiplier: position.entryMultiplier,
    });
  }

  public removePosition(roundId: string): void {
    const position = this.positions.get(roundId);
    if (position) {
      this.positions.delete(roundId);
      this.logger.info(`Closed position in round ${roundId}`, {
        profit: position.currentProfit,
        profitPercent: position.currentProfitPercent,
      });
    }
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}

