import { Experiment, SingleTrade, SessionType, TradeDirection, TradeResult } from '../types/trade';

function generateSimulatedTrades(
  expId: string,
  count: number,
  pair: string,
  session: SessionType,
  targetWinRate: number,
  avgWinR: number,
  avgLossR: number = 1.0,
  timeframe: string = 'M5'
): SingleTrade[] {
  const trades: SingleTrade[] = [];
  const baseDate = new Date(2026, 6, 1);

  for (let i = 1; i <= count; i++) {
    const isWin = Math.random() < targetWinRate;
    const isBE = !isWin && Math.random() < 0.08;
    const direction: TradeDirection = Math.random() > 0.45 ? 'Long' : 'Short';
    
    let realizedRR = 0;
    let result: TradeResult = 'Loss';

    if (isWin) {
      result = 'Win';
      const variance = (Math.random() - 0.5) * 0.8;
      realizedRR = Number((avgWinR + variance).toFixed(2));
    } else if (isBE) {
      result = 'Breakeven';
      realizedRR = 0;
    } else {
      result = 'Loss';
      const variance = (Math.random() - 0.5) * 0.2;
      realizedRR = Number((-avgLossR + variance).toFixed(2));
    }

    const tradeDate = new Date(baseDate.getTime() + i * 86400000 * 0.7);
    const dateStr = tradeDate.toISOString().split('T')[0];

    trades.push({
      id: `${expId}-trade-${i}`,
      tradeNumber: i,
      date: dateStr,
      pair,
      session,
      direction,
      entryPrice: pair.includes('JPY') ? 154.2 : pair.includes('XAU') ? 2450.5 : pair.includes('US100') ? 19850 : 1.0845,
      plannedRR: avgWinR,
      realizedRR,
      result,
      notes: isWin
        ? `Clean sweep on ${timeframe}, displacement into FVG, clean target reached.`
        : isBE
        ? `Protected SL after 1R extension, tagged out at BE.`
        : `Choppy liquidity grab, invalidation reached before continuation.`,
      setupRuleFollowed: Math.random() > 0.05,
    });
  }
  return trades;
}

