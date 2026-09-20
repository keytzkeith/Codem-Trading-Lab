import { SingleTrade, Experiment } from '../types/trade';
import { calculateTradeStats } from './calculations';

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
 * Standardizes any date format (YYYY/MM/DD, YYYY.MM.DD, DD/MM/YYYY, ISO, timestamp)
 * into a canonical "YYYY-MM-DD" representation for deterministic comparisons.
 */
export function normalizeDateStr(rawDate?: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: DD-MM-YYYY or MM-DD-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/);
  if (dmyMatch) {
    const part1 = parseInt(dmyMatch[1], 10);
    const part2 = parseInt(dmyMatch[2], 10);
    const y = dmyMatch[3];
    // If part1 > 12, part1 is definitely Day
    if (part1 > 12) {
      return `${y}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
    }
    // Default to day/month/year for standard forex reports
    return `${y}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
  }

  // Pattern 3: Fallback ISO parse
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }

  return trimmed.split(' ')[0].replace(/[./]/g, '-');
}

/**
 * Normalizes trading pair/symbol strings to match across different broker conventions
 * e.g. "EUR/USD", "EURUSD.raw", "OANDA:EURUSD", "GOLD", "XAUUSD"
 */
export function normalizePairStr(rawPair?: string): string {
  if (!rawPair) return '';
  let p = rawPair.trim().toUpperCase();

  // Strip broker exchange prefix (e.g. "OANDA:EURUSD" -> "EURUSD")
  if (p.includes(':')) {
    p = p.split(':')[1].trim();
  }

  // Strip non-alphanumeric (e.g. "EUR/USD" -> "EURUSD")
  p = p.replace(/[^A-Z0-9]/g, '');

  // Strip common broker suffixes
  p = p.replace(/(RAW|PRO|STP|ECN|MICRO|MINI|\+|_I|M)$/i, '');

  // Canonical commodity / index aliases
  if (p === 'GOLD') return 'XAUUSD';
  if (p === 'SILVER') return 'XAGUSD';
  if (p === 'NAS100' || p === 'USTEC' || p === 'NQ' || p === 'NDX') return 'US100';
  if (p === 'DJ30' || p === 'WS30' || p === 'YM' || p === 'DOW') return 'US30';
  if (p === 'SPX500' || p === 'ES' || p === 'SP500') return 'US500';
  if (p === 'GER40' || p === 'DAX40' || p === 'DAX') return 'DE40';

  return p;
}

/**
 * Extracts a normalized external identifier from trade id or notes (e.g. FX Replay trade ID or MT5 ticket)
 */
