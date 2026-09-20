import React, { useState, useEffect, useMemo } from 'react';
import {
  Experiment,
  SingleTrade,
  TimeframeType,
  SessionType,
  VerdictType,
} from '../types/trade';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import {
  isFxReplayFormat,
  parseFxReplayCsv,
  FxReplayParseResult,
} from '../utils/fxReplayParser';
import { parseMt5OrCsvText } from '../utils/mt5Parser';
import { calculateTradeStats } from '../utils/calculations';
import {
  reconcileTrades,
  mergeReconciledTrades,
  deduplicateTradeBatch,
} from '../utils/tradeReconciliation';
import {
  X,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Globe,
  Upload,
  Layers,
  Sliders,
  FileText,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Check,
  Filter,
} from 'lucide-react';

type ImportFormatOption = 'fxreplay' | 'mt5' | 'generic';
type TargetModeOption = 'update' | 'new';
type PreviewFilterOption = 'all' | 'new' | 'already_saved' | 'modified';

interface Mt5ImportModalProps {
  onClose: () => void;
  onImport: (
    experiment: Experiment,
    isUpdate?: boolean,
    summary?: { addedCount: number; updatedCount: number; totalCount: number }
  ) => void;
  experiments?: Experiment[];
  initialTargetExperimentId?: string | null;
}

const TIMEZONE_PRESETS = [
  { label: 'Nairobi (UTC+3 / EAT) — Default', offset: 3, flag: '🇰🇪' },
  { label: 'London (UTC+0 / UTC+1 BST)', offset: 1, flag: '🇬🇧' },
  { label: 'New York (UTC-5 / UTC-4 EDT)', offset: -4, flag: '🇺🇸' },
  { label: 'Dubai / Gulf (UTC+4 GST)', offset: 4, flag: '🇦🇪' },
  { label: 'Johannesburg (UTC+2 SAST)', offset: 2, flag: '🇿🇦' },
  { label: 'Tokyo / Sydney (UTC+9)', offset: 9, flag: '🇯🇵' },
  { label: 'UTC Universal Time (UTC+0)', offset: 0, flag: '🌐' },
];

