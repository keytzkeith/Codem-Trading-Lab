import { SingleTrade, SessionType, TradeDirection, TradeResult } from '../types/trade';

export interface FxReplayParseResult {
  trades: SingleTrade[];
  detectedPair: string;
  startDate: string;
  endDate: string;
  initialBalance?: number;
  currentRealizedBalance?: number;
  netPnL?: number;
  sessionBreakdown: Record<string, number>;
  dominantSession: SessionType;
}

export interface FxReplayParseOptions {
  fallbackPair?: string;
  sessionMode?: 'auto' | SessionType;
  timezoneOffsetHours?: number; // e.g. +3 for Nairobi Time (EAT / UTC+3)
}

/**
 * Robust CSV line splitter that respects quoted fields containing commas
 */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Derives trading session based on time of day and user timezone offset (default UTC+3 Nairobi time)
 *
 * Institutional Forex Session Windows (in UTC):
 * - Asian Session: 21:00 UTC - 07:00 UTC (Tokyo/Sydney liquidity)
 * - London Core: 07:00 UTC - 12:00 UTC (European morning volume expansion)
 * - London / NY Overlap: 12:00 UTC - 16:00 UTC (Highest daily volatility & US cash open)
 * - New York PM: 16:00 UTC - 21:00 UTC (US afternoon liquidity into daily close)
 */
