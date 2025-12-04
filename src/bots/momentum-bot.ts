import { BaseBot } from './base-bot';
import { GameRound, TradeSignal, Position } from '../types/game';
import { BotConfig } from '../config/config';
import { SolanaClient } from '../utils/solana';
import { Logger } from 'winston';

export class MomentumBot extends BaseBot {
  private readonly minMomentumIncrease = 0.05; // 5% increase per tick
  private readonly maxMomentumDecrease = 0.02; // Exit if drops 2% per tick
  private readonly targetProfitPercent = 12;
  private roundHistory: Map<string, number[]> = new Map(); // Track multiplier history

  constructor(solanaClient: SolanaClient, config: BotConfig, logger: Logger) {
    super(solanaClient, config, logger);
  }

  getName(): string {
    return 'Momentum';
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

    // Track multiplier history
    if (!this.roundHistory.has(round.roundId)) {
      this.roundHistory.set(round.roundId, []);
    }
    const history = this.roundHistory.get(round.roundId)!;
    history.push(round.currentMultiplier);

    // Need at least 3 ticks to calculate momentum
    if (history.length < 3) {
      return {
        action: 'hold',
        roundId: round.roundId,
        reason: 'Gathering momentum data',
        confidence: 0.3,
        timestamp: Date.now(),
      };
    }

    // Calculate momentum (rate of change)
    const recent = history.slice(-3);
    const momentum = (recent[2] - recent[0]) / recent[0];

    // Enter if strong positive momentum
    if (momentum >= this.minMomentumIncrease && round.currentTick < 60) {
      return {
        action: 'buy',
        roundId: round.roundId,
        reason: `Strong momentum detected: ${(momentum * 100).toFixed(2)}%`,
        confidence: 0.85,
        timestamp: Date.now(),
      };
    }

    return {
      action: 'hold',
      roundId: round.roundId,
      reason: `Momentum insufficient: ${(momentum * 100).toFixed(2)}%`,
      confidence: 0.4,
      timestamp: Date.now(),
    };
  }

  shouldExit(position: Position, currentRound: GameRound): boolean {
    if (currentRound.rugPulled) {
      return true;
    }

    const profitPercent = this.calculateProfitPercent(position, currentRound.currentMultiplier);

    // Exit if we've reached target profit
    if (profitPercent >= this.targetProfitPercent) {
      return true;
    }

    // Exit if loss exceeds threshold
    if (profitPercent <= -this.config.maxLossThreshold) {
      return true;
    }

    // Check for negative momentum
    const history = this.roundHistory.get(currentRound.roundId);
    if (history && history.length >= 3) {
      const recent = history.slice(-3);
      const momentum = (recent[2] - recent[0]) / recent[0];
      
      // Exit if momentum turns negative
      if (momentum <= -this.maxMomentumDecrease) {
        return true;
      }
    }

    return false;
  }

  protected async cleanup(): Promise<void> {
    await super.cleanup();
    this.roundHistory.clear();
  }
}

