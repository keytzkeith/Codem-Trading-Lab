import { CalculatedStats, SingleTrade, Experiment, MonteCarloConfig, MonteCarloSimulationResult } from '../types/trade';

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

export function runMonteCarloSimulation(
  trades: SingleTrade[],
  configInput?: Partial<MonteCarloConfig>
): MonteCarloSimulationResult {
  const config: MonteCarloConfig = {
    simulationsCount: configInput?.simulationsCount || 1000,
    tradesPerRun: configInput?.tradesPerRun || 50,
    profitTargetR: configInput?.profitTargetR || 10,
    maxDrawdownR: configInput?.maxDrawdownR || 8,
    riskPercent: configInput?.riskPercent || 1.0,
  };

  const tradeReturns = trades.map((t) => t.realizedRR);
  const samplePool = tradeReturns.length > 0 ? tradeReturns : [2.0, -1.0, 2.0, -1.0, 0.0, 2.5, -1.0];

  let passCount = 0;
  let ruinCount = 0;
  let neitherCount = 0;

  const finalReturns: number[] = [];
  const maxDrawdowns: number[] = [];
  // Matrix of [simIndex][tradeIndex] = cumulative R
  const allPaths: number[][] = [];

  for (let sim = 0; sim < config.simulationsCount; sim++) {
    let cumR = 0;
    let peakR = 0;
    let maxDD = 0;
    let passed = false;
    let ruined = false;

    const path: number[] = [0];

    for (let step = 1; step <= config.tradesPerRun; step++) {
      const randomIndex = Math.floor(Math.random() * samplePool.length);
      const sampledR = samplePool[randomIndex];
      cumR += sampledR;

      if (cumR > peakR) {
        peakR = cumR;
      }
      const dd = peakR - cumR;
      if (dd > maxDD) {
        maxDD = dd;
      }

      if (!passed && !ruined) {
        if (cumR >= config.profitTargetR) {
          passed = true;
        } else if (dd >= config.maxDrawdownR) {
          ruined = true;
        }
      }

      path.push(Number(cumR.toFixed(2)));
    }

    if (passed) passCount++;
    else if (ruined) ruinCount++;
    else neitherCount++;

    finalReturns.push(cumR);
    maxDrawdowns.push(maxDD);
    allPaths.push(path);
  }

  finalReturns.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);

  const getPercentile = (sortedArr: number[], p: number) => {
    const idx = Math.min(Math.floor((p / 100) * sortedArr.length), sortedArr.length - 1);
    return sortedArr[idx];
  };

  const medianFinalR = Number(getPercentile(finalReturns, 50).toFixed(1));
  const top95FinalR = Number(getPercentile(finalReturns, 95).toFixed(1));
  const bottom5FinalR = Number(getPercentile(finalReturns, 5).toFixed(1));

  const medianMaxDrawdown = Number(getPercentile(maxDrawdowns, 50).toFixed(1));
  const worstMaxDrawdown = Number(getPercentile(maxDrawdowns, 95).toFixed(1));

  // Compute fan chart percentiles for each trade index 0..tradesPerRun
  const fanChartData: MonteCarloSimulationResult['fanChartData'] = [];
  for (let step = 0; step <= config.tradesPerRun; step++) {
    const valuesAtStep = allPaths.map((p) => p[step]).sort((a, b) => a - b);
    fanChartData.push({
      tradeIndex: step,
      p95: Number(getPercentile(valuesAtStep, 95).toFixed(2)),
      median: Number(getPercentile(valuesAtStep, 50).toFixed(2)),
      p5: Number(getPercentile(valuesAtStep, 5).toFixed(2)),
      path1: allPaths[0] ? allPaths[0][step] : undefined,
      path2: allPaths[1] ? allPaths[1][step] : undefined,
      path3: allPaths[2] ? allPaths[2][step] : undefined,
    });
  }

  const passProbability = Number(((passCount / config.simulationsCount) * 100).toFixed(1));
  const ruinProbability = Number(((ruinCount / config.simulationsCount) * 100).toFixed(1));
  const neitherProbability = Number(((neitherCount / config.simulationsCount) * 100).toFixed(1));

  return {
    simulationsCount: config.simulationsCount,
    tradesPerRun: config.tradesPerRun,
    profitTargetR: config.profitTargetR,
    maxDrawdownR: config.maxDrawdownR,
    riskPercent: config.riskPercent,
    passCount,
    passProbability,
    ruinCount,
    ruinProbability,
    neitherCount,
    neitherProbability,
    medianFinalR,
    top95FinalR,
    bottom5FinalR,
    medianMaxDrawdown,
    worstMaxDrawdown,
    fanChartData,
  };
}

