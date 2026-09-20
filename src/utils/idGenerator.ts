import { Experiment, TradeType } from '../types/trade';
import { deduplicateAndMergeExperiments } from './tradeReconciliation';

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

/**
 * Reconciles and merges duplicate experiments and duplicate trades.
 * Instead of cloning duplicate studies as "BT-001-1", this consolidates them into the root study
 * with clean, unified trade arrays and accurate, merged win rate.
 */
export function deduplicateExperiments(experiments: Experiment[]): Experiment[] {
  return deduplicateAndMergeExperiments(experiments);
}
