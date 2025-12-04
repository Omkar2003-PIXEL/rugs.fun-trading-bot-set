import { BaseBot } from './base-bot';
import { GameRound, TradeSignal, Position } from '../types/game';
import { BotConfig } from '../config/config';
import { SolanaClient } from '../utils/solana';
import { Logger } from 'winston';

export class AggressiveBot extends BaseBot {
  private readonly targetProfitPercent = 15; // Exit at 15% profit
  private readonly maxHoldTicks = 100; // Max 100 ticks (25 seconds)
  private readonly minMultiplierToEnter = 1.2; // Only enter if multiplier is already high

  constructor(solanaClient: SolanaClient, config: BotConfig, logger: Logger) {
    super(solanaClient, config, logger);
  }

  getName(): string {
    return 'Aggressive';
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

    // Enter when momentum is building (higher multiplier)
    if (round.currentMultiplier >= this.minMultiplierToEnter && round.currentTick < 50) {
      return {
        action: 'buy',
        roundId: round.roundId,
        reason: `Momentum detected at ${round.currentMultiplier}x multiplier`,
        confidence: 0.8,
        timestamp: Date.now(),
      };
    }

    return {
      action: 'hold',
      roundId: round.roundId,
      reason: 'Waiting for momentum to build',
      confidence: 0.4,
      timestamp: Date.now(),
    };
  }

  shouldExit(position: Position, currentRound: GameRound): boolean {
    if (currentRound.rugPulled) {
      return true;
    }

    const ticksHeld = currentRound.currentTick - position.entryTick;
    const profitPercent = this.calculateProfitPercent(position, currentRound.currentMultiplier);

    // Exit if we've held too long
    if (ticksHeld >= this.maxHoldTicks) {
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

    // Exit if multiplier starts dropping significantly
    if (currentRound.currentMultiplier < position.entryMultiplier * 0.9) {
      return true;
    }

    return false;
  }
}

