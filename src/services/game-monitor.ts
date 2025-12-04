import { EventEmitter } from 'events';
import { GameRound } from '../types/game';
import { Logger } from 'winston';

export class GameMonitor extends EventEmitter {
  private logger: Logger;
  private currentRound: GameRound | null = null;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly tickInterval = 250; // 250ms per tick
  private readonly rugPullChance = 0.0005; // 0.05% per tick

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  start(): void {
    this.logger.info('Starting game monitor...');
    this.createNewRound();
    this.monitorInterval = setInterval(() => this.tick(), this.tickInterval);
  }

  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.logger.info('Game monitor stopped');
  }

  private createNewRound(): void {
    const roundId = `round-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentRound = {
      roundId,
      startTime: Date.now(),
      currentTick: 0,
      totalTicks: 0,
      currentMultiplier: 1.0,
      totalPlayers: Math.floor(Math.random() * 100) + 10,
      totalSolIn: Math.random() * 10 + 1,
      isActive: true,
      rugPulled: false,
    };

    this.logger.info(`New round created: ${roundId}`);
    this.emit('roundStart', this.currentRound);
  }

  private tick(): void {
    if (!this.currentRound || !this.currentRound.isActive) {
      return;
    }

    // Check for rug pull
    if (Math.random() < this.rugPullChance) {
      this.currentRound.rugPulled = true;
      this.currentRound.isActive = false;
      this.logger.warn(`Rug pulled at tick ${this.currentRound.currentTick} in round ${this.currentRound.roundId}`);
      this.emit('rugPull', this.currentRound);
      this.createNewRound();
      return;
    }

    // Update round state
    this.currentRound.currentTick++;
    this.currentRound.totalTicks++;
    
    // Calculate multiplier (exponential growth with some randomness)
    const baseMultiplier = 1.0 + (this.currentRound.currentTick * 0.01);
    const randomFactor = 1.0 + (Math.random() - 0.5) * 0.02; // ±1% randomness
    this.currentRound.currentMultiplier = baseMultiplier * randomFactor;

    // Update other stats
    this.currentRound.totalPlayers += Math.floor(Math.random() * 3);
    this.currentRound.totalSolIn += Math.random() * 0.5;

    // Emit tick event
    this.emit('tick', this.currentRound);

    // Create new round after certain duration (simulate round ending)
    if (this.currentRound.currentTick >= 200) {
      this.currentRound.isActive = false;
      this.logger.info(`Round ${this.currentRound.roundId} ended naturally at tick ${this.currentRound.currentTick}`);
      this.emit('roundEnd', this.currentRound);
      this.createNewRound();
    }
  }

  getCurrentRound(): GameRound | null {
    return this.currentRound;
  }
}

