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
  const [screenshotUrl, setScreenshotUrl] = useState('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#222222] bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-[#00FF00]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Create Research Experiment
              </h2>
              <p className="text-[10px] text-[#666]">
                Backtest or live trading test series for Codem Trading Lab
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-1.5 font-mono">
            {[
              { id: 'backtest', label: '🧪 Backtest' },
              { id: 'live', label: '⚡ Live Trade' },
              { id: 'forward_test', label: '🔭 Forward Test' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id as TradeType)}
                className={`py-2 px-2 rounded font-bold border transition-all text-center text-[11px] ${
                  type === t.id
                    ? 'bg-[#1A1A1A] border-[#00FF00] text-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.15)]'
                    : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Row 1: ID & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Experiment ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder="e.g. BT-029"
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] font-mono text-[#00FF00] font-bold focus:border-[#00FF00] focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Experiment Title / Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. EURUSD M5 London Sweep + Displacement"
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Row 2: Pair, Timeframe, Session */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Asset / Pair
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none"
              >
                {['EURUSD', 'GBPUSD', 'XAUUSD', 'US100', 'BTCUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'US30'].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
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
                Trading Session
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

          {/* Row 3: Setup Model */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
              Setup Model / Concept Name
            </label>
            <input
              type="text"
              value={setupModel}
              onChange={(e) => setSetupModel(e.target.value)}
              placeholder="e.g. Liquidity Sweep + M5 Displacement"
              className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-sans"
              required
            />
          </div>

          {/* Row 4: Trade Sample & Simulation Parameters */}
          <div className="p-3 rounded bg-[#0A0A0A] border border-[#222222] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#00FF00] flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#00FF00]" />
              Dataset & Statistical Parameters
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[9px] text-[#777] mb-1">Sample Size (Trades)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value) || 50)}
                  className="w-full px-2.5 py-1 rounded bg-[#161616] border border-[#2A2A2A] text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] text-[#777] mb-1">Target Win Rate (%)</label>
                <input
                  type="number"
                  min="10"
                  max="95"
                  value={winRateInput}
                  onChange={(e) => setWinRateInput(parseFloat(e.target.value) || 48)}
                  className="w-full px-2.5 py-1 rounded bg-[#161616] border border-[#2A2A2A] text-[#00FF00] font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] text-[#777] mb-1">Target Avg R:R</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={avgRRInput}
                  onChange={(e) => setAvgRRInput(parseFloat(e.target.value) || 2.3)}
                  className="w-full px-2.5 py-1 rounded bg-[#161616] border border-[#2A2A2A] text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Key Finding & Hypotheses */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Key Research Finding (Shown in WhatsApp Post)
              </label>
              <textarea
                rows={2}
                value={keyFinding}
                onChange={(e) => setKeyFinding(e.target.value)}
                placeholder="What did this test prove about the market structure or edge?"
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none resize-none font-sans text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Initial Verdict
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'KEEP', label: '🟢 KEEP' },
                  { id: 'KEEP_TESTING', label: '🟡 TESTING' },
                  { id: 'DISCARD', label: '🔴 DISCARD' },
                  { id: 'MODIFY_PARAMS', label: '🔄 MODIFY' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVerdict(v.id as VerdictType)}
                    className={`py-1.5 px-2 rounded text-center font-bold border transition-all text-[10px] ${
                      verdict === v.id
                        ? 'bg-[#1A1A1A] border-[#00FF00] text-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.15)]'
                        : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: Chart Screenshot & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Chart Screenshot URL
              </label>
              <input
                type="url"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#888] mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. liquidity-sweep, london, fvg"
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-white focus:border-[#00FF00] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Footer Submit */}
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
              className="px-4 py-1.5 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Experiment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
