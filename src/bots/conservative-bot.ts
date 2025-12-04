import { BaseBot } from './base-bot';
import { GameRound, TradeSignal, Position } from '../types/game';
import { BotConfig } from '../config/config';
import { SolanaClient } from '../utils/solana';
import { Logger } from 'winston';

export class ConservativeBot extends BaseBot {
  private readonly targetProfitPercent = 3; // Exit at 3% profit
  private readonly maxHoldTicks = 20; // Max 20 ticks (5 seconds)

  constructor(solanaClient: SolanaClient, config: BotConfig, logger: Logger) {
    super(solanaClient, config, logger);
  }

  getName(): string {
    return 'Conservative';
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

    // Check if we already have a position
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

    // Only enter in early ticks
    if (round.currentTick <= 5 && round.currentMultiplier < 1.1) {
      return {
        action: 'buy',
        roundId: round.roundId,
        reason: 'Early entry opportunity with low multiplier',
        confidence: 0.7,
        timestamp: Date.now(),
      };
    }

    return {
      action: 'hold',
      roundId: round.roundId,
      reason: 'Waiting for better entry point',
      confidence: 0.5,
      timestamp: Date.now(),
    };
  }

  shouldExit(position: Position, currentRound: GameRound): boolean {
    if (currentRound.rugPulled) {
      return true;
    }

    const ticksHeld = currentRound.currentTick - position.entryTick;
    
    // Exit if we've held too long
    if (ticksHeld >= this.maxHoldTicks) {
      return true;
    }

    // Exit if we've reached target profit
    const profitPercent = this.calculateProfitPercent(position, currentRound.currentMultiplier);
    if (profitPercent >= this.targetProfitPercent) {
      return true;
    }

    // Exit if we're at a loss threshold
    if (profitPercent <= -this.config.maxLossThreshold) {
      return true;
    }

    return false;
  }
}

