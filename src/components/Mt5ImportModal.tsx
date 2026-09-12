import React, { useState, useEffect } from 'react';
import { Experiment, SessionType, SingleTrade, TimeframeType, VerdictType } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import { parseFxReplayCsv, isFxReplayFormat, FxReplayParseResult } from '../utils/fxReplayParser';
import { parseMt5OrCsvText } from '../utils/mt5Parser';
import {
  X,
  FileSpreadsheet,
  ArrowRight,
  Upload,
  Sliders,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  Globe,
  FileText,
} from 'lucide-react';

interface Mt5ImportModalProps {
  onClose: () => void;
  onImport: (experiment: Experiment) => void;
  experiments?: Experiment[];
  existingCount?: number;
}

export type ImportFormatOption = 'fxreplay' | 'mt5' | 'generic';

export const TIMEZONE_PRESETS = [
  { label: 'UTC+3 (Nairobi / EAT / GMT+3)', offset: 3, flag: '🇰🇪' },
  { label: 'UTC+0 (London / GMT / UTC)', offset: 0, flag: '🇬🇧' },
  { label: 'UTC+2 (Broker GMT+2 / Cairo / EET)', offset: 2, flag: '🇪🇬' },
  { label: 'UTC-4 (New York / EDT)', offset: -4, flag: '🇺🇸' },
  { label: 'UTC-5 (New York / EST)', offset: -5, flag: '🇺🇸' },
  { label: 'UTC+8 (Singapore / Tokyo / Asia)', offset: 8, flag: '🇸🇬' },
];

function getSessionColorClass(sessionName: string): string {
  switch (sessionName) {
    case 'London':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    case 'London/NY Overlap':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'New York Open':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'New York PM':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Asian':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600';
  }
}

const SAMPLE_FX_REPLAY_SNIPPET = `id,dateStart,dateEnd,pair,uPnL,rPnL,side,entryPrice,initialSL,maxTP,idealTP,amount,amountClosed,status,day,tags,avgClosePrice,avgRiskReward,maxRiskReward,exchangeRate,initialBalance,currentRealizedBalance
101,2024/01/03 12:13:55,2024/01/03 13:30:05,GBPUSD,0,-158.12,buy,1.26352,1.26225,,1.26375,100000,100000,closed,3,,1.26218,-1.0,0,1,10000,9841.88
102,2024/01/03 15:25:40,2024/01/04 11:50:25,GBPUSD,0,373.92,buy,1.26558,1.26376,1.27014,1.27299,100000,100000,closed,3,,1.27014,2.5,2.5,1,10000,10215.8`;

