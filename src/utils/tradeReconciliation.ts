import { SingleTrade } from '../types/trade';

export interface MatchedTradeComparison {
  existing: SingleTrade;
  incoming: SingleTrade;
  isModified: boolean;
  differences: string[];
}

export interface TradeReconciliationReport {
  totalIncoming: number;
  alreadyImportedCount: number;
  newCount: number;
  modifiedCount: number;
  identicalCount: number;
  newTrades: SingleTrade[];
  modifiedTrades: MatchedTradeComparison[];
  identicalTrades: MatchedTradeComparison[];
  allMatched: MatchedTradeComparison[];
  unmatchedExistingTrades: SingleTrade[];
}

export interface MergeOptions {
  preventDuplicates: boolean;
  updateExisting: boolean;
}

/**
 * Extracts a normalized external identifier from trade id or notes (e.g. FX Replay trade ID or MT5 ticket)
 */
export function extractExternalTradeId(trade: SingleTrade): string | null {
  if (!trade) return null;

  // Pattern 1: id like "fx-101", "fx-101-123456", "fx-268061356"
  const fxIdMatch = trade.id?.match(/^fx-([a-zA-Z0-9_-]+?)(?:-\d{10,})?$/i);
  if (fxIdMatch && fxIdMatch[1]) {
    return `fx:${fxIdMatch[1]}`;
  }

  // Pattern 2: id like "mt5-1019281"
  const mt5IdMatch = trade.id?.match(/^mt5-([a-zA-Z0-9]+)$/i);
  if (mt5IdMatch && mt5IdMatch[1]) {
    return `mt5:${mt5IdMatch[1]}`;
  }

  // Pattern 3: notes like "FX Replay #101" or "FX Replay #268061356"
  if (trade.notes) {
    const fxNotesMatch = trade.notes.match(/FX Replay #([a-zA-Z0-9_-]+)/i);
    if (fxNotesMatch && fxNotesMatch[1]) {
      return `fx:${fxNotesMatch[1]}`;
    }

    const ticketNotesMatch = trade.notes.match(/Ticket[:\s]+([a-zA-Z0-9]+)/i);
    if (ticketNotesMatch && ticketNotesMatch[1]) {
      return `mt5:${ticketNotesMatch[1]}`;
    }
  }

  return null;
}

/**
 * Determines whether two trades represent the identical market transaction
 */
export function areTradesMatching(existing: SingleTrade, incoming: SingleTrade): boolean {
  // 1. Direct ID comparison
  if (existing.id && incoming.id && existing.id === incoming.id) {
    return true;
  }

  // 2. Normalized External ID comparison (FX Replay #ID or MT5 ticket)
  const existingExtId = extractExternalTradeId(existing);
  const incomingExtId = extractExternalTradeId(incoming);
  if (existingExtId && incomingExtId && existingExtId === incomingExtId) {
    return true;
  }

  // 3. Fallback partial ID match (e.g. "fx-101-171234" matches "fx-101")
  if (existing.id && incoming.id) {
    const cleanExisting = existing.id.replace(/^fx-/, '').split('-')[0];
    const cleanIncoming = incoming.id.replace(/^fx-/, '').split('-')[0];
    if (cleanExisting && cleanIncoming && cleanExisting === cleanIncoming && cleanExisting.length > 2) {
      return true;
    }
  }

  // 4. Semantic execution signature:
  // Must match Date, Pair, Direction
  const sameDate = existing.date === incoming.date;
  const samePair = existing.pair?.toUpperCase() === incoming.pair?.toUpperCase();
  const sameDirection = existing.direction === incoming.direction;

  if (sameDate && samePair && sameDirection) {
    // If both have entry prices, compare entry price
    if (existing.entryPrice !== undefined && incoming.entryPrice !== undefined) {
      const priceDiff = Math.abs(existing.entryPrice - incoming.entryPrice);
      const relativeDiff = priceDiff / (existing.entryPrice || 1);
      // For FX, 0.0001 (1 pip) or relative difference < 0.02%
      if (priceDiff < 0.0002 || relativeDiff < 0.0002) {
        return true;
      }
    }

    // If entry prices are not available or identical RR & session match
    if (
      Math.abs(existing.realizedRR - incoming.realizedRR) < 0.05 &&
      existing.session === incoming.session
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detects whether an incoming trade has revised fields compared to the existing record
 */
export function compareTradeFields(
  existing: SingleTrade,
  incoming: SingleTrade
): { isModified: boolean; differences: string[] } {
  const differences: string[] = [];

  // Compare Realized RR
  if (Math.abs((existing.realizedRR || 0) - (incoming.realizedRR || 0)) > 0.01) {
    differences.push(
      `Realized R changed from ${existing.realizedRR >= 0 ? '+' : ''}${existing.realizedRR}R to ${incoming.realizedRR >= 0 ? '+' : ''}${incoming.realizedRR}R`
    );
  }

  // Compare Result
  if (existing.result !== incoming.result) {
    differences.push(`Result changed from ${existing.result} to ${incoming.result}`);
  }

  // Compare Entry Price
  if (
    incoming.entryPrice !== undefined &&
    existing.entryPrice !== undefined &&
    Math.abs(incoming.entryPrice - existing.entryPrice) > 0.00005
  ) {
    differences.push(`Entry price updated from ${existing.entryPrice} to ${incoming.entryPrice}`);
  }

  // Compare Stop Loss
  if (
    incoming.stopLoss !== undefined &&
    existing.stopLoss !== undefined &&
    Math.abs(incoming.stopLoss - existing.stopLoss) > 0.00005
  ) {
    differences.push(`Stop Loss updated from ${existing.stopLoss} to ${incoming.stopLoss}`);
  }

  // Compare Take Profit
  if (
    incoming.takeProfit !== undefined &&
    existing.takeProfit !== undefined &&
    Math.abs(incoming.takeProfit - existing.takeProfit) > 0.00005
  ) {
    differences.push(`Take Profit updated from ${existing.takeProfit} to ${incoming.takeProfit}`);
  }

  // Check for new tags
  if (incoming.tags && incoming.tags.length > 0) {
    const existingTags = new Set((existing.tags || []).map((t) => t.toLowerCase()));
    const newTags = incoming.tags.filter((t) => !existingTags.has(t.toLowerCase()));
    if (newTags.length > 0) {
      differences.push(`New tags added: ${newTags.join(', ')}`);
    }
  }

  return {
    isModified: differences.length > 0,
    differences,
  };
}

/**
 * Deduplicates an incoming array of trades within itself (e.g. if CSV contains repeat rows)
 */
export function deduplicateTradeBatch(trades: SingleTrade[]): SingleTrade[] {
  const uniqueTrades: SingleTrade[] = [];

  for (const trade of trades) {
    const alreadyExists = uniqueTrades.some((u) => areTradesMatching(u, trade));
    if (!alreadyExists) {
      uniqueTrades.push(trade);
    }
  }

  return uniqueTrades;
}

/**
 * Reconciles incoming statement trades against existing experiment trades
 */
export function reconcileTrades(
  existingTrades: SingleTrade[],
  incomingTrades: SingleTrade[]
): TradeReconciliationReport {
  // Deduplicate incoming batch first to ensure clean state
  const cleanIncoming = deduplicateTradeBatch(incomingTrades);

  const matchedSet = new Set<string>();
  const allMatched: MatchedTradeComparison[] = [];
  const newTrades: SingleTrade[] = [];

  for (const incoming of cleanIncoming) {
    const existingMatch = existingTrades.find((ex) => areTradesMatching(ex, incoming));

    if (existingMatch) {
      matchedSet.add(existingMatch.id);
      const comparison = compareTradeFields(existingMatch, incoming);
      allMatched.push({
        existing: existingMatch,
        incoming,
        isModified: comparison.isModified,
        differences: comparison.differences,
      });
    } else {
      newTrades.push(incoming);
    }
  }

  const modifiedTrades = allMatched.filter((m) => m.isModified);
  const identicalTrades = allMatched.filter((m) => !m.isModified);
  const unmatchedExistingTrades = existingTrades.filter((ex) => !matchedSet.has(ex.id));

  return {
    totalIncoming: cleanIncoming.length,
    alreadyImportedCount: allMatched.length,
    newCount: newTrades.length,
    modifiedCount: modifiedTrades.length,
    identicalCount: identicalTrades.length,
    newTrades,
    modifiedTrades,
    identicalTrades,
    allMatched,
    unmatchedExistingTrades,
  };
}

/**
 * Merges incoming trades into existing trades based on reconciliation options
 */
export function mergeReconciledTrades(
  existingTrades: SingleTrade[],
  incomingTrades: SingleTrade[],
  options: MergeOptions = { preventDuplicates: true, updateExisting: true }
): SingleTrade[] {
  const report = reconcileTrades(existingTrades, incomingTrades);
  const matchedIncomingMap = new Map<string, MatchedTradeComparison>();

  report.allMatched.forEach((item) => {
    matchedIncomingMap.set(item.existing.id, item);
  });

  const mergedList: SingleTrade[] = [];

  // Step 1: Process existing trades
  for (const ex of existingTrades) {
    const match = matchedIncomingMap.get(ex.id);

    if (match) {
      if (options.updateExisting && match.isModified) {
        // Merge updated incoming fields into existing trade, preserving custom user notes/screenshots
        const inc = match.incoming;
        const mergedTrade: SingleTrade = {
          ...ex,
          entryPrice: inc.entryPrice !== undefined ? inc.entryPrice : ex.entryPrice,
          stopLoss: inc.stopLoss !== undefined ? inc.stopLoss : ex.stopLoss,
          takeProfit: inc.takeProfit !== undefined ? inc.takeProfit : ex.takeProfit,
          plannedRR: inc.plannedRR || ex.plannedRR,
          realizedRR: inc.realizedRR,
          result: inc.result,
          session: inc.session || ex.session,
          // Merge tags cleanly
          tags: Array.from(new Set([...(ex.tags || []), ...(inc.tags || [])])),
          // If existing had custom screenshotUrl, keep it!
          screenshotUrl: ex.screenshotUrl || inc.screenshotUrl,
          // Preserve any custom user notes, append new notes if distinct
          notes:
            ex.notes && inc.notes && !ex.notes.includes(inc.notes)
              ? `${ex.notes} | ${inc.notes}`
              : inc.notes || ex.notes,
        };
        mergedList.push(mergedTrade);
      } else {
        // Keep existing trade as-is
        mergedList.push(ex);
      }
    } else {
      // Unmatched existing trade (e.g. from an earlier batch not in current CSV) - preserve it!
      mergedList.push(ex);
    }
  }

  // Step 2: Append new trades
  if (options.preventDuplicates) {
    // Only append truly new trades!
    mergedList.push(...report.newTrades);
  } else {
    // Force append all incoming (not recommended, but supported if duplicate prevention is off)
    mergedList.push(...incomingTrades);
  }

  // Step 3: Sort chronologically by date
  mergedList.sort((a, b) => {
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    return (a.tradeNumber || 0) - (b.tradeNumber || 0);
  });

  // Step 4: Re-sequence trade numbers sequentially (1, 2, 3... N)
  return mergedList.map((trade, idx) => ({
    ...trade,
    tradeNumber: idx + 1,
  }));
}
