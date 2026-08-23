import { Experiment, TradeType } from '../types/trade';

export function getNextUniqueExperimentId(
  existingExperiments: Experiment[],
  type: TradeType = 'backtest'
): string {
  const prefix = type === 'live' ? 'LT' : 'BT';
  const existingIds = new Set(existingExperiments.map((e) => e.id.trim().toUpperCase()));

  // Extract all numbers for the given prefix
  let maxNum = 0;
  existingExperiments.forEach((exp) => {
    const match = exp.id.match(/^(?:BT|LT|FT)-0*(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  let nextNum = Math.max(maxNum + 1, 1);
  let candidate = `${prefix}-${nextNum.toString().padStart(3, '0')}`;

  while (existingIds.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
  }

  return candidate;
}

export function deduplicateExperiments(experiments: Experiment[]): Experiment[] {
  const seenIds = new Set<string>();
  return experiments.map((exp, index) => {
    let cleanId = exp.id || `EXP-${index + 1}`;
    let uniqueId = cleanId;
    let counter = 1;

    while (seenIds.has(uniqueId)) {
      uniqueId = `${cleanId}-${counter}`;
      counter++;
    }
    seenIds.add(uniqueId);

    // Also deduplicate trade IDs inside the experiment
    const seenTradeIds = new Set<string>();
    const sanitizedTrades = exp.trades.map((tr, tIdx) => {
      let tId = tr.id || `tr-${uniqueId}-${tIdx + 1}`;
      let tCounter = 1;
      while (seenTradeIds.has(tId)) {
        tId = `tr-${uniqueId}-${tIdx + 1}-${tCounter}`;
        tCounter++;
      }
      seenTradeIds.add(tId);
      return { ...tr, id: tId };
    });

    return {
      ...exp,
      id: uniqueId,
      trades: sanitizedTrades,
    };
  });
}