export function determineSessionFromTimestamp(
  dateTimeStr: string,
  timezoneOffsetHours: number = 3
): SessionType {
  if (!dateTimeStr) return 'London';

  let rawHour = 12;
  let rawMinute = 0;

  // Match "YYYY/MM/DD HH:mm:ss", "YYYY-MM-DD HH:mm", or ISO "T12:30:00"
  const timeMatch = dateTimeStr.match(/(?:T|\s)(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    rawHour = parseInt(timeMatch[1], 10);
    rawMinute = parseInt(timeMatch[2], 10);
  } else {
    const fallbackMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
    if (fallbackMatch) {
      rawHour = parseInt(fallbackMatch[1], 10);
      rawMinute = parseInt(fallbackMatch[2], 10);
    }
  }

  // Convert raw local decimal hour to UTC decimal hour
  // e.g. 12:13 Nairobi time (offset +3): 12.21 - 3 = 9.21 UTC (London session)
  const localDecimalHour = rawHour + rawMinute / 60;
  const utcDecimalHour = (localDecimalHour - timezoneOffsetHours + 24) % 24;

  if (utcDecimalHour >= 7 && utcDecimalHour < 12) {
    return 'London';
  } else if (utcDecimalHour >= 12 && utcDecimalHour < 16) {
    return 'London/NY Overlap';
  } else if (utcDecimalHour >= 16 && utcDecimalHour < 21) {
    return 'New York PM';
  } else {
    return 'Asian';
  }
}

/**
 * Checks if raw text appears to be an FX Replay CSV export
 */
export function isFxReplayFormat(rawText: string): boolean {
  if (!rawText) return false;
  const firstLines = rawText.trim().split('\n').slice(0, 3).join(' ').toLowerCase();
  return (
    firstLines.includes('datestart') &&
    firstLines.includes('avgriskreward') &&
    (firstLines.includes('rpnl') || firstLines.includes('maxriskreward') || firstLines.includes('idealtp'))
  );
}

/**
 * Parses FX Replay export CSV text into strongly-typed SingleTrade objects with multi-session capability
 */
export function parseFxReplayCsv(
  rawText: string,
  fallbackPair: string = 'GBPUSD',
  sessionMode: 'auto' | SessionType = 'auto',
  timezoneOffsetHours: number = 3
): FxReplayParseResult {
  const lines = rawText.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      trades: [],
      detectedPair: fallbackPair,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      sessionBreakdown: {},
      dominantSession: 'London',
    };
  }

  const headerLine = lines[0];
  const headers = splitCsvLine(headerLine).map((h) => h.toLowerCase().trim());

  // Map header column indices
  const colIndex = {
    id: headers.indexOf('id'),
    dateStart: headers.indexOf('datestart'),
    dateEnd: headers.indexOf('dateend'),
    pair: headers.indexOf('pair'),
    rPnL: headers.indexOf('rpnl'),
    uPnL: headers.indexOf('upnl'),
    side: headers.indexOf('side'),
    entryPrice: headers.indexOf('entryprice'),
    initialSL: headers.indexOf('initialsl'),
    maxTP: headers.indexOf('maxtp'),
    idealTP: headers.indexOf('idealtp'),
    amount: headers.indexOf('amount'),
    status: headers.indexOf('status'),
    tags: headers.indexOf('tags'),
    avgClosePrice: headers.indexOf('avgcloseprice'),
    avgRiskReward: headers.indexOf('avgriskreward'),
    maxRiskReward: headers.indexOf('maxriskreward'),
    initialBalance: headers.indexOf('initialbalance'),
    currentRealizedBalance: headers.indexOf('currentrealizedbalance'),
  };

  const trades: SingleTrade[] = [];
  let detectedPair = fallbackPair;
  let initialBalance: number | undefined;
  let currentRealizedBalance: number | undefined;
  let netPnL: number = 0;
  const sessionCounts: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = splitCsvLine(line);
    if (cols.length < 5) continue;

    const rawId = colIndex.id !== -1 ? cols[colIndex.id] : `${i}`;
    const rawDateStart = colIndex.dateStart !== -1 ? cols[colIndex.dateStart] : '';
    const rawPair = colIndex.pair !== -1 ? cols[colIndex.pair] : '';
    const rawSide = colIndex.side !== -1 ? cols[colIndex.side] : '';
    const rawRPnL = colIndex.rPnL !== -1 ? parseFloat(cols[colIndex.rPnL]) : NaN;
    const rawEntryPrice = colIndex.entryPrice !== -1 ? parseFloat(cols[colIndex.entryPrice]) : undefined;
    const rawInitialSL = colIndex.initialSL !== -1 ? parseFloat(cols[colIndex.initialSL]) : undefined;
    const rawMaxTP = colIndex.maxTP !== -1 ? parseFloat(cols[colIndex.maxTP]) : undefined;
    const rawIdealTP = colIndex.idealTP !== -1 ? parseFloat(cols[colIndex.idealTP]) : undefined;
    const rawAvgRR = colIndex.avgRiskReward !== -1 ? parseFloat(cols[colIndex.avgRiskReward]) : NaN;
    const rawMaxRR = colIndex.maxRiskReward !== -1 ? parseFloat(cols[colIndex.maxRiskReward]) : NaN;
    const rawTags = colIndex.tags !== -1 ? cols[colIndex.tags] : '';

    if (colIndex.initialBalance !== -1 && !initialBalance) {
      const parsedBal = parseFloat(cols[colIndex.initialBalance]);
      if (!isNaN(parsedBal)) initialBalance = parsedBal;
    }
    if (colIndex.currentRealizedBalance !== -1) {
      const parsedCurr = parseFloat(cols[colIndex.currentRealizedBalance]);
      if (!isNaN(parsedCurr)) currentRealizedBalance = parsedCurr;
    }

    // Clean Pair: strip broker prefix (e.g. "OANDA:GBPUSD" -> "GBPUSD")
    let pair = fallbackPair;
    if (rawPair) {
      const clean = rawPair.includes(':') ? rawPair.split(':')[1].trim() : rawPair.trim();
      if (clean) {
        pair = clean.toUpperCase();
        detectedPair = pair;
      }
    }

    // Clean Date: "2024/01/03 12:13:55" -> "2024-01-03"
    let dateStr = new Date().toISOString().split('T')[0];
    let tradeSession: SessionType = 'London';

    if (rawDateStart) {
      const dateParts = rawDateStart.split(' ')[0].replace(/\//g, '-');
      if (dateParts) dateStr = dateParts;

      // If sessionMode is auto or All Sessions, detect per trade based on timestamp & timezone
      if (sessionMode === 'auto' || sessionMode === 'All Sessions') {
        tradeSession = determineSessionFromTimestamp(rawDateStart, timezoneOffsetHours);
      } else {
        tradeSession = sessionMode;
      }
    } else {
      tradeSession = sessionMode === 'auto' || sessionMode === 'All Sessions' ? 'London' : sessionMode;
    }

    // Track session frequency
    sessionCounts[tradeSession] = (sessionCounts[tradeSession] || 0) + 1;

    // Direction: "buy" -> Long, "sell" -> Short
    const direction: TradeDirection =
      rawSide.toLowerCase().includes('sell') || rawSide.toLowerCase().includes('short') ? 'Short' : 'Long';

    // Realized R
    let realizedRR = 0;
    if (!isNaN(rawAvgRR)) {
      realizedRR = Number(rawAvgRR.toFixed(2));
    } else if (!isNaN(rawRPnL)) {
      realizedRR = rawRPnL > 0 ? 2.0 : -1.0;
    }

    // Result
    let result: TradeResult = 'Breakeven';
    if (realizedRR > 0.05 || (!isNaN(rawRPnL) && rawRPnL > 0)) {
      result = 'Win';
    } else if (realizedRR < -0.05 || (!isNaN(rawRPnL) && rawRPnL < 0)) {
      result = 'Loss';
    } else {
      result = 'Breakeven';
      realizedRR = 0;
    }

    // Planned RR
    let plannedRR = 2.0;
    if (!isNaN(rawMaxRR) && rawMaxRR > 0) {
      plannedRR = Number(rawMaxRR.toFixed(2));
    } else if (rawEntryPrice && rawInitialSL && (rawIdealTP || rawMaxTP)) {
      const target = rawIdealTP || rawMaxTP!;
      const risk = Math.abs(rawEntryPrice - rawInitialSL);
      const reward = Math.abs(target - rawEntryPrice);
      if (risk > 0) {
        plannedRR = Number((reward / risk).toFixed(2));
      }
    }

    if (!isNaN(rawRPnL)) {
      netPnL += rawRPnL;
    }

    const tradeTags: string[] = ['fxreplay'];
    if (rawTags) {
      rawTags.split(/[,;|]/).forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) tradeTags.push(trimmed.toLowerCase());
      });
    }
    tradeTags.push(pair.toLowerCase(), tradeSession.toLowerCase());

    const pnlNote = !isNaN(rawRPnL) ? `PnL: ${rawRPnL >= 0 ? '+' : ''}$${rawRPnL.toFixed(2)}` : '';
    const notes = `FX Replay #${rawId}${pnlNote ? ` | ${pnlNote}` : ''}`;

    trades.push({
      id: rawId ? `fx-${rawId}` : `fx-${i}`,
      tradeNumber: i,
      date: dateStr,
      pair,
      session: tradeSession,
      direction,
      entryPrice: rawEntryPrice,
      stopLoss: rawInitialSL,
      takeProfit: rawIdealTP || rawMaxTP,
      plannedRR,
      realizedRR,
      result,
      notes,
      tags: Array.from(new Set(tradeTags)),
      setupRuleFollowed: true,
    });
  }

  const startDate = trades[0]?.date || new Date().toISOString().split('T')[0];
  const endDate = trades[trades.length - 1]?.date || startDate;

  // Determine dominant session
  let dominantSession: SessionType = 'London';
  let maxCount = 0;
  Object.entries(sessionCounts).forEach(([sess, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantSession = sess as SessionType;
    }
  });

  return {
    trades,
    detectedPair,
    startDate,
    endDate,
    initialBalance,
    currentRealizedBalance,
    netPnL: Number(netPnL.toFixed(2)),
    sessionBreakdown: sessionCounts,
    dominantSession,
  };
}
