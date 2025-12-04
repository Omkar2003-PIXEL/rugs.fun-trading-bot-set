export interface GameRound {
  roundId: string;
  startTime: number;
  currentTick: number;
  totalTicks: number;
  currentMultiplier: number;
  totalPlayers: number;
  totalSolIn: number;
  isActive: boolean;
  rugPulled: boolean;
}

export interface Position {
  roundId: string;
  entryTick: number;
  entryMultiplier: number;
  solAmount: number;
  entryTime: number;
  currentMultiplier: number;
  currentProfit: number;
  currentProfitPercent: number;
}

export interface TradeSignal {
  action: 'buy' | 'sell' | 'hold';
  roundId: string;
  reason: string;
  confidence: number; // 0-1
  timestamp: number;
}

