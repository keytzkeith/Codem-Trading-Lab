import React, { useState } from 'react';
import { Experiment, SessionType, SingleTrade, TimeframeType, VerdictType } from '../types/trade';
import { parseMt5OrCsvText } from '../utils/mt5Parser';
import { calculateTradeStats } from '../utils/calculations';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import { X, FileSpreadsheet, ArrowRight, CheckCircle2, AlertCircle, FileText, Upload } from 'lucide-react';

interface Mt5ImportModalProps {
  onClose: () => void;
  onImport: (experiment: Experiment) => void;
  experiments?: Experiment[];
  existingCount?: number;
}

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

  const [rawText, setRawText] = useState(SAMPLE_MT5_SNIPPET);
  const [experimentId, setExperimentId] = useState(defaultId);
  const [pair, setPair] = useState('EURUSD');
  const [session, setSession] = useState<SessionType>('London');
  const [timeframe, setTimeframe] = useState<TimeframeType>('M5');
  const [setupModel, setSetupModel] = useState('MT5 Exported Execution Model');
  const [keyFinding, setKeyFinding] = useState('Imported MT5 trade history proves favorable risk/reward asymmetry.');
  const [verdict, setVerdict] = useState<VerdictType>('KEEP');

  // Preview parsed trades
  const parsedTrades: SingleTrade[] = parseMt5OrCsvText(rawText, pair, session);
  const stats = calculateTradeStats(parsedTrades);

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTrades.length === 0) return;

    const newExperiment: Experiment = {
      id: experimentId.trim() || defaultId,
      title: `${pair} ${timeframe} ${setupModel} (MT5 Import)`,
      type: 'backtest',
      pair,
      timeframe,
      session,
      setupModel,
      startDate: parsedTrades[0]?.date || new Date().toISOString().split('T')[0],
      endDate: parsedTrades[parsedTrades.length - 1]?.date || new Date().toISOString().split('T')[0],
      sampleSize: parsedTrades.length,
      trades: parsedTrades,
      keyFinding: keyFinding.trim() || 'Verified live execution dataset imported from MT5.',
      verdict,
      screenshotUrls: [],
      tags: ['mt5-import', 'tradetally', pair.toLowerCase(), session.toLowerCase()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedToWhatsApp: false,
    };

    onImport(newExperiment);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) setRawText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#12131D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs sm:text-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161826] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2235] border border-slate-700 flex items-center justify-center text-[#00FF66]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Import MT5 / TradeTally / CSV Statement
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Automatically convert raw MetaTrader logs into R-multiple distributions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleImport} className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Study ID
              </label>
              <input
                type="text"
                value={experimentId}
                onChange={(e) => setExperimentId(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-[#00FF66] font-bold focus:border-[#00FF66] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Asset / Pair
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
              >
                {['EURUSD', 'GBPUSD', 'XAUUSD', 'US100', 'BTCUSD', 'USDJPY', 'GBPJPY', 'AUDUSD'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
              >
                {['M1', 'M5', 'M15', 'H1', 'H4', 'D1'].map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:border-[#00FF66] focus:outline-none"
              >
                {['London', 'New York', 'Asia', 'London Close'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paste CSV Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="font-bold text-slate-300 uppercase">
                Paste MT5 Report / CSV Text
              </label>
              <label className="cursor-pointer text-[#00FF66] hover:underline font-bold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#0B0C12] border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00FF66]"
              placeholder="Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Profit,Realized R..."
            />
          </div>

          {/* Parsed Preview Statistics */}
          <div className="p-4 rounded-2xl bg-[#0B0C12] border border-slate-800 font-mono">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold uppercase text-slate-400">
                Parsed Executions Preview ({parsedTrades.length} Trades)
              </span>
              <span className="text-[#00FF66] font-bold">
                Win Rate: {stats.winRate}% | Net Yield: {stats.netR >= 0 ? '+' : ''}{stats.netR}R
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-xs">Total Trades</span>
                <span className="text-white font-extrabold text-sm sm:text-base mt-0.5 block">{stats.totalTrades}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-xs">Win / Loss</span>
                <span className="text-[#00FF66] font-extrabold text-sm sm:text-base mt-0.5 block">{stats.wins}W / {stats.losses}L</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-xs">Avg Payoff</span>
                <span className="text-white font-extrabold text-sm sm:text-base mt-0.5 block">{stats.avgRR}R</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181B28] border border-slate-800">
                <span className="text-slate-400 block text-xs">Expectancy</span>
                <span className="text-[#00D2FF] font-extrabold text-sm sm:text-base mt-0.5 block">{stats.expectancy >= 0 ? '+' : ''}{stats.expectancy}R</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#181B28] hover:bg-[#1E2235] text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedTrades.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all disabled:opacity-40"
            >
              Import {parsedTrades.length} Trades
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