function getSessionColorClass(session: SessionType): string {
  switch (session) {
    case 'London':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'London/NY Overlap':
      return 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30';
    case 'New York Open':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    case 'New York PM':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
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
  initialTargetExperimentId,
}) => {
  const defaultNewId = getNextUniqueExperimentId(experiments, 'backtest');

  // Decide initial target mode: if experiments exist and either initialTarget or experiments > 0, default to 'update'
  const hasExistingExperiments = experiments.length > 0;
  const [targetMode, setTargetMode] = useState<TargetModeOption>(
    hasExistingExperiments ? 'update' : 'new'
  );

  // Selected experiment for updating
  const [targetExperimentId, setTargetExperimentId] = useState<string>(
    initialTargetExperimentId || (experiments[0]?.id ?? '')
  );

  const selectedExperiment = useMemo(() => {
    return experiments.find((e) => e.id === targetExperimentId) || experiments[0] || null;
  }, [experiments, targetExperimentId]);

  // Reconciliation settings
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [previewFilter, setPreviewFilter] = useState<PreviewFilterOption>('all');

  const [selectedFormat, setSelectedFormat] = useState<ImportFormatOption>('fxreplay');
  const [rawText, setRawText] = useState('');
  const [experimentId, setExperimentId] = useState(defaultNewId);
  const [pair, setPair] = useState(selectedExperiment?.pair || '');
  
  // Session Mode: 'auto' | 'All Sessions' | 'London' | 'London/NY Overlap' | 'New York Open' | 'New York PM' | 'Asian'
  const [sessionSelection, setSessionSelection] = useState<string>('auto');
  const [timezoneOffset, setTimezoneOffset] = useState<number>(3); // Default UTC+3 Nairobi

  const [timeframe, setTimeframe] = useState<TimeframeType>(selectedExperiment?.timeframe || 'M5');
  const [setupModel, setSetupModel] = useState(selectedExperiment?.setupModel || '');
  const [title, setTitle] = useState(selectedExperiment?.title || '');
  const [keyFinding, setKeyFinding] = useState('');
  const [verdict, setVerdict] = useState<VerdictType>(selectedExperiment?.verdict || 'KEEP');

  const isDetectedFxReplay = isFxReplayFormat(rawText);

  // Parse raw text into structured trades
  const sessionModeForParser = sessionSelection === 'auto' ? 'auto' : (sessionSelection as SessionType);

  const { parsedTrades, fxMetadata } = useMemo(() => {
    if (!rawText.trim()) {
      return { parsedTrades: [], fxMetadata: null };
    }

    if (isDetectedFxReplay || selectedFormat === 'fxreplay') {
      const meta = parseFxReplayCsv(
        rawText,
        pair || selectedExperiment?.pair || 'EURUSD',
        sessionModeForParser,
        timezoneOffset
      );
      return { parsedTrades: meta.trades, fxMetadata: meta };
    } else {
      const trades = parseMt5OrCsvText(
        rawText,
        pair || selectedExperiment?.pair || 'EURUSD',
        sessionModeForParser,
        timezoneOffset
      );
      return { parsedTrades: trades, fxMetadata: null };
    }
  }, [rawText, isDetectedFxReplay, selectedFormat, pair, selectedExperiment, sessionModeForParser, timezoneOffset]);

  // Reconcile incoming trades against existing study trades
  const reconciliation = useMemo(() => {
    if (!selectedExperiment || parsedTrades.length === 0 || targetMode !== 'update') {
      return null;
    }
    return reconcileTrades(selectedExperiment.trades || [], parsedTrades);
  }, [selectedExperiment, parsedTrades, targetMode]);

  // Real-time calculation of merged statistics to preview exactly how win rate and return merge
  const mergedStatsPreview = useMemo(() => {
    if (!selectedExperiment || parsedTrades.length === 0 || targetMode !== 'update') {
      return null;
    }
    const currentTrades = selectedExperiment.trades || [];
    const merged = mergeReconciledTrades(currentTrades, parsedTrades, {
      preventDuplicates,
      updateExisting,
    });
    const currentStats = calculateTradeStats(currentTrades);
    const incomingOnlyStats = calculateTradeStats(parsedTrades);
    const combinedStats = calculateTradeStats(merged);

    return {
      currentStats,
      incomingOnlyStats,
      combinedStats,
      mergedCount: merged.length,
      currentCount: currentTrades.length,
    };
  }, [selectedExperiment, parsedTrades, targetMode, preventDuplicates, updateExisting]);

  // If user switches target experiment, update local form fields
  const handleSelectTargetExperiment = (id: string) => {
    setTargetExperimentId(id);
    const exp = experiments.find((e) => e.id === id);
    if (exp) {
      setPair(exp.pair);
      setTimeframe(exp.timeframe);
      setTitle(exp.title);
      setSetupModel(exp.setupModel);
      setVerdict(exp.verdict);
    }
  };

  // Auto-detect and suggest study when incoming pair matches an existing study
  useEffect(() => {
    if (fxMetadata?.detectedPair && !initialTargetExperimentId && hasExistingExperiments) {
      const matchingExp = experiments.find(
        (e) => e.pair.toUpperCase() === fxMetadata.detectedPair.toUpperCase()
      );
      if (matchingExp && targetMode === 'update' && targetExperimentId !== matchingExp.id) {
        setTargetExperimentId(matchingExp.id);
        setPair(matchingExp.pair);
        setTimeframe(matchingExp.timeframe);
      }
    }
  }, [fxMetadata?.detectedPair, experiments, initialTargetExperimentId, hasExistingExperiments, targetMode, targetExperimentId]);

  // Auto-fill pair and title when data is detected and in "new" mode
  useEffect(() => {
    if (targetMode === 'new' && isDetectedFxReplay && fxMetadata && fxMetadata.detectedPair) {
      const detected = fxMetadata.detectedPair;
      if (!pair) setPair(detected);
      if (!title) setTitle(`${detected} ${timeframe} Backtest`);
      if (!setupModel) setSetupModel('Systematic Execution Model');
    }
  }, [targetMode, isDetectedFxReplay, fxMetadata?.detectedPair, timeframe, pair, title, setupModel]);

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

  // Handle Import Submit
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTrades.length === 0) return;

    // SCENARIO 1: Update Existing Study (Deduplicate & Merge)
    if (targetMode === 'update' && selectedExperiment) {
      const mergedTrades = mergeReconciledTrades(
        selectedExperiment.trades || [],
        parsedTrades,
        { preventDuplicates, updateExisting }
      );

      const mergedStats = calculateTradeStats(mergedTrades);
      const earliestDate = mergedTrades[0]?.date || selectedExperiment.startDate;
      const latestDate = mergedTrades[mergedTrades.length - 1]?.date || selectedExperiment.endDate || earliestDate;

      const updatedExp: Experiment = {
        ...selectedExperiment,
        trades: mergedTrades,
        sampleSize: mergedTrades.length,
        startDate: earliestDate,
        endDate: latestDate,
        updatedAt: new Date().toISOString(),
        keyFinding:
          keyFinding.trim() ||
          `${mergedTrades.length} trades: ${mergedStats.winRate}% win rate, ${mergedStats.netR >= 0 ? '+' : ''}${mergedStats.netR}R yield, ${mergedStats.expectancy >= 0 ? '+' : ''}${mergedStats.expectancy}R EV.`,
      };

      onImport(updatedExp, true, {
        addedCount: reconciliation?.newCount || 0,
        updatedCount: updateExisting ? reconciliation?.modifiedCount || 0 : 0,
        totalCount: mergedTrades.length,
      });
      onClose();
      return;
    }

    // SCENARIO 2: Create New Study (with internal deduplication)
    const cleanTrades = deduplicateTradeBatch(parsedTrades);
    const chosenPair = pair.trim().toUpperCase() || 'EURUSD';
    const startDate = cleanTrades[0]?.date || new Date().toISOString().split('T')[0];
    const endDate = cleanTrades[cleanTrades.length - 1]?.date || startDate;

    const stats = calculateTradeStats(cleanTrades);

    let dominantSession: SessionType = 'London';
    if (fxMetadata?.dominantSession) {
      dominantSession = fxMetadata.dominantSession;
    } else if (sessionSelection !== 'auto' && sessionSelection !== 'All Sessions') {
      dominantSession = sessionSelection as SessionType;
    }

    const finalTags = [chosenPair.toLowerCase(), timeframe.toLowerCase()];
    if (isDetectedFxReplay) finalTags.push('fxreplay');
    finalTags.push(dominantSession.toLowerCase());

    const newExperiment: Experiment = {
      id: experimentId.trim().toUpperCase(),
      title: title.trim() || `${chosenPair} ${timeframe} Study`,
      type: 'backtest',
      pair: chosenPair,
      timeframe,
      session: dominantSession,
      setupModel: setupModel.trim() || 'Systematic Execution Model',
      startDate,
      endDate,
      sampleSize: cleanTrades.length,
      trades: cleanTrades,
      keyFinding:
        keyFinding.trim() ||
        `${cleanTrades.length} trades: ${stats.winRate}% win rate, ${stats.netR >= 0 ? '+' : ''}${stats.netR}R yield, ${stats.expectancy >= 0 ? '+' : ''}${stats.expectancy}R EV.`,
      verdict,
      screenshotUrls: [],
      tags: Array.from(new Set(finalTags)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedToWhatsApp: false,
    };

    onImport(newExperiment, false);
    onClose();
  };

  // Filter trade preview list
  const filteredPreviewTrades = useMemo(() => {
    if (!reconciliation || targetMode !== 'update') {
      return parsedTrades;
    }

    if (previewFilter === 'new') {
      return reconciliation.newTrades;
    }
    if (previewFilter === 'already_saved') {
      return reconciliation.allMatched.map((m) => m.incoming);
    }
    if (previewFilter === 'modified') {
      return reconciliation.modifiedTrades.map((m) => m.incoming);
    }
    return parsedTrades;
  }, [reconciliation, targetMode, previewFilter, parsedTrades]);

  // Overall stats for preview
  const previewStats = calculateTradeStats(parsedTrades);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
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
                  Import Backtest / Statement Data
                </h3>
                {isDetectedFxReplay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Sparkles className="w-3 h-3" /> FX Replay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Compare incoming trade samples with existing studies, skip duplicates, and sync updates.
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

        {/* Target Study Mode Selector */}
        {hasExistingExperiments && (
          <div className="px-6 py-3 bg-[#11131E] border-b border-slate-800/80">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171926] border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTargetMode('update')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    targetMode === 'update'
                      ? 'bg-[#00FF66] text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update Existing Study</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('new')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    targetMode === 'new'
                      ? 'bg-[#00FF66] text-black font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create as New Study</span>
                </button>
              </div>

              {targetMode === 'update' && (
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">Target:</span>
                  <select
                    value={targetExperimentId}
                    onChange={(e) => handleSelectTargetExperiment(e.target.value)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#181B28] border border-slate-700 text-xs text-white font-bold focus:border-[#00FF66] focus:outline-none"
                  >
                    {experiments.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        [{exp.id}] {exp.title} ({exp.trades.length} trades • {exp.pair})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Format Selector Bar */}
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
                  ? 'bg-purple-500 text-white font-extrabold shadow-sm'
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

        <form onSubmit={handleImport} className="p-6 space-y-4">
          {/* CSV Text Input Area */}
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
              placeholder="Paste updated FX Replay export or MetaTrader trade rows here..."
              className="w-full p-3 rounded-xl bg-[#141624] border border-slate-800 text-slate-300 font-mono text-xs focus:border-[#00FF66] focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* DEDUPLICATION & RECONCILIATION CARD (When updating an existing study) */}
          {targetMode === 'update' && selectedExperiment && parsedTrades.length > 0 && reconciliation && (
            <div className="p-4 rounded-2xl bg-[#121422] border border-[#00FF66]/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Incremental Sample Reconciliation
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Comparing statement against <strong>[{selectedExperiment.id}] {selectedExperiment.title}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#181B28] text-slate-300 border border-slate-700">
                  Study Size: <strong>{selectedExperiment.trades.length}</strong> →{' '}
                  <strong className="text-[#00FF66]">
                    {preventDuplicates
                      ? selectedExperiment.trades.length + reconciliation.newCount
                      : selectedExperiment.trades.length + reconciliation.totalIncoming}
                  </strong>{' '}
                  trades
                </div>
              </div>

              {/* 4 Reconciliation Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                <div className="p-2 rounded-xl bg-[#171926] border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Statement Total</span>
                  <span className="text-white font-bold text-sm mt-0.5 block">
                    {reconciliation.totalIncoming}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#171926] border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Already Saved</span>
                  <span className="text-slate-300 font-bold text-sm mt-0.5 block">
                    {reconciliation.alreadyImportedCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#171926] border border-[#00FF66]/30">
                  <span className="text-[#00FF66] block text-[10px] uppercase font-bold">New Samples</span>
                  <span className="text-[#00FF66] font-bold text-sm mt-0.5 block">
                    +{reconciliation.newCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#171926] border border-amber-500/30">
                  <span className="text-amber-400 block text-[10px] uppercase">Modified</span>
                  <span className="text-amber-400 font-bold text-sm mt-0.5 block">
                    {reconciliation.modifiedCount}
                  </span>
                </div>
              </div>

              {/* Live Win Rate & Yield Merged Preview Card */}
              {mergedStatsPreview && (
                <div className="p-3 rounded-xl bg-[#0B0D15] border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
                      Win Rate & Return Merged Preview
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40">
                      Consolidated (Not Added)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-[#141624] border border-slate-800">
                      <div className="text-[10px] text-slate-400">Current Study ({mergedStatsPreview.currentCount})</div>
                      <div className="text-white font-bold text-sm mt-0.5">{mergedStatsPreview.currentStats.winRate}% WR</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {mergedStatsPreview.currentStats.netR >= 0 ? '+' : ''}{mergedStatsPreview.currentStats.netR}R
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#141624] border border-slate-800">
                      <div className="text-[10px] text-slate-400">Statement Batch ({parsedTrades.length})</div>
                      <div className="text-amber-400 font-bold text-sm mt-0.5">{mergedStatsPreview.incomingOnlyStats.winRate}% WR</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {mergedStatsPreview.incomingOnlyStats.netR >= 0 ? '+' : ''}{mergedStatsPreview.incomingOnlyStats.netR}R
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30">
                      <div className="text-[10px] text-[#00FF66] font-bold">Unified Study ({mergedStatsPreview.mergedCount})</div>
                      <div className="text-[#00FF66] font-extrabold text-sm mt-0.5">{mergedStatsPreview.combinedStats.winRate}% WR</div>
                      <div className="text-[10px] text-[#00FF66] font-sans font-bold mt-0.5">
                        {mergedStatsPreview.combinedStats.netR >= 0 ? '+' : ''}{mergedStatsPreview.combinedStats.netR}R
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Deduplication & Update Options */}
              <div className="pt-1 space-y-2 border-t border-slate-800/80">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={preventDuplicates}
                    onChange={(e) => setPreventDuplicates(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#00FF66] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white">Prevent duplicate trades (Recommended)</span>
                    <p className="text-[11px] text-slate-400">
                      Only append the <strong>{reconciliation.newCount} new trade samples</strong>. Skips the {reconciliation.alreadyImportedCount} trades already recorded in this study.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#00FF66] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white">Update existing trades if modified in file</span>
                    <p className="text-[11px] text-slate-400">
                      Syncs revised realized RR, exit prices, or tags for previously recorded trades while preserving your screenshots and personal notes.
                    </p>
                  </div>
                </label>
              </div>

              {/* Preview Filter Selector */}
              <div className="flex items-center gap-1.5 pt-2 flex-wrap text-xs font-mono">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter Preview:
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                    previewFilter === 'all'
                      ? 'bg-slate-700 text-white border-slate-500 font-bold'
                      : 'text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  All Statement ({parsedTrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('new')}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                    previewFilter === 'new'
                      ? 'bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/40 font-bold'
                      : 'text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  New Samples (+{reconciliation.newCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('already_saved')}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                    previewFilter === 'already_saved'
                      ? 'bg-slate-800 text-slate-200 border-slate-600 font-bold'
                      : 'text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Already in Study ({reconciliation.alreadyImportedCount})
                </button>
                {reconciliation.modifiedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('modified')}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                      previewFilter === 'modified'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Modified ({reconciliation.modifiedCount})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* New Study Parameters (Only visible in 'new' mode) */}
          {targetMode === 'new' && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#12131D] border border-slate-800/80">
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
                    <span>Session Mode</span>
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
            </div>
          )}

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

          {/* Trade Preview Matrix */}
          {parsedTrades.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
                  Trade Validation Preview ({filteredPreviewTrades.length})
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {parsedTrades[0]?.date} → {parsedTrades[parsedTrades.length - 1]?.date}
                </span>
              </div>

              {/* Trade Samples List */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {filteredPreviewTrades.slice(0, 8).map((t, idx) => {
                  // Determine status for this trade if in update mode
                  let statusBadge = null;
                  if (reconciliation && targetMode === 'update') {
                    const matchedMod = reconciliation.modifiedTrades.find((m) => m.incoming.id === t.id);
                    const matchedIdentical = reconciliation.identicalTrades.find((m) => m.incoming.id === t.id);
                    if (matchedMod) {
                      statusBadge = (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Modified
                        </span>
                      );
                    } else if (matchedIdentical) {
                      statusBadge = (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                          Already Saved
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40">
                          New Sample
                        </span>
                      );
                    }
                  }

                  return (
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
                        {statusBadge}
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
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#12131D] border border-slate-800/60 text-center text-xs text-slate-400 font-mono">
              Paste statement CSV or upload a file above to compare trade samples.
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
              disabled={
                parsedTrades.length === 0 ||
                (targetMode === 'update' &&
                  preventDuplicates &&
                  (reconciliation?.newCount || 0) === 0 &&
                  (!updateExisting || (reconciliation?.modifiedCount || 0) === 0))
              }
              className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E55C] disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center gap-2"
            >
              {targetMode === 'update' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {(reconciliation?.newCount || 0) > 0
                      ? `Update Study (+${reconciliation?.newCount} New Trades)`
                      : (reconciliation?.modifiedCount || 0) > 0
                      ? `Update Study (${reconciliation?.modifiedCount} Modified)`
                      : 'All Trades Already Saved'}
                  </span>
                </>
              ) : (
                <>
                  <span>Create Study ({deduplicateTradeBatch(parsedTrades).length} Trades)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
