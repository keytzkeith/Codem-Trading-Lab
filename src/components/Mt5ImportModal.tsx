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
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  Globe,
} from 'lucide-react';

interface Mt5ImportModalProps {
  onClose: () => void;
  onImport: (experiment: Experiment) => void;
  experiments?: Experiment[];
  existingCount?: number;
}

export type ImportFormatOption = 'fxreplay' | 'mt5' | 'generic';

export const TIMEZONE_PRESETS = [
  { label: 'UTC+3 (Nairobi / EAT / GMT+3)', offset: 3, flag: '🇰🇪', description: 'Nairobi & East Africa Time' },
  { label: 'UTC+0 (London / GMT / UTC)', offset: 0, flag: '🇬🇧', description: 'Broker UTC / London GMT' },
  { label: 'UTC+2 (Broker GMT+2 / Cairo / EET)', offset: 2, flag: '🇪🇬', description: 'MetaTrader standard broker time' },
  { label: 'UTC-4 (New York / EDT)', offset: -4, flag: '🇺🇸', description: 'US Eastern Daylight Time' },
  { label: 'UTC-5 (New York / EST)', offset: -5, flag: '🇺🇸', description: 'US Eastern Standard Time' },
  { label: 'UTC+8 (Singapore / Tokyo / Asia)', offset: 8, flag: '🇸🇬', description: 'Asian markets' },
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
268061356,2024/01/03 12:13:55,2024/01/03 13:30:05,OANDA:GBPUSD,0,-158.12,buy,1.26352,1.26225,,1.26375,118000,118000,closed,3,,1.26218,-1.06,0,1,15000,14841.88
268066310,2024/01/03 23:25:40,2024/01/04 11:50:25,OANDA:GBPUSD,0,373.92,buy,1.26558,1.26376,1.27014,1.27299,82000,82000,closed,3,,1.27014,2.51,2.51,1,15000,15215.8
268067147,2024/01/04 17:07:05,2024/01/04 18:04:25,OANDA:GBPUSD,0,378,buy,1.26674,1.26562,1.26954,1.2711,135000,135000,closed,4,,1.26954,2.5,2.5,1,15000,15593.8
268070497,2024/01/05 22:51:45,2024/01/08 02:29:55,OANDA:GBPUSD,0,-134.4,buy,1.27218,1.2708,,1.27302,120000,120000,closed,5,,1.27106,-0.81,0,1,15000,15459.4
268070808,2024/01/08 11:14:05,2024/01/08 12:30:40,OANDA:GBPUSD,0,-159.14,buy,1.26954,1.26741,,1.27066,73000,73000,closed,1,,1.26736,-1.02,0,1,15000,15300.26
268075477,2024/01/11 14:16:30,2024/01/11 15:33:15,OANDA:GBPUSD,0,-187.21,sell,1.27616,1.27695,,1.27578,193000,193000,closed,4,,1.27713,-1.23,0,1,15000,15113.05
268075761,2024/01/11 16:28:40,2024/01/11 16:30:00,OANDA:GBPUSD,0,-165.39,sell,1.27618,1.27719,,1.27214,149000,149000,closed,4,,1.27729,-1.1,0,1,15000,14947.66
268075766,2024/01/11 16:32:00,2024/01/11 16:34:00,OANDA:GBPUSD,0,380.77,buy,1.27077,1.26926,1.27454,1.27626,101000,101000,closed,4,,1.27454,2.5,2.5,1,15000,15328.43
268486204,2024/01/12 15:09:35,2024/01/12 17:38:15,OANDA:GBPUSD,0,381.9,buy,1.27227,1.26999,1.27797,1.27858,67000,67000,closed,5,,1.27797,2.5,2.5,1,15000,15710.33
268542121,2024/01/15 11:57:45,2024/01/15 12:36:10,OANDA:GBPUSD,0,-165.2,buy,1.27411,1.27278,,1.2742,118000,118000,closed,1,,1.27271,-1.05,0,1,15000,15545.13
268850257,2024/01/16 15:19:15,2024/01/16 16:33:20,OANDA:GBPUSD,0,-164.4,sell,1.26492,1.26626,,1.26377,120000,120000,closed,2,,1.26629,-1.02,0,1,15000,15380.73
268851570,2024/01/16 20:27:25,2024/01/16 23:19:55,OANDA:GBPUSD,0,9.8,buy,1.26321,1.26103,1.26336,1.2644,70000,70000,closed,2,,1.26335,0.06,0.07,1,15000,15390.53
268854670,2024/01/17 10:00:05,2024/01/17 10:00:10,OANDA:GBPUSD,0,-175.14,sell,1.26326,1.26448,,1.26244,126000,126000,closed,3,,1.26465,-1.14,0,1,15000,15215.39
268856843,2024/01/17 18:36:10,2024/01/17 22:43:10,OANDA:GBPUSD,0,437.88,buy,1.26498,1.26375,1.26854,1.27748,123000,123000,closed,3,,1.26854,2.89,2.89,1,15000,15653.27
268861312,2024/01/18 12:58:10,2024/01/18 14:32:45,OANDA:GBPUSD,0,284.9,buy,1.26773,1.26672,1.26958,1.26958,154000,154000,closed,4,,1.26958,1.83,1.83,1,15000,15938.17
268861576,2024/01/18 16:30:00,2024/01/18 16:39:50,OANDA:GBPUSD,0,-173.76,buy,1.26708,1.26622,,1.26802,181000,181000,closed,4,,1.26612,-1.12,0,1,15000,15764.41
268863306,2024/01/18 18:00:25,2024/01/18 18:29:55,OANDA:GBPUSD,0,-119,sell,1.26756,1.26868,,1.26674,140000,140000,closed,4,,1.26841,-0.76,0,1,15000,15645.41
268863981,2024/01/18 19:02:55,2024/01/18 19:23:50,OANDA:GBPUSD,0,-166.8,sell,1.26757,1.26869,,1.26724,139000,139000,closed,4,,1.26877,-1.07,0,1,15000,15478.61
268869901,2024/01/23 16:52:50,2024/01/23 17:05:15,OANDA:GBPUSD,0,-178.5,buy,1.27066,1.26978,,1.2711,175000,175000,closed,2,,1.26964,-1.16,0,1,15000,15300.11
268871347,2024/01/24 05:13:35,2024/01/24 08:59:55,OANDA:GBPUSD,0,237.18,buy,1.26883,1.26797,1.27024,1.27748,177000,177000,closed,3,,1.27017,1.56,1.64,1,15000,15537.29
268873662,2024/01/24 18:03:30,2024/01/24 21:14:30,OANDA:GBPUSD,0,-20.58,buy,1.27365,1.2726,,1.27569,147000,147000,closed,3,,1.27351,-0.13,0,1,15000,15516.71
268875059,2024/01/25 13:38:10,2024/01/25 16:30:00,OANDA:GBPUSD,0,387,sell,1.27424,1.27578,1.27037,1.26756,100000,100000,closed,4,,1.27037,2.51,2.51,1,15000,15903.71`;

const SAMPLE_MT5_SNIPPET = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Profit,Realized R
1019281,2026.08.01 08:14:02,buy,1.00,EURUSD,1.08420,1.08220,1.08900,2026.08.01 09:40:15,1.08900,480.00,+2.4R
1019282,2026.08.02 08:30:11,sell,1.00,EURUSD,1.08650,1.08850,1.08170,2026.08.02 08:52:00,1.08850,-200.00,-1.0R
1019283,2026.08.03 07:45:00,buy,1.00,EURUSD,1.08310,1.08110,1.08810,2026.08.03 10:15:22,1.08810,500.00,+2.5R
1019284,2026.08.04 08:20:10,sell,1.00,EURUSD,1.08900,1.09100,1.08400,2026.08.04 09:10:00,1.08900,0.00,0.0R
1019285,2026.08.05 09:05:30,buy,1.00,EURUSD,1.08500,1.08300,1.08980,2026.08.05 11:30:45,1.08980,480.00,+2.4R
1019286,2026.08.08 08:10:00,sell,1.00,EURUSD,1.09200,1.09400,1.08720,2026.08.08 09:55:12,1.08720,480.00,+2.4R
1019287,2026.08.09 08:45:19,buy,1.00,EURUSD,1.08700,1.08500,1.09180,2026.08.09 09:05:00,1.08500,-200.00,-1.0R
1019288,2026.08.10 08:15:00,buy,1.00,EURUSD,1.08600,1.08400,1.09080,2026.08.10 10:30:00,1.09080,480.00,+2.4R`;

export const Mt5ImportModal: React.FC<Mt5ImportModalProps> = ({
  onClose,
  onImport,
  experiments = [],
}) => {
  const defaultId = getNextUniqueExperimentId(experiments, 'backtest');

  // Format selection: 'fxreplay' | 'mt5' | 'generic'
  const [selectedFormat, setSelectedFormat] = useState<ImportFormatOption>('fxreplay');
  const [rawText, setRawText] = useState(SAMPLE_FX_REPLAY_SNIPPET);
  const [experimentId, setExperimentId] = useState(defaultId);
  const [pair, setPair] = useState('GBPUSD');
  
  // Session Mode: 'auto' | 'All Sessions' | 'London' | 'London/NY Overlap' | 'New York Open' | 'New York PM' | 'Asian'
  const [sessionSelection, setSessionSelection] = useState<string>('auto');
  // Default timezone offset: UTC+3 Nairobi time as requested!
  const [timezoneOffset, setTimezoneOffset] = useState<number>(3);

  const [timeframe, setTimeframe] = useState<TimeframeType>('M5');
  const [setupModel, setSetupModel] = useState('FX Replay Systematic Model');
  const [title, setTitle] = useState('GBPUSD M5 FX Replay Backtest');
  const [keyFinding, setKeyFinding] = useState('Imported execution dataset proves positive mathematical expectancy.');
  const [verdict, setVerdict] = useState<VerdictType>('KEEP');

  // Detected format from actual text
  const isDetectedFxReplay = isFxReplayFormat(rawText);

  // Parse result according to format, session mode, and timezone offset
  let parsedTrades: SingleTrade[] = [];
  let fxMetadata: FxReplayParseResult | null = null;

  const sessionModeForParser = sessionSelection === 'auto' ? 'auto' : (sessionSelection as SessionType);

  if (isDetectedFxReplay || selectedFormat === 'fxreplay') {
    fxMetadata = parseFxReplayCsv(rawText, pair, sessionModeForParser, timezoneOffset);
    parsedTrades = fxMetadata.trades;
  } else {
    parsedTrades = parseMt5OrCsvText(rawText, pair, sessionModeForParser, timezoneOffset);
  }

  const stats = calculateTradeStats(parsedTrades);

  // Compute session distribution across parsed trades
  const sessionBreakdown: Record<string, number> = {};
  parsedTrades.forEach((t) => {
    sessionBreakdown[t.session] = (sessionBreakdown[t.session] || 0) + 1;
  });
  const sessionBreakdownEntries = Object.entries(sessionBreakdown);

  // Auto-fill pair and title when FX Replay data is detected
  useEffect(() => {
    if (isDetectedFxReplay && fxMetadata && fxMetadata.detectedPair) {
      const detected = fxMetadata.detectedPair;
      setPair(detected);
      setTitle(`${detected} ${timeframe} FX Replay Backtest`);
      setSetupModel('FX Replay Systematic Model');
      setKeyFinding(`Backtest of ${fxMetadata.trades.length} trades on ${detected} proves positive expectancy.`);
    }
  }, [isDetectedFxReplay, fxMetadata?.detectedPair, timeframe]);

  // Format switcher handler
  const handleFormatChange = (fmt: ImportFormatOption) => {
    setSelectedFormat(fmt);
    if (fmt === 'fxreplay') {
      setRawText(SAMPLE_FX_REPLAY_SNIPPET);
      setPair('GBPUSD');
      setTitle('GBPUSD M5 FX Replay Backtest');
      setSetupModel('FX Replay Systematic Model');
    } else if (fmt === 'mt5') {
      setRawText(SAMPLE_MT5_SNIPPET);
      setPair('EURUSD');
      setTitle('EURUSD M5 MT5 Statement');
      setSetupModel('MetaTrader Execution Model');
    }
  };

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

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTrades.length === 0) return;

    const startDate = parsedTrades[0]?.date || new Date().toISOString().split('T')[0];
    const endDate = parsedTrades[parsedTrades.length - 1]?.date || startDate;

    const isFx = isDetectedFxReplay || selectedFormat === 'fxreplay';

    // Determine final experiment session
    let finalSession: SessionType = 'London';
    if (sessionSelection === 'auto') {
      // If trades span multiple sessions, set as 'All Sessions'
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
      ? ['fxreplay', 'backtest', pair.toLowerCase(), sessionTag]
      : ['mt5-import', 'tradetally', pair.toLowerCase(), sessionTag];

    // Add individual session tags if multi-session
    if (finalSession === 'All Sessions') {
      sessionBreakdownEntries.forEach(([s]) => {
        finalTags.push(s.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      });
    }

    const newExperiment: Experiment = {
      id: experimentId.trim() || defaultId,
      title: title.trim() || `${pair} ${timeframe} ${setupModel}`,
      type: 'backtest',
      pair,
      timeframe,
      session: finalSession,
      setupModel,
      startDate,
      endDate,
      sampleSize: parsedTrades.length,
      trades: parsedTrades,
      keyFinding:
        keyFinding.trim() ||
        (isFx
          ? `Verified FX Replay dataset: ${parsedTrades.length} trades, ${stats.winRate}% win rate, ${stats.netR >= 0 ? '+' : ''}${stats.netR}R yield across ${sessionBreakdownEntries.length} session(s).`
          : 'Verified live execution dataset imported from statement.'),
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
                    <Sparkles className="w-3 h-3" /> FX Replay Detected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Supports FX Replay CSV exports with auto-sessions, MetaTrader 5 statements, and TradeTally logs.
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
        <div className="px-6 pt-4 pb-2 bg-[#10111A] border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171926] border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleFormatChange('fxreplay')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'fxreplay'
                  ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>FX Replay Export (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange('mt5')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'mt5'
                  ? 'bg-sky-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>MetaTrader 4 / 5 (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange('generic')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                selectedFormat === 'generic'
                  ? 'bg-[#00FF66] text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Generic CSV / TradeTally</span>
            </button>
          </div>

          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#181B28] hover:bg-[#202436] text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* FX Replay Account Metrics Banner */}
        {fxMetadata && (fxMetadata.initialBalance || fxMetadata.currentRealizedBalance) && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-transparent border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                FXR
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  FX Replay Account Simulation Summary
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Initial: <strong>${fxMetadata.initialBalance?.toLocaleString()}</strong> → Final:{' '}
                  <strong>${fxMetadata.currentRealizedBalance?.toLocaleString()}</strong>
                </span>
              </div>
            </div>
            {fxMetadata.netPnL !== undefined && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Realized PnL</span>
                <span
                  className={`text-sm font-extrabold font-mono ${
                    fxMetadata.netPnL >= 0 ? 'text-[#00FF66]' : 'text-rose-400'
                  }`}
                >
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
                Pair / Instrument
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
                placeholder="GBPUSD"
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
                <option value="London">London (07:00 - 12:00 UTC)</option>
                <option value="London/NY Overlap">London/NY Overlap (12:00 - 16:00 UTC)</option>
                <option value="New York Open">New York Open (12:00 - 15:00 UTC)</option>
                <option value="New York PM">New York PM (16:00 - 21:00 UTC)</option>
                <option value="Asian">Asian Session (21:00 - 07:00 UTC)</option>
              </select>
            </div>
          </div>

          {/* Timezone & Multi-Session Control Box */}
          <div className="p-3.5 rounded-2xl bg-[#141624] border border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Execution Timezone (For Session Conversion)</span>
                    {timezoneOffset === 3 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Nairobi UTC+3 Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Maps each trade's timestamp into its institutional market session (London, Overlap, New York, or Asian).
                  </p>
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

            {/* Session Distribution Breakdown Pill Strip */}
            {sessionBreakdownEntries.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Detected Sessions ({parsedTrades.length} trades):</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {sessionBreakdownEntries.map(([sess, count]) => {
                    const colorClass = getSessionColorClass(sess);
                    return (
                      <span
                        key={sess}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${colorClass}`}
                      >
                        <span>{sess}</span>
                        <strong className="font-extrabold">({count})</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
                placeholder="e.g. GBPUSD M5 Liquidity Sweep Backtest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Strategy / Setup Model
              </label>
              <input
                type="text"
                value={setupModel}
                onChange={(e) => setSetupModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-slate-100 font-semibold focus:border-[#00FF66] focus:outline-none"
                placeholder="e.g. Order Flow / Fair Value Gap / FX Replay"
                required
              />
            </div>
          </div>

          {/* Paste Raw CSV */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <span>CSV Payload / Statement Data</span>
                {selectedFormat === 'fxreplay' && (
                  <span className="text-slate-400 font-normal">
                    (Supports FX Replay columns: id, dateStart, pair, rPnL, side, avgRiskReward...)
                  </span>
                )}
              </label>
              <span className="text-slate-400">
                {parsedTrades.length} trades recognized
              </span>
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw CSV statement here..."
              className="w-full p-3 rounded-xl bg-[#141624] border border-slate-800 text-slate-300 font-mono text-xs focus:border-[#00FF66] focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Real-time Parsed Preview Matrix */}
          <div className="p-3.5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
                Dataset Validation Preview
              </span>
              <span className="text-xs font-mono text-slate-400">
                {parsedTrades.length > 0
                  ? `${parsedTrades[0]?.date} → ${parsedTrades[parsedTrades.length - 1]?.date}`
                  : 'Awaiting data'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Valid Trades</span>
                <span className="text-white font-extrabold text-sm sm:text-base mt-0.5 block">
                  {stats.totalTrades}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Win Rate</span>
                <span
                  className={`font-extrabold text-sm sm:text-base mt-0.5 block ${
                    stats.winRate >= 50 ? 'text-[#00FF66]' : 'text-amber-400'
                  }`}
                >
                  {stats.winRate}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Net R</span>
                <span
                  className={`font-extrabold text-sm sm:text-base mt-0.5 block ${
                    stats.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'
                  }`}
                >
                  {stats.netR >= 0 ? '+' : ''}
                  {stats.netR}R
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Expectancy</span>
                <span className="text-[#00D2FF] font-extrabold text-sm sm:text-base mt-0.5 block">
                  {stats.expectancy >= 0 ? '+' : ''}
                  {stats.expectancy}R
                </span>
              </div>
            </div>

            {/* Execution Samples Preview Table */}
            {parsedTrades.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  <span>Execution Samples (First {Math.min(parsedTrades.length, 5)} Trades):</span>
                  <span className="text-slate-400 normal-case font-medium">
                    Sessions computed in Nairobi UTC+3
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {parsedTrades.slice(0, 5).map((t, idx) => {
                    const sessionColor = getSessionColorClass(t.session);
                    return (
                      <div
                        key={t.id || idx}
                        className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-[#141624] text-slate-300 font-mono border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-slate-400">#{t.tradeNumber}</span>
                          <span>{t.date}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sessionColor}`}>
                            {t.session}
                          </span>
                          <span
                            className={`font-bold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                              t.direction === 'Long'
                                ? 'bg-sky-500/10 text-sky-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {t.direction}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.entryPrice && (
                            <span className="text-slate-400 hidden sm:inline">Entry: {t.entryPrice}</span>
                          )}
                          <span
                            className={`font-extrabold px-2 py-0.5 rounded-lg text-[10px] ${
                              t.result === 'Win'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : t.result === 'Loss'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {t.realizedRR >= 0 ? '+' : ''}
                            {t.realizedRR}R
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
              <span>Commit & Import Study</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
