import { BaseBot } from './base-bot';
import { GameRound, TradeSignal, Position } from '../types/game';
import { BotConfig } from '../config/config';
import { SolanaClient } from '../utils/solana';
import { Logger } from 'winston';

export class TimingBot extends BaseBot {
  private readonly entryTicks = [1, 5, 10, 15]; // Specific ticks to enter
  private readonly exitTicks = [10, 20, 30, 40]; // Specific ticks to exit
  private readonly targetProfitPercent = 8;

  constructor(solanaClient: SolanaClient, config: BotConfig, logger: Logger) {
    super(solanaClient, config, logger);
  }

  getName(): string {
    return 'Timing';
  }

  analyzeRound(round: GameRound): TradeSignal {
    if (round.rugPulled || !round.isActive) {
      return {
        action: 'hold',
        roundId: round.roundId,
        reason: 'Round not active or already rug pulled',
        confidence: 1.0,
        timestamp: Date.now(),
      };
    }

    const existingPosition = this.positions.get(round.roundId);
    if (existingPosition) {
      return {
        action: 'hold',
        roundId: round.roundId,
        reason: 'Position already open',
        confidence: 1.0,
        timestamp: Date.now(),
      };
    }

    // Enter at specific tick intervals
    if (this.entryTicks.includes(round.currentTick)) {
      return {
        action: 'buy',
        roundId: round.roundId,
        reason: `Entering at planned tick ${round.currentTick}`,
        confidence: 0.75,
        timestamp: Date.now(),
      };
    }

    return {
      action: 'hold',
      roundId: round.roundId,
      reason: `Waiting for entry tick (current: ${round.currentTick})`,
      confidence: 0.5,
      timestamp: Date.now(),
    };
  }

  shouldExit(position: Position, currentRound: GameRound): boolean {
    if (currentRound.rugPulled) {
      return true;
    }

    const ticksHeld = currentRound.currentTick - position.entryTick;
    const profitPercent = this.calculateProfitPercent(position, currentRound.currentMultiplier);

    // Exit at planned tick intervals
    if (this.exitTicks.includes(currentRound.currentTick)) {
      return true;
    }

    // Exit if we've reached target profit
    if (profitPercent >= this.targetProfitPercent) {
      return true;
    }

    // Exit if loss exceeds threshold
    if (profitPercent <= -this.config.maxLossThreshold) {
      return true;
    }

    // Exit if we've held for a reasonable time and have profit
    if (ticksHeld >= 25 && profitPercent > 2) {
      return true;
    }

    return false;
  }
}

