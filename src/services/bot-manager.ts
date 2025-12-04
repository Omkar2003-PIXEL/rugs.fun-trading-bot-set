import { BaseBot } from '../bots/base-bot';
import { GameMonitor } from './game-monitor';
import { GameRound, Position, TradeSignal } from '../types/game';
import { Logger } from 'winston';
import { SolanaClient } from '../utils/solana';
import { BotConfig } from '../config/config';

export class BotManager {
  private bot: BaseBot;
  private gameMonitor: GameMonitor;
  private logger: Logger;
  private solanaClient: SolanaClient;
  private config: BotConfig;
  private isRunning: boolean = false;

  constructor(
    bot: BaseBot,
    gameMonitor: GameMonitor,
    solanaClient: SolanaClient,
    config: BotConfig,
    logger: Logger
  ) {
    this.bot = bot;
    this.gameMonitor = gameMonitor;
    this.solanaClient = solanaClient;
    this.config = config;
    this.logger = logger;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.gameMonitor.on('roundStart', (round: GameRound) => {
      this.logger.info(`Round started: ${round.roundId}`);
      this.handleRoundStart(round);
    });

    this.gameMonitor.on('tick', (round: GameRound) => {
      this.handleTick(round);
    });

    this.gameMonitor.on('rugPull', (round: GameRound) => {
      this.logger.warn(`Rug pull detected in round: ${round.roundId}`);
      this.handleRugPull(round);
    });

    this.gameMonitor.on('roundEnd', (round: GameRound) => {
      this.logger.info(`Round ended: ${round.roundId}`);
      this.handleRoundEnd(round);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Bot manager is already running');
      return;
    }

    this.isRunning = true;
    await this.bot.start();
    this.gameMonitor.start();
    this.logger.info('Bot manager started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.gameMonitor.stop();
    await this.bot.stop();
    this.logger.info('Bot manager stopped');
  }

  private async handleRoundStart(round: GameRound): Promise<void> {
    // Analyze new round for entry opportunity
    const signal = this.bot.analyzeRound(round);
    if (signal.action === 'buy') {
      await this.executeBuy(signal, round);
    }
  }

  private async handleTick(round: GameRound): Promise<void> {
    // Check existing positions for exit signals
    const positions = this.bot.getPositions();
    for (const position of positions) {
      if (position.roundId === round.roundId) {
        this.bot.updatePosition(position, round.currentMultiplier);
        
        if (this.bot.shouldExit(position, round)) {
          await this.executeSell(position, round);
        }
      }
    }

    // Check for new entry opportunities
    const signal = this.bot.analyzeRound(round);
    if (signal.action === 'buy' && !this.bot.getPositions().find(p => p.roundId === round.roundId)) {
      await this.executeBuy(signal, round);
    }
  }

  private async handleRugPull(round: GameRound): Promise<void> {
    // Force exit all positions in this round
    const positions = this.bot.getPositions().filter(p => p.roundId === round.roundId);
    for (const position of positions) {
      await this.executeSell(position, round, true);
    }
  }

  private async handleRoundEnd(round: GameRound): Promise<void> {
    // Exit all positions in ended round
    const positions = this.bot.getPositions().filter(p => p.roundId === round.roundId);
    for (const position of positions) {
      await this.executeSell(position, round, true);
    }
  }

  private async executeBuy(signal: TradeSignal, round: GameRound): Promise<void> {
    try {
      const balance = await this.solanaClient.getBalance();
      const positionSize = Math.min(this.config.maxPositionSize, balance * 0.1); // Use max 10% of balance

      if (positionSize < 0.001) {
        this.logger.warn('Insufficient balance to open position');
        return;
      }

      // In a real implementation, this would execute an actual Solana transaction
      // For now, we'll simulate it
      const position: Position = {
        roundId: round.roundId,
        entryTick: round.currentTick,
        entryMultiplier: round.currentMultiplier,
        solAmount: positionSize,
        entryTime: Date.now(),
        currentMultiplier: round.currentMultiplier,
        currentProfit: 0,
        currentProfitPercent: 0,
      };

      this.bot.addPosition(position);
      this.logger.info(`Buy executed: ${positionSize} SOL at ${round.currentMultiplier}x`, {
        roundId: round.roundId,
        tick: round.currentTick,
        confidence: signal.confidence,
      });
    } catch (error) {
      this.logger.error('Error executing buy', { error, signal });
    }
  }

  private async executeSell(position: Position, round: GameRound, forced: boolean = false): Promise<void> {
    try {
      // In a real implementation, this would execute an actual Solana transaction
      this.bot.removePosition(position.roundId);
      
      const reason = forced ? 'Forced exit' : 'Strategy exit';
      this.logger.info(`Sell executed: ${reason}`, {
        roundId: position.roundId,
        entryMultiplier: position.entryMultiplier,
        exitMultiplier: round.currentMultiplier,
        profit: position.currentProfit,
        profitPercent: position.currentProfitPercent.toFixed(2) + '%',
      });
    } catch (error) {
      this.logger.error('Error executing sell', { error, position });
    }
  }

  getBot(): BaseBot {
    return this.bot;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}