export function calculateSessionDayHeatmap(trades: SingleTrade[]) {
  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const sessions: SingleTrade['session'][] = [
    'London',
    'New York Open',
    'New York PM',
    'Asian',
    'London/NY Overlap',
  ];

  const matrix: Record<string, { trades: number; wins: number; totalWinR: number; totalLossR: number; netR: number }> = {};
  const dayStats: Record<string, { trades: number; wins: number; totalWinR: number; totalLossR: number; netR: number }> = {};
  const sessionStats: Record<string, { trades: number; wins: number; totalWinR: number; totalLossR: number; netR: number }> = {};

  // Initialize keys
  days.forEach((d) => {
    dayStats[d] = { trades: 0, wins: 0, totalWinR: 0, totalLossR: 0, netR: 0 };
    sessions.forEach((s) => {
      matrix[`${d}_${s}`] = { trades: 0, wins: 0, totalWinR: 0, totalLossR: 0, netR: 0 };
    });
  });

  sessions.forEach((s) => {
    sessionStats[s] = { trades: 0, wins: 0, totalWinR: 0, totalLossR: 0, netR: 0 };
  });

  trades.forEach((t) => {
    let dayKey: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Weekend' = 'Wed';
    if (t.date) {
      try {
        const dObj = new Date(t.date.includes('T') ? t.date : `${t.date}T12:00:00Z`);
        const dayNum = dObj.getUTCDay();
        if (dayNum === 1) dayKey = 'Mon';
        else if (dayNum === 2) dayKey = 'Tue';
        else if (dayNum === 3) dayKey = 'Wed';
        else if (dayNum === 4) dayKey = 'Thu';
        else if (dayNum === 5) dayKey = 'Fri';
        else dayKey = 'Weekend';
      } catch (e) {
        dayKey = 'Wed';
      }
    }

    const sess = t.session || 'London';
    const r = t.realizedRR;

    if (dayKey !== 'Weekend') {
      const cellKey = `${dayKey}_${sess}`;
      if (matrix[cellKey]) {
        matrix[cellKey].trades++;
        matrix[cellKey].netR += r;
        if (r > 0) {
          matrix[cellKey].wins++;
          matrix[cellKey].totalWinR += r;
        } else if (r < 0) {
          matrix[cellKey].totalLossR += Math.abs(r);
        }
      }

      if (dayStats[dayKey]) {
        dayStats[dayKey].trades++;
        dayStats[dayKey].netR += r;
        if (r > 0) {
          dayStats[dayKey].wins++;
          dayStats[dayKey].totalWinR += r;
        } else if (r < 0) {
          dayStats[dayKey].totalLossR += Math.abs(r);
        }
      }
    }

    if (sessionStats[sess]) {
      sessionStats[sess].trades++;
      sessionStats[sess].netR += r;
      if (r > 0) {
        sessionStats[sess].wins++;
        sessionStats[sess].totalWinR += r;
      } else if (r < 0) {
        sessionStats[sess].totalLossR += Math.abs(r);
      }
    }
  });

  const cells = days.flatMap((day) => {
    return sessions.map((session) => {
      const cell = matrix[`${day}_${session}`] || { trades: 0, wins: 0, totalWinR: 0, totalLossR: 0, netR: 0 };
      const winRate = cell.trades > 0 ? Number(((cell.wins / cell.trades) * 100).toFixed(1)) : 0;
      const lossCount = cell.trades - cell.wins;
      const avgWin = cell.wins > 0 ? cell.totalWinR / cell.wins : 0;
      const avgLoss = lossCount > 0 ? cell.totalLossR / lossCount : 1;
      const exp = cell.trades > 0 ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss : 0;

      return {
        day,
        session,
        tradesCount: cell.trades,
        winsCount: cell.wins,
        winRate,
        netR: Number(cell.netR.toFixed(1)),
        expectancy: Number(exp.toFixed(2)),
      };
    });
  });

  // Calculate high/low takeaways
  let bestCell = cells[0];
  let worstCell = cells[0];

  cells.forEach((c) => {
    if (c.tradesCount > 0) {
      if (c.netR > bestCell.netR) bestCell = c;
      if (c.netR < worstCell.netR) worstCell = c;
    }
  });

  return {
    cells,
    days,
    sessions,
    dayStats,
    sessionStats,
    bestCell,
    worstCell,
  };
}
