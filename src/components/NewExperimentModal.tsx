import React, { useState } from 'react';
import { Experiment, SessionType, TimeframeType, TradeType, VerdictType, SingleTrade } from '../types/trade';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import { X, Sparkles, Plus, Layers, Sliders, CheckCircle, Upload } from 'lucide-react';

interface NewExperimentModalProps {
  onClose: () => void;
  onSave: (experiment: Experiment) => void;
  experiments?: Experiment[];
  existingCount?: number;
}

export const NewExperimentModal: React.FC<NewExperimentModalProps> = ({
  onClose,
  onSave,
  experiments = [],
}) => {
  const initialId = getNextUniqueExperimentId(experiments, 'backtest');

  const [type, setType] = useState<TradeType>('backtest');
  const [id, setId] = useState(initialId);
  const [title, setTitle] = useState('');
  const [pair, setPair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState<TimeframeType>('M5');
  const [session, setSession] = useState<SessionType>('London');
  const [setupModel, setSetupModel] = useState('Liquidity Sweep + M5 Displacement');
  const [sampleSize, setSampleSize] = useState(50);
  const [winRateInput, setWinRateInput] = useState(48);
  const [avgRRInput, setAvgRRInput] = useState(2.3);
  const [keyFinding, setKeyFinding] = useState('Liquidity sweeps followed by displacement produced solid risk-adjusted returns during London open.');
  const [hypotheses, setHypotheses] = useState('Asian high/low liquidity grabs trigger institutional algorithmic order flow.');
  const [verdict, setVerdict] = useState<VerdictType>('KEEP');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('liquidity-sweep, london-open, displacement');

  const handleTypeChange = (newType: TradeType) => {
    setType(newType);
    setId(getNextUniqueExperimentId(experiments, newType));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate trades based on configured parameters
    const trades: SingleTrade[] = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - sampleSize);

    for (let i = 1; i <= sampleSize; i++) {
      const isWin = Math.random() < winRateInput / 100;
      const isBE = !isWin && Math.random() < 0.07;
      let realizedRR = 0;
      let res: SingleTrade['result'] = 'Loss';

      if (isWin) {
        res = 'Win';
        realizedRR = Number((avgRRInput + (Math.random() - 0.5) * 0.6).toFixed(2));
      } else if (isBE) {
        res = 'Breakeven';
        realizedRR = 0;
      } else {
        res = 'Loss';
        realizedRR = -1.0;
      }

      const tradeDate = new Date(baseDate.getTime() + i * 86400000 * 0.7);

      trades.push({
        id: `tr-${i}-${id}-${Date.now()}`,
        tradeNumber: i,
        date: tradeDate.toISOString().split('T')[0],
        pair,
        session,
        direction: Math.random() > 0.5 ? 'Long' : 'Short',
        plannedRR: avgRRInput,
        realizedRR,
        result: res,
        notes: isWin ? 'Target filled with clean displacement' : isBE ? 'Protected at breakeven' : 'Stop loss triggered on reversal',
        setupRuleFollowed: true,
      });
    }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    const newExperiment: Experiment = {
      id: id.trim() || initialId,
      title: title.trim() || `${pair} ${timeframe} ${setupModel}`,
      type,
      pair,
      timeframe,
      session,
      setupModel,
      startDate: trades[0]?.date || new Date().toISOString().split('T')[0],
      endDate: trades[trades.length - 1]?.date || new Date().toISOString().split('T')[0],
      sampleSize,
      trades,
      keyFinding: keyFinding.trim() || 'Statistical rules demonstrated consistent risk/reward distribution.',
      hypotheses: hypotheses.trim(),
      verdict,
      screenshotUrls: screenshotUrl.trim() ? [screenshotUrl.trim()] : [],
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedToWhatsApp: false,
    };

    onSave(newExperiment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl bg-[#12131D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs sm:text-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161826] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2235] border border-slate-700 flex items-center justify-center text-[#00FF66]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Create Research Experiment
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Quantitative study setup for Codem Trading Lab
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[
              { id: 'backtest', label: '🧪 Backtest' },
              { id: 'live', label: '⚡ Live Trade' },
              { id: 'forward_test', label: '🔭 Forward Test' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id as TradeType)}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center text-xs sm:text-sm ${
                  type === t.id
                    ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                    : 'bg-[#181B28] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Study ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white font-bold focus:outline-none focus:border-[#00FF66]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Asset Pair
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-[#00FF66] font-bold focus:outline-none focus:border-[#00FF66]"
                placeholder="EURUSD, NAS100..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Study Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. London Open Liquidity Sweep Series"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              >
                <option value="M1">M1</option>
                <option value="M5">M5</option>
                <option value="M15">M15</option>
                <option value="H1">H1</option>
                <option value="H4">H4</option>
                <option value="D1">D1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Trading Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              >
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Asia">Asia</option>
                <option value="London Close">London Close</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Setup Strategy Model
            </label>
            <input
              type="text"
              value={setupModel}
              onChange={(e) => setSetupModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              required
            />
          </div>

          {/* Sample parameters */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0B0C12] border border-slate-800 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sample Size
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={sampleSize}
                onChange={(e) => setSampleSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181B28] border border-slate-700 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#00FF66] mb-1">
                Win Rate %
              </label>
              <input
                type="number"
                min="5"
                max="95"
                value={winRateInput}
                onChange={(e) => setWinRateInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181B28] border border-slate-700 text-[#00FF66] font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
                Avg RR
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={avgRRInput}
                onChange={(e) => setAvgRRInput(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181B28] border border-slate-700 text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
              Key Research Finding
            </label>
            <textarea
              rows={2}
              value={keyFinding}
              onChange={(e) => setKeyFinding(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#181B28] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00FF66]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Verdict
              </label>
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as VerdictType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              >
                <option value="KEEP">KEEP (Positive Edge)</option>
                <option value="KEEP_TESTING">KEEP TESTING</option>
                <option value="DISCARD">DISCARD</option>
                <option value="MODIFY_PARAMS">MODIFY PARAMS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
                placeholder="sweep, london, trend..."
              />
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
              className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all"
            >
              Create Study
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
