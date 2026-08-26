export type TradeType = 'backtest' | 'live' | 'forward_test';

export type VerdictType = 'KEEP' | 'KEEP_TESTING' | 'DISCARD' | 'MODIFY_PARAMS';

export type SessionType = 'London' | 'New York Open' | 'New York PM' | 'Asian' | 'London/NY Overlap';

export type TimeframeType = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type TradeDirection = 'Long' | 'Short';

export type TradeResult = 'Win' | 'Loss' | 'Breakeven';

export interface SingleTrade {
  id: string;
  tradeNumber: number;
  date: string;
  pair: string;
  session: SessionType;
  direction: TradeDirection;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  plannedRR: number;
  realizedRR: number; // e.g. +2.4, -1.0, 0.0
  result: TradeResult;
  screenshotUrl?: string;
  notes?: string;
  tags?: string[];
  setupRuleFollowed?: boolean;
}

export interface Experiment {
  id: string; // e.g. "BT-028" or "LT-007"
  title: string;
  type: TradeType;
  pair: string;
  timeframe: TimeframeType;
  session: SessionType;
  setupModel: string; // e.g. "Liquidity Sweep + M5 Displacement"
  startDate: string;
  endDate?: string;
  sampleSize: number;
  trades: SingleTrade[];
  keyFinding: string;
  hypotheses?: string;
  verdict: VerdictType;
  verdictNotes?: string;
  screenshotUrls: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedToWhatsApp?: boolean;
  publishedAt?: string;
}

export interface CalculatedStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number; // percentage, e.g. 47.0
  lossRate: number;
  avgWinRR: number;
  avgLossRR: number;
  avgRR: number; // planned or realized win avg
  netR: number; // sum of realizedRR, e.g. +31.2R
  expectancy: number; // (WinRate * AvgWin) - (LossRate * AvgLoss) in R
  profitFactor: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  maxDrawdownR: number;
  equityCurve: { tradeNum: number; r: number; cumulativeR: number; drawdown: number; result: TradeResult }[];
}

export interface WhatsAppReportTemplate {
  id: string;
  name: string;
  description: string;
}

export interface MonteCarloConfig {
  simulationsCount: number; // e.g. 1000
  tradesPerRun: number; // e.g. 50
  profitTargetR: number; // e.g. 10R (+10% on 1% risk)
  maxDrawdownR: number; // e.g. 8R or 10R (-8% / -10%)
  riskPercent: number; // e.g. 1% or 0.5%
}

export interface MonteCarloSimulationResult {
  simulationsCount: number;
  tradesPerRun: number;
  profitTargetR: number;
  maxDrawdownR: number;
  riskPercent: number;
  passCount: number;
  passProbability: number; // %
  ruinCount: number;
  ruinProbability: number; // %
  neitherCount: number;
  neitherProbability: number; // %
  medianFinalR: number;
  top95FinalR: number;
  bottom5FinalR: number;
  medianMaxDrawdown: number;
  worstMaxDrawdown: number;
  fanChartData: {
    tradeIndex: number;
    p95: number;
    median: number;
    p5: number;
    path1?: number;
    path2?: number;
    path3?: number;
  }[];
}

export interface HeatmapCellData {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Weekend';
  session: SessionType;
  tradesCount: number;
  winsCount: number;
  winRate: number;
  netR: number;
  expectancy: number;
}
