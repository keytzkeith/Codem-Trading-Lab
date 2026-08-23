import React, { useState } from 'react';
import { Experiment, SessionType, SingleTrade, TimeframeType, VerdictType } from '../types/trade';
import { parseMt5OrCsvText } from '../utils/mt5Parser';
import { calculateTradeStats } from '../utils/calculations';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import { X, FileSpreadsheet, ArrowRight, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

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
      screenshotUrls: ['https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80'],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#222222] bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-[#00FF00]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Import MT5 / TradeTally / CSV History
              </h2>
              <p className="text-[10px] text-[#666]">
                Parse raw trade logs to calculate R-multiples and generate stats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleImport} className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Experiment ID
              </label>
              <input
                type="text"
                value={experimentId}
                onChange={(e) => setExperimentId(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] font-mono text-[#00FF00] font-bold focus:border-[#00FF00] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Asset / Pair
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none"
              >
                {['EURUSD', 'GBPUSD', 'XAUUSD', 'US100', 'BTCUSD', 'USDJPY', 'GBPJPY', 'AUDUSD'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none"
              >
                {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionType)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none"
              >
                {['London', 'New York Open', 'New York PM', 'Asian', 'London/NY Overlap'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Setup Model & Verdict */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Setup Model
              </label>
              <input
                type="text"
                value={setupModel}
                onChange={(e) => setSetupModel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-sans"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Verdict
              </label>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as VerdictType)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white font-semibold focus:border-[#00FF00] focus:outline-none"
              >
                <option value="KEEP">🟢 KEEP (Verified Edge)</option>
                <option value="KEEP_TESTING">🟡 KEEP TESTING</option>
                <option value="DISCARD">🔴 DISCARD</option>
                <option value="MODIFY_PARAMS">🔄 MODIFY PARAMS</option>
              </select>
            </div>
          </div>

          {/* Raw Text Input & File Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-[#888]">
                Paste MT5 Report / CSV Text
              </label>
              <label className="cursor-pointer text-[#00FF00] hover:text-[#00CC00] font-semibold flex items-center gap-1 text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                <span>Upload .csv / .txt</span>
                <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste comma, tab or semicolon delimited trade rows..."
              className="w-full p-2.5 rounded bg-[#0A0A0A] border border-[#222222] font-mono text-[11px] text-[#CCC] focus:outline-none focus:border-[#00FF00]"
            />
          </div>

          {/* Auto Parsed Real-Time Stats Preview */}
          <div className="p-3 rounded bg-[#0A0A0A] border border-[#222222]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#00FF00] mb-2 flex items-center justify-between">
              <span>Auto-Calculated Import Metrics</span>
              <span className="font-mono text-[#666]">{parsedTrades.length} Trades Parsed</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-[#161616] border border-[#222222]">
                <span className="text-[9px] text-[#777] uppercase">Win Rate</span>
                <div className="text-sm font-bold font-mono text-[#00FF00] mt-0.5">{stats.winRate}%</div>
              </div>
              <div className="p-2 rounded bg-[#161616] border border-[#222222]">
                <span className="text-[9px] text-[#777] uppercase">Net Yield</span>
                <div className={`text-sm font-bold font-mono mt-0.5 ${stats.netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                  {stats.netR >= 0 ? '+' : ''}{stats.netR}R
                </div>
              </div>
              <div className="p-2 rounded bg-[#161616] border border-[#222222]">
                <span className="text-[9px] text-[#777] uppercase">Expectancy</span>
                <div className="text-sm font-bold font-mono text-[#00FF00] mt-0.5">
                  {stats.expectancy >= 0 ? '+' : ''}{stats.expectancy}R
                </div>
              </div>
              <div className="p-2 rounded bg-[#161616] border border-[#222222]">
                <span className="text-[9px] text-[#777] uppercase">Loss Streak</span>
                <div className="text-sm font-bold font-mono text-[#FF3333] mt-0.5">{stats.maxConsecutiveLosses}</div>
              </div>
            </div>
          </div>

          {/* Key Finding */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
              Key Finding for WhatsApp Report
            </label>
            <input
              type="text"
              value={keyFinding}
              onChange={(e) => setKeyFinding(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-sans text-xs"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-[#777] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedTrades.length === 0}
              className="px-4 py-1.5 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] disabled:opacity-40 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              <span>Import {parsedTrades.length} Trades</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
