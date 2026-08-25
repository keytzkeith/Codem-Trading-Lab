import React, { useState } from 'react';
import { Experiment, SessionType, TimeframeType, TradeType, VerdictType, SingleTrade, TradeDirection, TradeResult } from '../types/trade';
import { getNextUniqueExperimentId } from '../utils/idGenerator';
import { calculateTradeStats } from '../utils/calculations';
import { X, Plus, Sparkles, Trash2, Calendar, Target, HelpCircle, Layers, Sliders, CheckCircle2 } from 'lucide-react';

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

  // Study Basic Meta
  const [type, setType] = useState<TradeType>('backtest');
  const [id, setId] = useState(initialId);
  const [title, setTitle] = useState('');
  const [pair, setPair] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState<TimeframeType>('M5');
  const [session, setSession] = useState<SessionType>('London');
  const [setupModel, setSetupModel] = useState('Liquidity Sweep + M5 Displacement');
  const [keyFinding, setKeyFinding] = useState('Positive risk-to-reward ratio with strict session timing.');
  const [hypotheses, setHypotheses] = useState('Session liquidity grab produces high-probability expansion into opposing imbalance.');
  const [verdict, setVerdict] = useState<VerdictType>('KEEP_TESTING');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('gold, liquidity-sweep, london');

  // Trade Entry Mode: 'manual' (real individual trades) vs 'simulated' (auto-generated sample)
  const [entryMode, setEntryMode] = useState<'manual' | 'simulated'>('manual');

  // Manual Trades List
  const [manualTrades, setManualTrades] = useState<SingleTrade[]>([]);

  // Current Trade Form Inputs for Manual Mode
  const [newTradeDate, setNewTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTradeDirection, setNewTradeDirection] = useState<TradeDirection>('Long');
  const [newTradeSession, setNewTradeSession] = useState<SessionType>('London');
  const [newTradePlannedRR, setNewTradePlannedRR] = useState<number>(2.0);
  const [newTradeRealizedRR, setNewTradeRealizedRR] = useState<number>(2.0);
  const [newTradeResult, setNewTradeResult] = useState<TradeResult>('Win');
  const [newTradeNotes, setNewTradeNotes] = useState('');

  // Simulation Parameters
  const [sampleSize, setSampleSize] = useState(30);
  const [winRateInput, setWinRateInput] = useState(50);
  const [avgRRInput, setAvgRRInput] = useState(2.0);

  const handleTypeChange = (newType: TradeType) => {
    setType(newType);
    setId(getNextUniqueExperimentId(experiments, newType));
  };

  // Realized RR change auto-adjusts result
  const handleRealizedRRChange = (val: number) => {
    setNewTradeRealizedRR(val);
    if (val > 0) {
      setNewTradeResult('Win');
    } else if (val < 0) {
      setNewTradeResult('Loss');
    } else {
      setNewTradeResult('Breakeven');
    }
  };

  const handleAddManualTrade = () => {
    const tradeNum = manualTrades.length + 1;
    const trade: SingleTrade = {
      id: `tr-${tradeNum}-${id}-${Date.now()}`,
      tradeNumber: tradeNum,
      date: newTradeDate,
      pair: pair || 'XAUUSD',
      session: newTradeSession,
      direction: newTradeDirection,
      plannedRR: newTradePlannedRR,
      realizedRR: newTradeRealizedRR,
      result: newTradeResult,
      notes: newTradeNotes.trim() || undefined,
      setupRuleFollowed: true,
    };

    setManualTrades([...manualTrades, trade]);
    setNewTradeNotes('');
  };

  const handleRemoveManualTrade = (index: number) => {
    const updated = manualTrades.filter((_, idx) => idx !== index).map((t, idx) => ({
      ...t,
      tradeNumber: idx + 1,
    }));
    setManualTrades(updated);
  };

  const handleQuickAddWin = () => {
    const tradeNum = manualTrades.length + 1;
    setManualTrades([
      ...manualTrades,
      {
        id: `tr-${tradeNum}-${id}-${Date.now()}`,
        tradeNumber: tradeNum,
        date: newTradeDate,
        pair: pair || 'XAUUSD',
        session,
        direction: 'Long',
        plannedRR: 2.0,
        realizedRR: 2.0,
        result: 'Win',
        notes: 'Target 2R filled clean',
        setupRuleFollowed: true,
      },
    ]);
  };

  const handleQuickAddLoss = () => {
    const tradeNum = manualTrades.length + 1;
    setManualTrades([
      ...manualTrades,
      {
        id: `tr-${tradeNum}-${id}-${Date.now()}`,
        tradeNumber: tradeNum,
        date: newTradeDate,
        pair: pair || 'XAUUSD',
        session,
        direction: 'Short',
        plannedRR: 2.0,
        realizedRR: -1.0,
        result: 'Loss',
        notes: 'Stopped out at 1R',
        setupRuleFollowed: true,
      },
    ]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTrades: SingleTrade[] = [];

    if (entryMode === 'manual') {
      finalTrades = manualTrades;
    } else {
      // Generate simulated statistical sample
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - sampleSize);

      for (let i = 1; i <= sampleSize; i++) {
        const isWin = Math.random() < winRateInput / 100;
        const isBE = !isWin && Math.random() < 0.08;
        let realizedRR = 0;
        let res: SingleTrade['result'] = 'Loss';

        if (isWin) {
          res = 'Win';
          realizedRR = Number((avgRRInput + (Math.random() - 0.5) * 0.4).toFixed(2));
        } else if (isBE) {
          res = 'Breakeven';
          realizedRR = 0;
        } else {
          res = 'Loss';
          realizedRR = -1.0;
        }

        const tradeDate = new Date(baseDate.getTime() + i * 86400000 * 0.7);

        finalTrades.push({
          id: `tr-${i}-${id}-${Date.now()}`,
          tradeNumber: i,
          date: tradeDate.toISOString().split('T')[0],
          pair,
          session,
          direction: Math.random() > 0.5 ? 'Long' : 'Short',
          plannedRR: avgRRInput,
          realizedRR,
          result: res,
          notes: isWin ? 'Target filled at planned RR' : isBE ? 'Protected at breakeven' : 'Stop loss triggered',
          setupRuleFollowed: true,
        });
      }
    }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

    const calculatedStats = calculateTradeStats(finalTrades);

    const newExperiment: Experiment = {
      id: id.trim() || initialId,
      title: title.trim() || `${pair} ${timeframe} ${setupModel}`,
      type,
      pair,
      timeframe,
      session,
      setupModel,
      startDate: finalTrades[0]?.date || new Date().toISOString().split('T')[0],
      endDate: finalTrades[finalTrades.length - 1]?.date || new Date().toISOString().split('T')[0],
      sampleSize: finalTrades.length,
      trades: finalTrades,
      keyFinding:
        keyFinding.trim() ||
        (finalTrades.length > 0
          ? `Sample achieved ${calculatedStats.winRate}% win rate and ${calculatedStats.netR >= 0 ? '+' : ''}${calculatedStats.netR}R return.`
          : 'Backtest study initialized. Individual trades logged live.'),
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

  const manualStats = calculateTradeStats(manualTrades);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-3xl bg-[#12131D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-mono text-xs sm:text-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161826] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2235] border border-slate-700 flex items-center justify-center text-[#00FF66]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Create Research Study
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Configure your backtest hypothesis and log individual trades
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
        <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-5 font-sans">
          {/* Study Type Switcher */}
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

          {/* Core Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
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
                Asset Pair / Symbol
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-[#00FF66] font-bold focus:outline-none focus:border-[#00FF66]"
                placeholder="XAUUSD, EURUSD, NAS100..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              >
                <option value="M1">M1 (1 Minute)</option>
                <option value="M5">M5 (5 Minutes)</option>
                <option value="M15">M15 (15 Minutes)</option>
                <option value="M30">M30 (30 Minutes)</option>
                <option value="H1">H1 (1 Hour)</option>
                <option value="H4">H4 (4 Hours)</option>
                <option value="D1">D1 (Daily)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Trading Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value as SessionType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
              >
                <option value="London">London (08:00 - 16:00 GMT)</option>
                <option value="New York Open">New York Open (13:00 - 17:00 GMT)</option>
                <option value="New York PM">New York PM (17:00 - 21:00 GMT)</option>
                <option value="Asian">Asian (00:00 - 08:00 GMT)</option>
                <option value="London/NY Overlap">London / NY Overlap</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Strategy / Setup Model
              </label>
              <input
                type="text"
                value={setupModel}
                onChange={(e) => setSetupModel(e.target.value)}
                placeholder="e.g. FVG Mitigation + Liquidity Sweep"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
                required
              />
            </div>
          </div>

          {/* Trade Entry Method Selector */}
          <div className="border border-slate-800 rounded-2xl bg-[#0B0C12] p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Trade Data Source
                </span>
                <p className="text-xs text-slate-400">
                  Choose whether to enter individual trades manually or generate a test simulation
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#181B28] p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    entryMode === 'manual'
                      ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✍️ Manual Trades Log ({manualTrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('simulated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    entryMode === 'simulated'
                      ? 'bg-[#38bdf8] text-black shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎲 Auto Simulation
                </button>
              </div>
            </div>

            {/* Manual Trade Entry Mode */}
            {entryMode === 'manual' ? (
              <div className="space-y-3 pt-2">
                {/* Fast Manual Trade Add Bar */}
                <div className="p-3.5 rounded-xl bg-[#161826] border border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-[#00FF66] flex items-center justify-between">
                    <span>+ Log Individual Trade #{manualTrades.length + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleQuickAddWin}
                        className="px-2 py-1 rounded bg-[#00FF66]/20 text-[#00FF66] text-[11px] font-bold border border-[#00FF66]/30 hover:bg-[#00FF66]/30"
                      >
                        + Quick 2R Win
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddLoss}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30 hover:bg-rose-500/30"
                      >
                        + Quick -1R Loss
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                      <input
                        type="date"
                        value={newTradeDate}
                        onChange={(e) => setNewTradeDate(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Direction</label>
                      <select
                        value={newTradeDirection}
                        onChange={(e) => setNewTradeDirection(e.target.value as TradeDirection)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
                      >
                        <option value="Long">Long (Buy)</option>
                        <option value="Short">Short (Sell)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Planned RR</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTradePlannedRR}
                        onChange={(e) => setNewTradePlannedRR(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-white"
                        placeholder="2.0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Realized R</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTradeRealizedRR}
                        onChange={(e) => handleRealizedRRChange(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-[#00FF66] font-bold"
                        placeholder="+2.0 or -1.0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Result</label>
                      <select
                        value={newTradeResult}
                        onChange={(e) => setNewTradeResult(e.target.value as TradeResult)}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
                      >
                        <option value="Win">Win</option>
                        <option value="Loss">Loss</option>
                        <option value="Breakeven">Breakeven</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddManualTrade}
                        className="w-full py-1.5 px-2 bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold rounded-lg uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={newTradeNotes}
                      onChange={(e) => setNewTradeNotes(e.target.value)}
                      placeholder="Trade notes (e.g. 'Asian low swept, M5 displacement confirmed entry')"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0B0C12] border border-slate-700 text-xs text-white placeholder-slate-500 font-sans"
                    />
                  </div>
                </div>

                {/* Entered Trades Table Preview */}
                {manualTrades.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Logged Trades ({manualTrades.length})</span>
                      <div className="flex items-center gap-3">
                        <span>Win Rate: <strong className="text-[#00FF66]">{manualStats.winRate}%</strong></span>
                        <span>Net: <strong className={manualStats.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}>{manualStats.netR >= 0 ? '+' : ''}{manualStats.netR}R</strong></span>
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-[#08090E]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#141522] text-slate-400 text-[11px] border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Date</th>
                            <th className="px-3 py-1.5">Dir</th>
                            <th className="px-3 py-1.5">Result</th>
                            <th className="px-3 py-1.5">Realized R</th>
                            <th className="px-3 py-1.5">Notes</th>
                            <th className="px-3 py-1.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {manualTrades.map((t, idx) => (
                            <tr key={t.id || idx} className="hover:bg-[#161826]">
                              <td className="px-3 py-1 text-slate-400">#{t.tradeNumber}</td>
                              <td className="px-3 py-1 text-slate-300">{t.date}</td>
                              <td className="px-3 py-1 font-bold">
                                <span className={t.direction === 'Long' ? 'text-[#00FF66]' : 'text-rose-400'}>
                                  {t.direction}
                                </span>
                              </td>
                              <td className="px-3 py-1 font-bold">
                                <span className={t.result === 'Win' ? 'text-[#00FF66]' : t.result === 'Loss' ? 'text-rose-400' : 'text-slate-400'}>
                                  {t.result}
                                </span>
                              </td>
                              <td className="px-3 py-1 font-bold text-white">
                                {t.realizedRR > 0 ? `+${t.realizedRR}` : t.realizedRR}R
                              </td>
                              <td className="px-3 py-1 text-slate-400 truncate max-w-[140px] font-sans">
                                {t.notes || '—'}
                              </td>
                              <td className="px-3 py-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveManualTrade(idx)}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-sans italic text-center py-2 bg-[#08090E] rounded-xl border border-slate-800">
                    No trades logged yet. You can add trades above now or create the study and log them live inside the study trade table!
                  </p>
                )}
              </div>
            ) : (
              /* Simulated Mode */
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#161826] border border-slate-700 font-mono">
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
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
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
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-[#00FF66] font-bold"
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
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Research Findings & Hypotheses */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Core Setup Hypothesis
              </label>
              <textarea
                rows={2}
                value={hypotheses}
                onChange={(e) => setHypotheses(e.target.value)}
                placeholder="What edge or mathematical condition are you testing?"
                className="w-full p-3 rounded-xl bg-[#181B28] border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00FF66] font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Research Verdict
                </label>
                <select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value as VerdictType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
                >
                  <option value="KEEP">KEEP (Proven Positive EV Edge)</option>
                  <option value="KEEP_TESTING">KEEP TESTING (Gathering Data)</option>
                  <option value="DISCARD">DISCARD (Negative Expectancy)</option>
                  <option value="MODIFY_PARAMS">MODIFY PARAMS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700 text-white focus:outline-none focus:border-[#00FF66]"
                  placeholder="gold, sweep, london..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#181B28] hover:bg-[#1E2235] text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Create Experiment Study</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
