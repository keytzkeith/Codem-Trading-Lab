import { SingleTrade, SessionType, TradeDirection, TradeResult } from '../types/trade';

function guessSessionFromTime(dateStr: string): SessionType {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'London';
  const hourUtc = date.getUTCHours();
  if (hourUtc >= 7 && hourUtc < 12) return 'London';
  if (hourUtc >= 12 && hourUtc < 16) return 'London/NY Overlap';
  if (hourUtc >= 16 && hourUtc < 21) return 'New York PM';
  if (hourUtc >= 0 && hourUtc < 7) return 'Asian';
  return 'London';
}

export function parseMt5OrCsvText(rawText: string, defaultPair: string = 'EURUSD', defaultSession: SessionType = 'London'): SingleTrade[] {
  const lines = rawText.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const trades: SingleTrade[] = [];

  // Check if header exists
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('profit') || firstLine.includes('type') || firstLine.includes('ticket') || firstLine.includes('pair') || firstLine.includes('rr') || firstLine.includes('r');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line, index) => {
    // Delimiters: comma, tab, semicolon, pipe, or multiple spaces
    let parts = line.split(/[,\t;|]/).map((p) => p.trim());
    if (parts.length === 1 && line.includes(' ')) {
      // Split on spaces if tab or comma didn't work
      parts = line.split(/\s{2,}|\s+/).map((p) => p.trim());
    }

    if (parts.length < 2) return;

    let tradeNum = index + 1;
    let date = new Date().toISOString().split('T')[0];
    let pair = defaultPair;
    let session = defaultSession;
    let direction: TradeDirection = 'Long';
    let entryPrice: number | undefined = undefined;
    let stopLoss: number | undefined = undefined;
    let takeProfit: number | undefined = undefined;
    let plannedRR = 2.0;
    let realizedRR = 0;
    let result: TradeResult = 'Loss';
    let notes = '';

    // Strategy 1: Standard Simple CSV (e.g., "#, Date, Pair, Direction, RealizedR, Result, Session, Notes" or "R, Result, Notes")
    const numValues: number[] = [];
    parts.forEach((part) => {
      const clean = part.replace(/[+rR$]/g, '');
      const val = parseFloat(clean);
      if (!isNaN(val)) numValues.push(val);
    });

    // Check for direction
    if (parts.some((p) => /buy|long/i.test(p))) direction = 'Long';
    if (parts.some((p) => /sell|short/i.test(p))) direction = 'Short';

    // Check for session
    if (parts.some((p) => /london/i.test(p))) session = 'London';
    else if (parts.some((p) => /ny|new york|nyc/i.test(p))) session = 'New York Open';
    else if (parts.some((p) => /asia/i.test(p))) session = 'Asian';

    // Check for pair
    const pairMatch = line.match(/(EURUSD|GBPUSD|USDJPY|XAUUSD|AUDUSD|USDCAD|NZDUSD|USDCHF|GBPJPY|EURJPY|US100|NAS100|US30|BTCUSD|ETHUSD)/i);
    if (pairMatch) {
      pair = pairMatch[0].toUpperCase();
    }

    // Determine Realized R
    // Look for tokens like +2.4R or -1R or +2.4
    const rMatch = line.match(/([+-]?\d+(?:\.\d+)?)\s*[rR]/);
    if (rMatch) {
      realizedRR = parseFloat(rMatch[1]);
    } else {
      // Find a floating point that looks like R (e.g. between -5 and +25)
      // or if MT5 profit is in dollar, normalize to R
      const possibleR = numValues.find((n) => n >= -3 && n <= 20 && n !== 0 && n !== 1 && n !== 2);
      if (possibleR !== undefined) {
        realizedRR = possibleR;
      } else if (numValues.length > 0) {
        const lastNum = numValues[numValues.length - 1];
        realizedRR = lastNum > 0 ? (lastNum > 20 ? lastNum / 100 : lastNum) : lastNum < 0 ? (lastNum < -20 ? -1 : lastNum) : 0;
      }
    }

    // Check for date
    const dateMatch = line.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})|(\d{2}[-/.]\d{2}[-/.]\d{4})/);
    if (dateMatch) {
      date = dateMatch[0];
      session = guessSessionFromTime(dateMatch[0]);
    }

    // Determine result
    if (realizedRR > 0) result = 'Win';
    else if (realizedRR < 0) result = 'Loss';
    else {
      if (line.toLowerCase().includes('win')) {
        result = 'Win';
        if (realizedRR === 0) realizedRR = 2.0;
      } else if (line.toLowerCase().includes('loss')) {
        result = 'Loss';
        if (realizedRR === 0) realizedRR = -1.0;
      } else {
        result = 'Breakeven';
        realizedRR = 0;
      }
    }

    // Check for entry, sl, tp
    const priceCandidates = numValues.filter((n) => n > 20 && n !== realizedRR);
    if (priceCandidates.length >= 3) {
      entryPrice = priceCandidates[0];
      stopLoss = priceCandidates[1];
      takeProfit = priceCandidates[2];
    }

    trades.push({
      id: `trade-${index + 1}-${Date.now()}`,
      tradeNumber: tradeNum,
      date,
      pair,
      session,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      plannedRR: plannedRR,
      realizedRR: Number(realizedRR.toFixed(2)),
      result,
      notes: notes || `Imported trade #${tradeNum}`,
      setupRuleFollowed: true,
    });
  });

  return trades;
}
