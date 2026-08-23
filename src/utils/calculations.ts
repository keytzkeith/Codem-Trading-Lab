import { CalculatedStats, SingleTrade, Experiment } from '../types/trade';

export function calculateTradeStats(trades: SingleTrade[]): CalculatedStats {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      lossRate: 0,
      avgWinRR: 0,
      avgLossRR: 0,
      avgRR: 0,
      netR: 0,
      expectancy: 0,
      profitFactor: 0,
      maxConsecutiveLosses: 0,
      maxConsecutiveWins: 0,
      maxDrawdownR: 0,
      equityCurve: [],
    };
  }

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalWinR = 0;
  let totalLossR = 0;
  let netR = 0;

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  let peakCumulativeR = 0;
  let maxDrawdownR = 0;

  const equityCurve: CalculatedStats['equityCurve'] = [
    { tradeNum: 0, r: 0, cumulativeR: 0, drawdown: 0, result: 'Breakeven' },
  ];

  trades.forEach((trade, index) => {
    const r = trade.realizedRR;
    netR += r;

    if (r > 0) {
      wins++;
      totalWinR += r;
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (r < 0) {
      losses++;
      totalLossR += Math.abs(r);
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      breakevens++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    if (netR > peakCumulativeR) {
      peakCumulativeR = netR;
    }
    const currentDrawdown = peakCumulativeR - netR;
    if (currentDrawdown > maxDrawdownR) {
      maxDrawdownR = currentDrawdown;
    }

    equityCurve.push({
      tradeNum: index + 1,
      r: Number(r.toFixed(2)),
      cumulativeR: Number(netR.toFixed(2)),
      drawdown: Number(currentDrawdown.toFixed(2)),
      result: trade.result,
    });
  });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
  const avgWinRR = wins > 0 ? totalWinR / wins : 0;
  const avgLossRR = losses > 0 ? totalLossR / losses : 1; // default risk = 1R
  const avgRR = avgWinRR;

  // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss) in R
  const winProb = winRate / 100;
  const lossProb = lossRate / 100;
  const expectancy = winProb * avgWinRR - lossProb * avgLossRR;

  const profitFactor = totalLossR > 0 ? totalWinR / totalLossR : totalWinR > 0 ? 99.9 : 0;

  return {
    totalTrades,
    wins,
    losses,
    breakevens,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    avgWinRR: Number(avgWinRR.toFixed(2)),
    avgLossRR: Number(avgLossRR.toFixed(2)),
    avgRR: Number(avgRR.toFixed(2)),
    netR: Number(netR.toFixed(1)),
    expectancy: Number(expectancy.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxConsecutiveLosses: maxLossStreak,
    maxConsecutiveWins: maxWinStreak,
    maxDrawdownR: Number(maxDrawdownR.toFixed(1)),
    equityCurve,
  };
}

export function calculateGlobalStats(experiments: Experiment[]) {
  const allTrades: SingleTrade[] = [];
  experiments.forEach((exp) => {
    allTrades.push(...exp.trades);
  });

  const globalTradeStats = calculateTradeStats(allTrades);

  // Group by pair
  const pairStats: Record<string, { totalR: number; trades: number; wins: number }> = {};
  // Group by session
  const sessionStats: Record<string, { totalR: number; trades: number; wins: number }> = {};
  // Group by setup
  const setupStats: Record<string, { totalR: number; trades: number; wins: number }> = {};

  allTrades.forEach((t) => {
    // Pair
    if (!pairStats[t.pair]) pairStats[t.pair] = { totalR: 0, trades: 0, wins: 0 };
    pairStats[t.pair].totalR += t.realizedRR;
    pairStats[t.pair].trades += 1;
    if (t.realizedRR > 0) pairStats[t.pair].wins += 1;

    // Session
    if (!sessionStats[t.session]) sessionStats[t.session] = { totalR: 0, trades: 0, wins: 0 };
    sessionStats[t.session].totalR += t.realizedRR;
    sessionStats[t.session].trades += 1;
    if (t.realizedRR > 0) sessionStats[t.session].wins += 1;
  });

  experiments.forEach((exp) => {
    const sName = exp.setupModel || 'Standard Setup';
    if (!setupStats[sName]) setupStats[sName] = { totalR: 0, trades: 0, wins: 0 };
    exp.trades.forEach((t) => {
      setupStats[sName].totalR += t.realizedRR;
      setupStats[sName].trades += 1;
      if (t.realizedRR > 0) setupStats[sName].wins += 1;
    });
  });

  let bestPair = 'N/A';
  let bestPairR = -Infinity;
  Object.entries(pairStats).forEach(([pair, stat]) => {
    if (stat.trades >= 5 && stat.totalR > bestPairR) {
      bestPairR = stat.totalR;
      bestPair = `${pair} (+${stat.totalR.toFixed(1)}R)`;
    }
  });
  if (bestPair === 'N/A' && Object.keys(pairStats).length > 0) {
    const first = Object.entries(pairStats)[0];
    bestPair = `${first[0]} (${first[1].totalR >= 0 ? '+' : ''}${first[1].totalR.toFixed(1)}R)`;
  }

  let bestSession = 'N/A';
  let bestSessionR = -Infinity;
  Object.entries(sessionStats).forEach(([session, stat]) => {
    if (stat.totalR > bestSessionR) {
      bestSessionR = stat.totalR;
      bestSession = `${session} (+${stat.totalR.toFixed(1)}R)`;
    }
  });

  let bestSetup = 'N/A';
  let bestSetupR = -Infinity;
  Object.entries(setupStats).forEach(([setup, stat]) => {
    if (stat.totalR > bestSetupR) {
      bestSetupR = stat.totalR;
      bestSetup = setup;
    }
  });

  return {
    ...globalTradeStats,
    totalExperiments: experiments.length,
    bestPair,
    bestSession,
    bestSetup,
    pairStats,
    sessionStats,
    setupStats,
  };
}