export const INITIAL_EXPERIMENTS: Experiment[] = [
  {
    id: 'BT-028',
    title: 'EURUSD M5 London Sweep + Displacement Model',
    type: 'backtest',
    pair: 'EURUSD',
    timeframe: 'M5',
    session: 'London',
    setupModel: 'Liquidity Sweep + M5 Displacement',
    startDate: '2026-07-01',
    endDate: '2026-08-20',
    sampleSize: 100,
    trades: generateSimulatedTrades('BT-028', 100, 'EURUSD', 'London', 0.47, 2.4, 1.0, 'M5'),
    keyFinding: 'Liquidity sweeps of Asian highs/lows followed by M5 displacement into order blocks produced the strongest Sharpe and win rate during London open (07:00-09:30 UTC).',
    hypotheses: 'Asian session liquidity pools provide clean fuel for London market maker expansion when market structure shifts with volume.',
    verdict: 'KEEP',
    verdictNotes: 'Primary mechanical setup for London desk. Fixed 1:2.4 RR target out-performed trailing stops.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['liquidity-sweep', 'displacement', 'london-open', 'ict-concepts', 'orderblock'],
    createdAt: '2026-08-23T08:00:00Z',
    updatedAt: '2026-08-23T08:00:00Z',
    publishedToWhatsApp: true,
    publishedAt: '2026-08-23T08:30:00Z',
  },
  {
    id: 'BT-014',
    title: 'EURUSD M5 London Killzone Fair Value Gap Retest',
    type: 'backtest',
    pair: 'EURUSD',
    timeframe: 'M5',
    session: 'London',
    setupModel: 'FVG Retest after Market Structure Shift',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    sampleSize: 100,
    trades: generateSimulatedTrades('BT-014', 100, 'EURUSD', 'London', 0.46, 2.3, 1.0, 'M5'),
    keyFinding: 'M5 FVG entries inside London Killzone yielded consistent +18.6R net. Invalidation should be pegged strictly below the swing displacement low.',
    hypotheses: 'Market structure shift confirmation avoids front-running liquidity sweeps.',
    verdict: 'KEEP',
    verdictNotes: 'Solid baseline. Merged with BT-028 for refined filter criteria.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['fvg', 'market-structure-shift', 'london', 'eurusd'],
    createdAt: '2026-07-02T10:00:00Z',
    updatedAt: '2026-07-02T10:00:00Z',
    publishedToWhatsApp: true,
  },
  {
    id: 'BT-022',
    title: 'XAUUSD M5 NY Open Volatility Expansion',
    type: 'backtest',
    pair: 'XAUUSD',
    timeframe: 'M5',
    session: 'New York Open',
    setupModel: 'Gold NY Open Sweep + Breaker Retest',
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    sampleSize: 75,
    trades: generateSimulatedTrades('BT-022', 75, 'XAUUSD', 'New York Open', 0.52, 2.8, 1.0, 'M5'),
    keyFinding: 'High velocity expansion on Gold during 13:30-15:00 UTC. R:R can be safely stretched to 1:2.8 when aligned with Daily Order Block bias.',
    hypotheses: 'Gold NY Open volume cleans out pre-market stops before trending into previous day high/low.',
    verdict: 'KEEP',
    verdictNotes: 'Extremely high expectancy (+0.59R/trade). Highest grossing setup in the lab database.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['gold', 'xauusd', 'ny-open', 'breaker-block', 'high-volatility'],
    createdAt: '2026-08-16T14:15:00Z',
    updatedAt: '2026-08-16T14:15:00Z',
    publishedToWhatsApp: true,
  },
  {
    id: 'BT-009',
    title: 'GBPUSD M15 Breaker Block Retest Model',
    type: 'backtest',
    pair: 'GBPUSD',
    timeframe: 'M15',
    session: 'London/NY Overlap',
    setupModel: 'M15 Breaker Block + HTF Alignment',
    startDate: '2026-05-10',
    endDate: '2026-06-10',
    sampleSize: 60,
    trades: generateSimulatedTrades('BT-009', 60, 'GBPUSD', 'London/NY Overlap', 0.42, 3.1, 1.0, 'M15'),
    keyFinding: 'Higher timeframe breaker retests offer great R:R (3.1R avg), but lower frequency and longer holding periods. Max losing streak reached 6.',
    hypotheses: 'M15 breaker block entries reduce stop outs from noise on lower timeframes.',
    verdict: 'KEEP_TESTING',
    verdictNotes: 'Increase sample size to 150 trades before promoting to live execution playbook.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['gbpusd', 'breaker-block', 'm15', 'overlap-session'],
    createdAt: '2026-06-12T09:00:00Z',
    updatedAt: '2026-06-12T09:00:00Z',
    publishedToWhatsApp: false,
  },
  {
    id: 'BT-031',
    title: 'US100 (Nasdaq) M1 Silver Bullet NY AM',
    type: 'backtest',
    pair: 'US100',
    timeframe: 'M1',
    session: 'New York Open',
    setupModel: 'ICT Silver Bullet 10:00-11:00 AM NY',
    startDate: '2026-08-01',
    endDate: '2026-08-20',
    sampleSize: 50,
    trades: generateSimulatedTrades('BT-031', 50, 'US100', 'New York Open', 0.44, 2.5, 1.0, 'M1'),
    keyFinding: 'Precise 10:00-11:00 AM NY time window produces distinct Fair Value Gaps with rapid target fills. Spread/slippage must be accounted for on M1.',
    hypotheses: 'Algorithmic time-based rebalancing provides high predictability in the 10:00-11:00 window.',
    verdict: 'KEEP_TESTING',
    verdictNotes: 'Needs spread stress-testing on live prop accounts before full size deployment.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['nasdaq', 'us100', 'silver-bullet', 'm1-scalp', 'ny-session'],
    createdAt: '2026-08-21T16:00:00Z',
    updatedAt: '2026-08-21T16:00:00Z',
    publishedToWhatsApp: false,
  },
  {
    id: 'BT-005',
    title: 'USDJPY M5 Asian Session Range Breakout',
    type: 'backtest',
    pair: 'USDJPY',
    timeframe: 'M5',
    session: 'Asian',
    setupModel: 'Tokyo Range Inversion Breakout',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    sampleSize: 40,
    trades: generateSimulatedTrades('BT-005', 40, 'USDJPY', 'Asian', 0.32, 1.5, 1.0, 'M5'),
    keyFinding: 'High false breakout rate during Tokyo session without London participation. Negative expectancy (-0.20R/trade).',
    hypotheses: 'Asian session lack of institutional displacement results in repeated chops and fakeouts.',
    verdict: 'DISCARD',
    verdictNotes: 'Statistically invalid setup. Discarded from Codem Trading active research repository.',
    screenshotUrls: [],
    tags: ['usdjpy', 'asian-session', 'breakout', 'discarded-model'],
    createdAt: '2026-05-01T12:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
    publishedToWhatsApp: false,
  },
  {
    id: 'LT-007',
    title: 'Live Executions: London Killzone Liquidity Sweeps',
    type: 'live',
    pair: 'EURUSD',
    timeframe: 'M5',
    session: 'London',
    setupModel: 'Live Discretionary Sweep Execution',
    startDate: '2026-08-01',
    endDate: '2026-08-22',
    sampleSize: 18,
    trades: generateSimulatedTrades('LT-007', 18, 'EURUSD', 'London', 0.56, 2.3, 1.0, 'M5'),
    keyFinding: 'Live execution metrics closely mirroring BT-028 parameters. Realized execution win rate at 55.6% with +14.2R accumulated.',
    hypotheses: 'Direct execution of BT-028 rules in live market environment confirms forward edge.',
    verdict: 'KEEP',
    verdictNotes: 'Live discipline maintained. 100% adherence to pre-defined stop loss criteria.',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['live-journal', 'real-money', 'prop-execution', 'london-desk'],
    createdAt: '2026-08-22T18:00:00Z',
    updatedAt: '2026-08-22T18:00:00Z',
    publishedToWhatsApp: true,
    publishedAt: '2026-08-22T18:45:00Z',
  }
];

export const STORAGE_KEY = 'codem_trading_lab_experiments_v1';
export const WHATSAPP_GROUPS_KEY = 'codem_whatsapp_groups_v1';

export const DEFAULT_WHATSAPP_GROUPS = [
  'Codem Trading VIP Room',
  'Codem Alpha Research Feed',
  'Personal Trading Journal Log',
  'Prop Firm Backtest Study Group',
  'London Desk Executions'
];