export function extractExternalTradeId(trade: SingleTrade): string | null {
  if (!trade) return null;

  // Pattern 1: id like "fx-101", "fx-101-123456", "fx-268061356"
  if (trade.id) {
    const fxIdMatch = trade.id.match(/^fx-([a-zA-Z0-9_-]+?)(?:-\d{10,})?$/i);
    if (fxIdMatch && fxIdMatch[1]) {
      return `fx:${fxIdMatch[1].toLowerCase()}`;
    }

    // Pattern 2: id like "mt5-1019281"
    const mt5IdMatch = trade.id.match(/^mt5-([a-zA-Z0-9]+)$/i);
    if (mt5IdMatch && mt5IdMatch[1]) {
      return `mt5:${mt5IdMatch[1].toLowerCase()}`;
    }
  }

  // Pattern 3: notes like "FX Replay #101" or "FX Replay #268061356"
  if (trade.notes) {
    const fxNotesMatch = trade.notes.match(/FX Replay #([a-zA-Z0-9_-]+)/i);
    if (fxNotesMatch && fxNotesMatch[1]) {
      return `fx:${fxNotesMatch[1].toLowerCase()}`;
    }

    const ticketNotesMatch = trade.notes.match(/(?:Ticket|Order)[:\s#]+([a-zA-Z0-9]+)/i);
    if (ticketNotesMatch && ticketNotesMatch[1]) {
      return `mt5:${ticketNotesMatch[1].toLowerCase()}`;
    }

    const hashMatch = trade.notes.match(/#(\d{5,12})/);
    if (hashMatch && hashMatch[1]) {
      return `num:${hashMatch[1]}`;
    }
  }

  return null;
}

/**
 * Determines whether two trades represent the identical market transaction.
 * Designed with tiered matching to handle external IDs, exact match, semantic execution signatures,
 * and fuzzy price/RR tolerances so sample backtest exports merge accurately without duplicating.
 */
export function areTradesMatching(existing: SingleTrade, incoming: SingleTrade): boolean {
  if (!existing || !incoming) return false;

  // Tier 1: Direct ID comparison (exact string match)
  if (existing.id && incoming.id && existing.id.trim() === incoming.id.trim()) {
    return true;
  }

  // Tier 2: Normalized External ID comparison (FX Replay #ID or MT5 ticket)
  const existingExtId = extractExternalTradeId(existing);
  const incomingExtId = extractExternalTradeId(incoming);
  if (existingExtId && incomingExtId && existingExtId === incomingExtId) {
    return true;
  }

  // Tier 3: Fallback partial ID match (e.g. "fx-101-171234" matches "fx-101")
  if (existing.id && incoming.id) {
    const cleanExisting = existing.id.replace(/^fx-/, '').split('-')[0].toLowerCase();
    const cleanIncoming = incoming.id.replace(/^fx-/, '').split('-')[0].toLowerCase();
    if (cleanExisting && cleanIncoming && cleanExisting === cleanIncoming && cleanExisting.length > 2) {
      return true;
    }
  }

  // Tier 4: Notes ID token match (e.g. both refer to same ticket number #123456)
  if (existing.notes && incoming.notes) {
    const matchExNum = existing.notes.match(/(?:#|Ticket[:\s]+|Order[:\s]+)(\d{4,12})/i);
    const matchIncNum = incoming.notes.match(/(?:#|Ticket[:\s]+|Order[:\s]+)(\d{4,12})/i);
    if (matchExNum && matchIncNum && matchExNum[1] === matchIncNum[1]) {
      return true;
    }
  }

  // Tier 5: Semantic execution signature: Date + Direction + Pair
  const normExDate = normalizeDateStr(existing.date);
  const normIncDate = normalizeDateStr(incoming.date);
  const sameDate = Boolean(normExDate && normIncDate && normExDate === normIncDate);

  const normExPair = normalizePairStr(existing.pair);
  const normIncPair = normalizePairStr(incoming.pair);
  // Match if both pairs normalize identically, or if either trade has an omitted pair (inheriting from parent study)
  const samePair = !normExPair || !normIncPair || normExPair === normIncPair;

  const sameDirection = existing.direction === incoming.direction;

  if (sameDate && sameDirection && samePair) {
    // Sub-check A: Entry price comparison (tolerates broker pip difference / slippage)
    if (
      existing.entryPrice !== undefined &&
      incoming.entryPrice !== undefined &&
      existing.entryPrice > 0 &&
      incoming.entryPrice > 0
    ) {
      const priceDiff = Math.abs(existing.entryPrice - incoming.entryPrice);
      const maxPrice = Math.max(existing.entryPrice, incoming.entryPrice);
      const relativeDiff = priceDiff / maxPrice;
      // Within 0.15% relative difference or absolute difference <= 0.0005 (5 pips on FX) or <= 0.5 (Gold)
      if (relativeDiff < 0.0015 || priceDiff < 0.0005) {
        return true;
      }
    }

    // Sub-check B: Realized RR & result match (within 0.15 R)
    const rrDiff = Math.abs((existing.realizedRR || 0) - (incoming.realizedRR || 0));
    if (rrDiff < 0.15 && existing.result === incoming.result) {
      return true;
    }

    // Sub-check C: Session matches and result matches
    if (
      existing.session === incoming.session &&
      (existing.result === incoming.result || rrDiff < 0.35)
    ) {
      return true;
    }

    // Sub-check D: SL or TP matches
    if (
      existing.stopLoss !== undefined &&
      incoming.stopLoss !== undefined &&
      Math.abs(existing.stopLoss - incoming.stopLoss) / Math.max(existing.stopLoss, 1) < 0.002
    ) {
      return true;
    }

    // Sub-check E: Same sequential tradeNumber in same study on same date
    if (
      existing.tradeNumber !== undefined &&
      incoming.tradeNumber !== undefined &&
      existing.tradeNumber === incoming.tradeNumber
    ) {
      return true;
    }
  }

  // Tier 6: Exact date, same outcome, and exact realized RR (e.g. single day backtest trades)
  if (
    sameDate &&
    sameDirection &&
    existing.result === incoming.result &&
    Math.abs((existing.realizedRR || 0) - (incoming.realizedRR || 0)) < 0.02
  ) {
    return true;
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
 * Deduplicates an array of trades within itself, ensuring no repeat rows or duplicate tickets remain.
 */
export function deduplicateTradeBatch(trades: SingleTrade[]): SingleTrade[] {
  if (!trades || trades.length <= 1) return trades || [];

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
  const cleanExisting = deduplicateTradeBatch(existingTrades);

  const matchedSet = new Set<string>();
  const allMatched: MatchedTradeComparison[] = [];
  const newTrades: SingleTrade[] = [];

  for (const incoming of cleanIncoming) {
    const existingMatch = cleanExisting.find((ex) => areTradesMatching(ex, incoming));

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
  const unmatchedExistingTrades = cleanExisting.filter((ex) => !matchedSet.has(ex.id));

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
 * Merges incoming trades into existing trades based on reconciliation options.
 * Ensures:
 * 1. Existing duplicate entries are cleaned.
 * 2. Already imported trades are updated, never duplicated.
 * 3. Only truly new trades are appended.
 * 4. Trades are chronologically ordered and sequentially re-numbered.
 */
export function mergeReconciledTrades(
  existingTrades: SingleTrade[],
  incomingTrades: SingleTrade[],
  options: MergeOptions = { preventDuplicates: true, updateExisting: true }
): SingleTrade[] {
  // Step 0: Clean existing trades first (pruning any legacy duplicate entries)
  const cleanExisting = deduplicateTradeBatch(existingTrades || []);
  const cleanIncoming = deduplicateTradeBatch(incomingTrades || []);

  const report = reconcileTrades(cleanExisting, cleanIncoming);
  const matchedIncomingMap = new Map<string, MatchedTradeComparison>();

  report.allMatched.forEach((item) => {
    matchedIncomingMap.set(item.existing.id, item);
  });

  const mergedList: SingleTrade[] = [];

  // Step 1: Process existing trades
  for (const ex of cleanExisting) {
    const match = matchedIncomingMap.get(ex.id);

    if (match) {
      if (options.updateExisting) {
        // Merge updated incoming fields into existing trade, preserving custom user notes/screenshots
        const inc = match.incoming;
        const mergedTrade: SingleTrade = {
          ...ex,
          date: normalizeDateStr(inc.date) || normalizeDateStr(ex.date),
          pair: inc.pair || ex.pair,
          direction: inc.direction || ex.direction,
          entryPrice: inc.entryPrice !== undefined ? inc.entryPrice : ex.entryPrice,
          stopLoss: inc.stopLoss !== undefined ? inc.stopLoss : ex.stopLoss,
          takeProfit: inc.takeProfit !== undefined ? inc.takeProfit : ex.takeProfit,
          plannedRR: inc.plannedRR || ex.plannedRR,
          realizedRR: inc.realizedRR !== undefined ? inc.realizedRR : ex.realizedRR,
          result: inc.result || ex.result,
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
      // Unmatched existing trade - preserve it!
      mergedList.push(ex);
    }
  }

  // Step 2: Append new trades
  if (options.preventDuplicates) {
    // Only append truly new trades that don't match any trade in mergedList
    for (const newTrade of report.newTrades) {
      const alreadyInList = mergedList.some((m) => areTradesMatching(m, newTrade));
      if (!alreadyInList) {
        mergedList.push(newTrade);
      }
    }
  } else {
    mergedList.push(...cleanIncoming);
  }

  // Step 3: Sort chronologically by date
  mergedList.sort((a, b) => {
    const dateComp = (normalizeDateStr(a.date) || '').localeCompare(normalizeDateStr(b.date) || '');
    if (dateComp !== 0) return dateComp;
    return (a.tradeNumber || 0) - (b.tradeNumber || 0);
  });

  // Step 4: Final pass guarantee - no duplicate trades
  const finalUniqueList: SingleTrade[] = [];
  for (const trade of mergedList) {
    if (!finalUniqueList.some((u) => areTradesMatching(u, trade))) {
      finalUniqueList.push(trade);
    }
  }

  // Step 5: Re-sequence trade numbers sequentially (1, 2, 3... N)
  return finalUniqueList.map((trade, idx) => ({
    ...trade,
    tradeNumber: idx + 1,
  }));
}

/**
 * Merges two complete research studies / experiments into one cleanly reconciled study
 */
export function mergeTwoExperiments(existingExp: Experiment, incomingExp: Experiment): Experiment {
  const mergedTrades = mergeReconciledTrades(existingExp.trades || [], incomingExp.trades || [], {
    preventDuplicates: true,
    updateExisting: true,
  });

  const stats = calculateTradeStats(mergedTrades);

  const combinedTags = Array.from(
    new Set([...(existingExp.tags || []), ...(incomingExp.tags || [])])
  );

  const combinedScreenshots = Array.from(
    new Set([...(existingExp.screenshotUrls || []), ...(incomingExp.screenshotUrls || [])])
  );

  const startDate = mergedTrades[0]?.date
    ? normalizeDateStr(mergedTrades[0].date)
    : existingExp.startDate;

  const endDate = mergedTrades[mergedTrades.length - 1]?.date
    ? normalizeDateStr(mergedTrades[mergedTrades.length - 1].date)
    : existingExp.endDate || incomingExp.endDate;

  const rSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';
  const generatedKeyFinding = `${mergedTrades.length} trades: ${stats.winRate}% win rate, ${rSign}${stats.netR}R total yield, ${expSign}${stats.expectancy}R EV.`;

  return {
    ...existingExp,
    ...incomingExp,
    id: existingExp.id, // Keep original stable ID
    title: existingExp.title || incomingExp.title,
    pair: existingExp.pair || incomingExp.pair,
    timeframe: existingExp.timeframe || incomingExp.timeframe,
    session: existingExp.session || incomingExp.session,
    setupModel: existingExp.setupModel || incomingExp.setupModel,
    startDate,
    endDate,
    sampleSize: mergedTrades.length,
    trades: mergedTrades,
    keyFinding: incomingExp.keyFinding?.trim() || existingExp.keyFinding?.trim() || generatedKeyFinding,
    verdict: incomingExp.verdict || existingExp.verdict,
    verdictNotes: incomingExp.verdictNotes || existingExp.verdictNotes,
    screenshotUrls: combinedScreenshots,
    tags: combinedTags,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deduplicates and reconciles an array of experiments, ensuring no duplicates exist
 * (e.g. accidental copies like "BT-001" and "BT-001-1") and trades within each experiment are merged cleanly.
 */
export function deduplicateAndMergeExperiments(experiments: Experiment[]): Experiment[] {
  if (!experiments || experiments.length === 0) return [];

  const mergedMap = new Map<string, Experiment>();

  for (const exp of experiments) {
    if (!exp) continue;

    // Normalize ID: e.g. "BT-001-1" or "BT-001-copy" -> root "BT-001"
    const rawId = (exp.id || 'EXP-1').trim().toUpperCase();
    const rootIdMatch = rawId.match(/^([A-Z]+-\d{1,4})(?:-\d+|-COPY.*)?$/i);
    const primaryId = rootIdMatch ? rootIdMatch[1].toUpperCase() : rawId;

    // Check if we already have an experiment for this primary ID
    const existing = mergedMap.get(primaryId);

    if (existing) {
      // Merge into existing experiment
      const merged = mergeTwoExperiments(existing, exp);
      mergedMap.set(primaryId, merged);
    } else {
      // Clean internal trades of this single experiment
      const cleanTrades = deduplicateTradeBatch(exp.trades || []);
      const stats = calculateTradeStats(cleanTrades);
      const cleanedExp: Experiment = {
        ...exp,
        id: primaryId,
        trades: cleanTrades.map((t, idx) => ({ ...t, tradeNumber: idx + 1 })),
        sampleSize: cleanTrades.length,
        startDate: cleanTrades[0]?.date ? normalizeDateStr(cleanTrades[0].date) : exp.startDate,
        endDate: cleanTrades[cleanTrades.length - 1]?.date ? normalizeDateStr(cleanTrades[cleanTrades.length - 1].date) : exp.endDate,
        keyFinding: exp.keyFinding || `${cleanTrades.length} trades: ${stats.winRate}% win rate, ${stats.netR >= 0 ? '+' : ''}${stats.netR}R yield.`,
      };
      mergedMap.set(primaryId, cleanedExp);
    }
  }

  return Array.from(mergedMap.values());
}