const SAMPLE_MT5_SNIPPET = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Profit,Realized R
1019281,2026.08.01 08:14:02,buy,1.00,EURUSD,1.08420,1.08220,1.08900,2026.08.01 09:40:15,1.08900,480.00,+2.4R
1019282,2026.08.02 08:30:11,sell,1.00,EURUSD,1.08650,1.08850,1.08170,2026.08.02 08:52:00,1.08850,-200.00,-1.0R`;

export const Mt5ImportModal: React.FC<Mt5ImportModalProps> = ({
  onClose,
  onImport,
  experiments = [],
}) => {
  const defaultId = getNextUniqueExperimentId(experiments, 'backtest');

  const [selectedFormat, setSelectedFormat] = useState<ImportFormatOption>('fxreplay');
  const [rawText, setRawText] = useState('');
  const [experimentId, setExperimentId] = useState(defaultId);
  const [pair, setPair] = useState('');
  
  // Session Mode: 'auto' | 'All Sessions' | 'London' | 'London/NY Overlap' | 'New York Open' | 'New York PM' | 'Asian'
  const [sessionSelection, setSessionSelection] = useState<string>('auto');
  const [timezoneOffset, setTimezoneOffset] = useState<number>(3); // Default UTC+3 Nairobi

  const [timeframe, setTimeframe] = useState<TimeframeType>('M5');
  const [setupModel, setSetupModel] = useState('');
  const [title, setTitle] = useState('');
  const [keyFinding, setKeyFinding] = useState('');
  const [verdict, setVerdict] = useState<VerdictType>('KEEP');

  const isDetectedFxReplay = isFxReplayFormat(rawText);

  let parsedTrades: SingleTrade[] = [];
  let fxMetadata: FxReplayParseResult | null = null;

  const sessionModeForParser = sessionSelection === 'auto' ? 'auto' : (sessionSelection as SessionType);

  if (rawText.trim().length > 0) {
    if (isDetectedFxReplay || selectedFormat === 'fxreplay') {
      fxMetadata = parseFxReplayCsv(rawText, pair || 'EURUSD', sessionModeForParser, timezoneOffset);
      parsedTrades = fxMetadata.trades;
    } else {
      parsedTrades = parseMt5OrCsvText(rawText, pair || 'EURUSD', sessionModeForParser, timezoneOffset);
    }
  }

  const stats = calculateTradeStats(parsedTrades);

  // Compute session distribution across parsed trades
  const sessionBreakdown: Record<string, number> = {};
  parsedTrades.forEach((t) => {
    sessionBreakdown[t.session] = (sessionBreakdown[t.session] || 0) + 1;
  });
  const sessionBreakdownEntries = Object.entries(sessionBreakdown);

  // Auto-fill pair and title when data is detected and inputs are empty
  useEffect(() => {
    if (isDetectedFxReplay && fxMetadata && fxMetadata.detectedPair) {
      const detected = fxMetadata.detectedPair;
      if (!pair) setPair(detected);
      if (!title) setTitle(`${detected} ${timeframe} Backtest`);
      if (!setupModel) setSetupModel('Systematic Execution Model');
    }
  }, [isDetectedFxReplay, fxMetadata?.detectedPair, timeframe, pair, title, setupModel]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setRawText(text);
        if (isFxReplayFormat(text)) {
          setSelectedFormat('fxreplay');
        } else {
          setSelectedFormat('mt5');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTemplate = () => {
    if (selectedFormat === 'fxreplay') {
      setRawText(SAMPLE_FX_REPLAY_SNIPPET);
      setPair('GBPUSD');
      setTitle('GBPUSD M5 Backtest');
      setSetupModel('Liquidity Sweep Model');
    } else {
      setRawText(SAMPLE_MT5_SNIPPET);
      setPair('EURUSD');
      setTitle('EURUSD M5 Statement');
      setSetupModel('Execution Statement Model');
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTrades.length === 0) return;

    const chosenPair = pair.trim().toUpperCase() || 'EURUSD';
    const startDate = parsedTrades[0]?.date || new Date().toISOString().split('T')[0];
    const endDate = parsedTrades[parsedTrades.length - 1]?.date || startDate;

    const isFx = isDetectedFxReplay || selectedFormat === 'fxreplay';

    let finalSession: SessionType = 'London';
    if (sessionSelection === 'auto') {
      if (sessionBreakdownEntries.length > 1) {
        finalSession = 'All Sessions';
      } else if (sessionBreakdownEntries.length === 1) {
        finalSession = sessionBreakdownEntries[0][0] as SessionType;
      }
    } else {
      finalSession = sessionSelection as SessionType;
    }

    const sessionTag = finalSession === 'All Sessions' ? 'all-sessions' : finalSession.toLowerCase();
    const finalTags = isFx
      ? ['fxreplay', 'backtest', chosenPair.toLowerCase(), sessionTag]
      : ['mt5-import', 'statement', chosenPair.toLowerCase(), sessionTag];

    if (finalSession === 'All Sessions') {
      sessionBreakdownEntries.forEach(([s]) => {
        finalTags.push(s.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      });
    }

    const finalModel = setupModel.trim() || 'Systematic Model';
    const finalTitle = title.trim() || `${chosenPair} ${timeframe} ${finalModel}`;

    const newExperiment: Experiment = {
      id: experimentId.trim() || defaultId,
      title: finalTitle,
      type: 'backtest',
      pair: chosenPair,
      timeframe,
      session: finalSession,
      setupModel: finalModel,
      startDate,
      endDate,
      sampleSize: parsedTrades.length,
      trades: parsedTrades,
      keyFinding:
        keyFinding.trim() ||
        `${parsedTrades.length} trades: ${stats.winRate}% win rate, ${stats.netR >= 0 ? '+' : ''}${stats.netR}R yield.`,
      verdict,
      screenshotUrls: [],
      tags: Array.from(new Set(finalTags)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedToWhatsApp: false,
    };

    onImport(newExperiment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0D0E15] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#13141F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Import Backtest / Execution Data
                </h3>
                {isDetectedFxReplay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Sparkles className="w-3 h-3" /> FX Replay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Import trades from FX Replay, MetaTrader 4/5, or generic CSV statements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-6 pt-3 pb-3 bg-[#10111A] border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171926] border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedFormat('fxreplay')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'fxreplay'
                  ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>FX Replay</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('mt5')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'mt5'
                  ? 'bg-sky-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>MetaTrader 4 / 5</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('generic')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'generic'
                  ? 'bg-[#00FF66] text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Generic CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!rawText && (
              <button
                type="button"
                onClick={handleLoadSampleTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-[#171926] hover:bg-[#1E2132] text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1 transition-colors"
                title="Insert format template"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Format Template</span>
              </button>
            )}

            <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#181B28] hover:bg-[#202436] text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload CSV</span>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Account Simulation Metrics (If available) */}
        {fxMetadata && (fxMetadata.initialBalance || fxMetadata.currentRealizedBalance) && parsedTrades.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#141624] border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-300 font-mono">
              Initial Balance: <strong>${fxMetadata.initialBalance?.toLocaleString()}</strong> → Final Balance:{' '}
              <strong>${fxMetadata.currentRealizedBalance?.toLocaleString()}</strong>
            </div>
            {fxMetadata.netPnL !== undefined && (
              <div className="text-xs font-mono font-bold">
                Net PnL:{' '}
                <span className={fxMetadata.netPnL >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}>
                  {fxMetadata.netPnL >= 0 ? '+' : ''}${fxMetadata.netPnL.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleImport} className="p-6 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Instrument
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
                placeholder="e.g. EURUSD"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
              >
                {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
                <span>Trading Session</span>
                {sessionSelection === 'auto' && (
                  <span className="text-[10px] text-emerald-400 font-bold lowercase">auto-detect</span>
                )}
              </label>
              <select
                value={sessionSelection}
                onChange={(e) => setSessionSelection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
              >
                <option value="auto">⚡ Automatic (Per-Trade Timestamp)</option>
                <option value="All Sessions">All Sessions (Multi-Session)</option>
                <option value="London">London</option>
                <option value="London/NY Overlap">London/NY Overlap</option>
                <option value="New York Open">New York Open</option>
                <option value="New York PM">New York PM</option>
                <option value="Asian">Asian Session</option>
              </select>
            </div>
          </div>

          {/* Timezone Bar */}
          <div className="p-3 rounded-2xl bg-[#141624] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="text-xs text-slate-300 font-medium">
                Session Conversion Timezone
              </div>
            </div>

            <select
              value={timezoneOffset}
              onChange={(e) => setTimezoneOffset(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[#1D2132] border border-slate-700 text-slate-200 font-bold text-xs focus:border-sky-400 focus:outline-none"
            >
              {TIMEZONE_PRESETS.map((tz) => (
                <option key={tz.offset} value={tz.offset}>
                  {tz.flag} {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Session Breakdown if detected */}
          {sessionBreakdownEntries.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Detected Sessions:</span>
              {sessionBreakdownEntries.map(([sess, count]) => (
                <span
                  key={sess}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getSessionColorClass(sess)}`}
                >
                  <span>{sess}</span>
                  <strong>({count})</strong>
                </span>
              ))}
            </div>
          )}

          {/* Title & Setup Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Study Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-slate-100 font-semibold focus:border-[#00FF66] focus:outline-none"
                placeholder="e.g. London Liquidity Sweep Backtest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Strategy / Model
              </label>
              <input
                type="text"
                value={setupModel}
                onChange={(e) => setSetupModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-slate-100 font-semibold focus:border-[#00FF66] focus:outline-none"
                placeholder="e.g. Liquidity Sweep + Displacement"
                required
              />
            </div>
          </div>

          {/* CSV Text Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="font-bold text-slate-300 uppercase">
                CSV Statement Data
              </label>
              {parsedTrades.length > 0 && (
                <span className="text-emerald-400 font-bold">
                  {parsedTrades.length} trades recognized
                </span>
              )}
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste CSV rows here or upload a file above..."
              className="w-full p-3 rounded-xl bg-[#141624] border border-slate-800 text-slate-300 font-mono text-xs focus:border-[#00FF66] focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Real-time Parsed Preview Matrix */}
          {parsedTrades.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
                  Validation Preview
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {parsedTrades[0]?.date} → {parsedTrades[parsedTrades.length - 1]?.date}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
                <div className="p-2 rounded-xl bg-[#181B28] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Trades</span>
                  <span className="text-white font-bold text-sm mt-0.5 block">
                    {stats.totalTrades}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#181B28] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Win Rate</span>
                  <span
                    className={`font-bold text-sm mt-0.5 block ${
                      stats.winRate >= 50 ? 'text-[#00FF66]' : 'text-amber-400'
                    }`}
                  >
                    {stats.winRate}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#181B28] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Net R</span>
                  <span
                    className={`font-bold text-sm mt-0.5 block ${
                      stats.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'
                    }`}
                  >
                    {stats.netR >= 0 ? '+' : ''}
                    {stats.netR}R
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#181B28] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Expectancy</span>
                  <span className="text-[#00D2FF] font-bold text-sm mt-0.5 block">
                    {stats.expectancy >= 0 ? '+' : ''}
                    {stats.expectancy}R
                  </span>
                </div>
              </div>

              {/* Trade Samples */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {parsedTrades.slice(0, 4).map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-[#141624] text-slate-300 font-mono border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">#{t.tradeNumber}</span>
                      <span>{t.date}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] border ${getSessionColorClass(t.session)}`}>
                        {t.session}
                      </span>
                      <span className="uppercase text-[10px] text-slate-400">{t.direction}</span>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        t.result === 'Win'
                          ? 'text-[#00FF66]'
                          : t.result === 'Loss'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {t.realizedRR >= 0 ? '+' : ''}{t.realizedRR}R
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#12131D] border border-slate-800/60 text-center text-xs text-slate-400 font-mono">
              Paste CSV data or upload a file above to preview trades.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#181B28] hover:bg-[#202436] text-slate-300 hover:text-white font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedTrades.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E55C] disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center gap-2"
            >
              <span>Import Study</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
