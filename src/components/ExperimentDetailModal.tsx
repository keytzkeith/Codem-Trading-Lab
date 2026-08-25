import React, { useState } from 'react';
import { Experiment, SingleTrade, VerdictType, SessionType, TradeDirection, TradeResult } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import {
  X,
  Share2,
  TrendingUp,
  Target,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Image as ImageIcon,
  Edit3,
  Save,
  Plus,
  Trash2,
  Zap,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ExperimentDetailModalProps {
  experiment: Experiment;
  onClose: () => void;
  onUpdate: (updated: Experiment) => void;
  onOpenWhatsAppShare: (exp: Experiment) => void;
}

export const ExperimentDetailModal: React.FC<ExperimentDetailModalProps> = ({
  experiment,
  onClose,
  onUpdate,
  onOpenWhatsAppShare,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'findings' | 'screenshots'>('overview');
  const [isEditingFinding, setIsEditingFinding] = useState(false);
  const [editedFinding, setEditedFinding] = useState(experiment.keyFinding);
  const [editedHypothesis, setEditedHypothesis] = useState(experiment.hypotheses || '');
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictType>(experiment.verdict);
  const [verdictNotes, setVerdictNotes] = useState(experiment.verdictNotes || '');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BE'>('ALL');
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Trade management states
  const [showAddTradeForm, setShowAddTradeForm] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);

  // New trade form inputs
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDirection, setNewDirection] = useState<TradeDirection>('Long');
  const [newSession, setNewSession] = useState<SessionType>(experiment.session || 'London');
  const [newPlannedRR, setNewPlannedRR] = useState<number>(2.0);
  const [newRealizedRR, setNewRealizedRR] = useState<number>(2.0);
  const [newResult, setNewResult] = useState<TradeResult>('Win');
  const [newNotes, setNewNotes] = useState('');

  // Editing trade form inputs
  const [editDate, setEditDate] = useState('');
  const [editDirection, setEditDirection] = useState<TradeDirection>('Long');
  const [editSession, setEditSession] = useState<SessionType>('London');
  const [editPlannedRR, setEditPlannedRR] = useState<number>(2.0);
  const [editRealizedRR, setEditRealizedRR] = useState<number>(2.0);
  const [editResult, setEditResult] = useState<TradeResult>('Win');
  const [editNotes, setEditNotes] = useState('');

  const stats = calculateTradeStats(experiment.trades);
  const netSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';

  const handleRealizedRRChange = (val: number) => {
    setNewRealizedRR(val);
    if (val > 0) {
      setNewResult('Win');
    } else if (val < 0) {
      setNewResult('Loss');
    } else {
      setNewResult('Breakeven');
    }
  };

  const handleEditRealizedRRChange = (val: number) => {
    setEditRealizedRR(val);
    if (val > 0) {
      setEditResult('Win');
    } else if (val < 0) {
      setEditResult('Loss');
    } else {
      setEditResult('Breakeven');
    }
  };

  const handleAddTrade = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tradeNumber = experiment.trades.length + 1;
    const newTrade: SingleTrade = {
      id: `tr-${tradeNumber}-${experiment.id}-${Date.now()}`,
      tradeNumber,
      date: newDate,
      pair: experiment.pair,
      session: newSession,
      direction: newDirection,
      plannedRR: Number(newPlannedRR) || 2.0,
      realizedRR: Number(newRealizedRR) || 0,
      result: newResult,
      notes: newNotes.trim() || undefined,
      setupRuleFollowed: true,
    };

    const updatedTrades = [...experiment.trades, newTrade];
    const newStats = calculateTradeStats(updatedTrades);

    const updated: Experiment = {
      ...experiment,
      trades: updatedTrades,
      sampleSize: updatedTrades.length,
      startDate: updatedTrades[0]?.date || experiment.startDate,
      endDate: updatedTrades[updatedTrades.length - 1]?.date || experiment.endDate,
      keyFinding:
        experiment.keyFinding.startsWith('Sample achieved') || experiment.keyFinding.startsWith('Backtest study initialized')
          ? `Sample achieved ${newStats.winRate}% win rate and ${newStats.netR >= 0 ? '+' : ''}${newStats.netR}R return.`
          : experiment.keyFinding,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updated);
    setNewNotes('');
    setShowAddTradeForm(false);
  };

  const handleStartEditTrade = (trade: SingleTrade) => {
    setEditingTradeId(trade.id);
    setEditDate(trade.date);
    setEditDirection(trade.direction);
    setEditSession(trade.session);
    setEditPlannedRR(trade.plannedRR);
    setEditRealizedRR(trade.realizedRR);
    setEditResult(trade.result);
    setEditNotes(trade.notes || '');
  };

  const handleSaveEditTrade = (tradeId: string) => {
    const updatedTrades = experiment.trades.map((t) => {
      if (t.id === tradeId) {
        return {
          ...t,
          date: editDate,
          direction: editDirection,
          session: editSession,
          plannedRR: Number(editPlannedRR) || 2.0,
          realizedRR: Number(editRealizedRR) || 0,
          result: editResult,
          notes: editNotes.trim() || undefined,
        };
      }
      return t;
    });

    const updated: Experiment = {
      ...experiment,
      trades: updatedTrades,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updated);
    setEditingTradeId(null);
  };

  const handleDeleteTrade = (tradeId: string) => {
    const updatedTrades = experiment.trades
      .filter((t) => t.id !== tradeId)
      .map((t, idx) => ({ ...t, tradeNumber: idx + 1 }));

    const updated: Experiment = {
      ...experiment,
      trades: updatedTrades,
      sampleSize: updatedTrades.length,
      startDate: updatedTrades[0]?.date || experiment.startDate,
      endDate: updatedTrades[updatedTrades.length - 1]?.date || experiment.endDate,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updated);
  };

  const handleSaveFindings = () => {
    const updated: Experiment = {
      ...experiment,
      keyFinding: editedFinding,
      hypotheses: editedHypothesis,
      verdict: selectedVerdict,
      verdictNotes,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setIsEditingFinding(false);
  };

  const handleAddScreenshot = () => {
    if (!newScreenshotUrl.trim()) return;
    const updated: Experiment = {
      ...experiment,
      screenshotUrls: [...experiment.screenshotUrls, newScreenshotUrl.trim()],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setNewScreenshotUrl('');
  };

  const handleRemoveScreenshot = (index: number) => {
    const updatedUrls = experiment.screenshotUrls.filter((_, i) => i !== index);
    const updated: Experiment = {
      ...experiment,
      screenshotUrls: updatedUrls,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const filteredTrades = experiment.trades.filter((t) => {
    if (tradeFilter === 'WIN') return t.result === 'Win';
    if (tradeFilter === 'LOSS') return t.result === 'Loss';
    if (tradeFilter === 'BE') return t.result === 'Breakeven';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#12131D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161826] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-[#1E2235] text-[#00FF66] font-mono font-extrabold text-sm border border-slate-700">
              {experiment.id}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  {experiment.title || experiment.setupModel}
                </h2>
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                    experiment.verdict === 'KEEP'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                      : experiment.verdict === 'KEEP_TESTING'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : experiment.verdict === 'DISCARD'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {experiment.verdict.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-semibold mt-1">
                <span className="text-[#00FF66] font-bold">{experiment.pair}</span>
                <span>•</span>
                <span>{experiment.timeframe}</span>
                <span>•</span>
                <span>{experiment.session}</span>
                <span>•</span>
                <span className="uppercase">{experiment.type}</span>
                <span>•</span>
                <span>{experiment.trades.length} trades</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenWhatsAppShare(experiment)}
              className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
            >
              <Share2 className="w-4 h-4 stroke-[3]" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-[#141522] flex items-center gap-2 overflow-x-auto font-mono">
          {[
            { id: 'overview', label: '📊 Statistics & Equity' },
            { id: 'trades', label: `📋 Trade Log (${experiment.trades.length})` },
            { id: 'findings', label: '🧠 Findings & Verdict' },
            { id: 'screenshots', label: `🖼️ Screenshots (${experiment.screenshotUrls.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00FF66] text-[#00FF66]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-xs sm:text-sm">
          {/* TAB 1: OVERVIEW & EQUITY CURVE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Trades</span>
                  <div className="text-2xl font-extrabold text-white mt-1">{stats.totalTrades}</div>
                  <span className="text-xs text-slate-400 mt-0.5 block">Logged samples</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Win Rate</span>
                  <div className="text-2xl font-extrabold text-[#00FF66] mt-1">{stats.winRate}%</div>
                  <span className="text-xs text-slate-400 mt-0.5 block">{stats.wins}W / {stats.losses}L</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Net Return</span>
                  <div className={`text-2xl font-extrabold mt-1 ${stats.netR >= 0 ? 'text-[#FF8C00]' : 'text-rose-400'}`}>
                    {netSign}{stats.netR}R
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">R-Multiple</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Expectancy</span>
                  <div className="text-2xl font-extrabold text-[#00FF66] mt-1">{expSign}{stats.expectancy}R</div>
                  <span className="text-xs text-slate-400 mt-0.5 block">/ trade</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Profit Factor</span>
                  <div className="text-2xl font-extrabold text-white mt-1">{stats.profitFactor}</div>
                  <span className="text-xs text-slate-400 mt-0.5 block">Avg: +{stats.avgWinRR}R</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Loss Streak</span>
                  <div className="text-2xl font-extrabold text-rose-400 mt-1">{stats.maxConsecutiveLosses}</div>
                  <span className="text-xs text-rose-400/80 mt-0.5 block">DD: -{stats.maxDrawdownR}R</span>
                </div>
              </div>

              {/* Interactive Equity Curve */}
              <div className="p-5 rounded-2xl bg-[#0B0C12] border border-slate-800">
                <div className="flex items-center justify-between mb-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#00FF66]" />
                    <h3 className="font-extrabold text-white uppercase tracking-wider">Cumulative R-Multiple Curve</h3>
                  </div>
                  <div className="text-[#00FF66] font-bold">
                    Net: {netSign}{stats.netR}R | Peak DD: -{stats.maxDrawdownR}R
                  </div>
                </div>

                <div className="h-64 w-full">
                  {stats.equityCurve.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="eqGradientModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00FF66" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#00FF66" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
                        <XAxis dataKey="tradeNum" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                        <YAxis stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} unit="R" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F111A',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                          formatter={(val: any) => [`${val >= 0 ? '+' : ''}${val}R`, 'Cumulative R']}
                          labelFormatter={(label) => `Trade #${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeR"
                          stroke="#00FF66"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#eqGradientModal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 font-sans">
                      Log at least 1 trade to generate the equity curve.
                    </div>
                  )}
                </div>
              </div>

              {/* Research Summary Quick Card */}
              <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-700/80 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold text-[#00FF66] uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00FF66]" />
                    Key Research Conclusion
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                    {experiment.keyFinding}
                  </p>
                </div>
                <button
                  onClick={() => onOpenWhatsAppShare(experiment)}
                  className="shrink-0 px-4 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#00FF66] font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TRADE LOG & MANUAL TRADE LOGGER */}
          {activeTab === 'trades' && (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181B28] border border-slate-800">
                  {(['ALL', 'WIN', 'LOSS', 'BE'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTradeFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                        tradeFilter === filter
                          ? 'bg-[#1E2235] text-[#00FF66] border border-[#00FF66]/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    Showing {filteredTrades.length} of {experiment.trades.length} trades
                  </span>
                  <button
                    onClick={() => setShowAddTradeForm(!showAddTradeForm)}
                    className="px-3.5 py-1.5 bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,102,0.25)] transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{showAddTradeForm ? 'Hide Form' : 'Log Individual Trade'}</span>
                  </button>
                </div>
              </div>

              {/* Add Trade Form Panel */}
              {showAddTradeForm && (
                <div className="p-4 rounded-2xl bg-[#161826] border border-[#00FF66]/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs">
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Log Trade #{experiment.trades.length + 1} ({experiment.pair})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewDirection('Long');
                          setNewPlannedRR(2.0);
                          setNewRealizedRR(2.0);
                          setNewResult('Win');
                          setNewNotes('Target 2R filled clean');
                        }}
                        className="px-2 py-1 rounded bg-[#00FF66]/20 text-[#00FF66] text-[11px] font-bold hover:bg-[#00FF66]/30"
                      >
                        Set Win
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewDirection('Short');
                          setNewPlannedRR(2.0);
                          setNewRealizedRR(-1.0);
                          setNewResult('Loss');
                          setNewNotes('Stopped out at 1R');
                        }}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-[11px] font-bold hover:bg-rose-500/30"
                      >
                        Set Loss
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Date</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Direction</label>
                      <select
                        value={newDirection}
                        onChange={(e) => setNewDirection(e.target.value as TradeDirection)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
                      >
                        <option value="Long">Long (Buy)</option>
                        <option value="Short">Short (Sell)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Session</label>
                      <select
                        value={newSession}
                        onChange={(e) => setNewSession(e.target.value as SessionType)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white"
                      >
                        <option value="London">London</option>
                        <option value="New York Open">New York Open</option>
                        <option value="New York PM">New York PM</option>
                        <option value="Asian">Asian</option>
                        <option value="London/NY Overlap">London / NY Overlap</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Planned RR</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newPlannedRR}
                        onChange={(e) => setNewPlannedRR(Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white"
                        placeholder="2.0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Realized R</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newRealizedRR}
                        onChange={(e) => handleRealizedRRChange(Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-[#00FF66] font-bold"
                        placeholder="+2.0 or -1.0"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Result</label>
                      <select
                        value={newResult}
                        onChange={(e) => setNewResult(e.target.value as TradeResult)}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-white font-bold"
                      >
                        <option value="Win">Win</option>
                        <option value="Loss">Loss</option>
                        <option value="Breakeven">Breakeven</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Trade execution notes (e.g., 'M5 FVG sweep + breaker rejection during London Open')"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0B0C12] border border-slate-700 text-xs text-white placeholder-slate-500 font-sans"
                    />
                    <button
                      onClick={handleAddTrade}
                      className="px-5 py-2 bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save Trade</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trade Log Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0B0C12]">
                <table className="w-full text-left text-xs sm:text-sm border-collapse font-mono">
                  <thead className="bg-[#181B28] text-slate-400 uppercase text-xs border-b border-slate-800 font-bold">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Direction</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Planned RR</th>
                      <th className="px-4 py-3">Realized R</th>
                      <th className="px-4 py-3">Result</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-sans">
                          No trades logged yet in this experiment. Click <strong>"Log Individual Trade"</strong> above to record your first trade execution.
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((t, idx) => {
                        const isEditing = editingTradeId === t.id;
                        return (
                          <tr key={t.id || idx} className="hover:bg-[#181B28]/60 transition-colors">
                            {isEditing ? (
                              <>
                                <td className="px-3 py-2 font-bold text-slate-400">#{t.tradeNumber}</td>
                                <td className="px-2 py-2">
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={editDirection}
                                    onChange={(e) => setEditDirection(e.target.value as TradeDirection)}
                                    className="px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  >
                                    <option value="Long">Long</option>
                                    <option value="Short">Short</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={editSession}
                                    onChange={(e) => setEditSession(e.target.value as SessionType)}
                                    className="px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  >
                                    <option value="London">London</option>
                                    <option value="New York Open">New York Open</option>
                                    <option value="New York PM">New York PM</option>
                                    <option value="Asian">Asian</option>
                                    <option value="London/NY Overlap">London / NY Overlap</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editPlannedRR}
                                    onChange={(e) => setEditPlannedRR(Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editRealizedRR}
                                    onChange={(e) => handleEditRealizedRRChange(Number(e.target.value))}
                                    className="w-16 px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-[#00FF66] font-bold"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={editResult}
                                    onChange={(e) => setEditResult(e.target.value as TradeResult)}
                                    className="px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  >
                                    <option value="Win">Win</option>
                                    <option value="Loss">Loss</option>
                                    <option value="Breakeven">Breakeven</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="w-full px-2 py-1 rounded bg-[#181B28] border border-slate-700 text-xs text-white"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSaveEditTrade(t.id)}
                                      className="p-1 rounded bg-[#00FF66] text-black hover:bg-[#00E05A]"
                                      title="Save Trade"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTradeId(null)}
                                      className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-bold text-slate-400">#{t.tradeNumber || idx + 1}</td>
                                <td className="px-4 py-3 text-slate-300">{t.date}</td>
                                <td className="px-4 py-3 font-extrabold">
                                  <span className={t.direction === 'Long' || (t.direction as any) === 'Buy' ? 'text-[#00FF66]' : 'text-rose-400'}>
                                    {t.direction.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-300">{t.session}</td>
                                <td className="px-4 py-3 text-slate-300 font-semibold">{t.plannedRR}R</td>
                                <td className="px-4 py-3 font-extrabold">
                                  <span className={t.realizedRR > 0 ? 'text-[#00FF66]' : t.realizedRR < 0 ? 'text-rose-400' : 'text-slate-400'}>
                                    {t.realizedRR > 0 ? `+${t.realizedRR}` : t.realizedRR}R
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                                      t.result === 'Win'
                                        ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
                                        : t.result === 'Loss'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                        : 'bg-slate-700/40 text-slate-300'
                                    }`}
                                  >
                                    {t.result.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-sans text-xs max-w-xs truncate">
                                  {t.notes || '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleStartEditTrade(t)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-[#00FF66] hover:bg-[#1E2235] transition-colors"
                                      title="Edit Trade"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTrade(t.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                                      title="Delete Trade"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINDINGS & VERDICT */}
          {activeTab === 'findings' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00FF66]" />
                    <span>Hypothesis & Quantitative Key Takeaways</span>
                  </h3>
                  {!isEditingFinding ? (
                    <button
                      onClick={() => setIsEditingFinding(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Findings</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveFindings}
                      className="px-4 py-1.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Core Hypothesis
                    </label>
                    {isEditingFinding ? (
                      <textarea
                        rows={3}
                        value={editedHypothesis}
                        onChange={(e) => setEditedHypothesis(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white font-sans focus:outline-none focus:border-[#00FF66]"
                      />
                    ) : (
                      <p className="p-3.5 rounded-xl bg-[#12131D] border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
                        {experiment.hypotheses || 'No initial hypothesis specified.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Key Finding & Conclusion
                    </label>
                    {isEditingFinding ? (
                      <textarea
                        rows={4}
                        value={editedFinding}
                        onChange={(e) => setEditedFinding(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white font-sans focus:outline-none focus:border-[#00FF66]"
                      />
                    ) : (
                      <p className="p-3.5 rounded-xl bg-[#12131D] border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans font-medium">
                        {experiment.keyFinding}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Research Verdict
                    </label>
                    {isEditingFinding ? (
                      <select
                        value={selectedVerdict}
                        onChange={(e) => setSelectedVerdict(e.target.value as VerdictType)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]"
                      >
                        <option value="KEEP">KEEP (Proven Positive EV Edge)</option>
                        <option value="KEEP_TESTING">KEEP TESTING (Need More Data)</option>
                        <option value="DISCARD">DISCARD (Negative Edge)</option>
                        <option value="MODIFY_PARAMS">MODIFY PARAMS</option>
                      </select>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[#12131D] border border-slate-800 flex items-center gap-3">
                        <span
                          className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                            experiment.verdict === 'KEEP'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : experiment.verdict === 'KEEP_TESTING'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {experiment.verdict.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-300 font-sans">
                          {experiment.verdictNotes || 'Standard statistical evaluation threshold met.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCREENSHOTS */}
          {activeTab === 'screenshots' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#181B28] border border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Image URL (TradingView or chart capture)..."
                  value={newScreenshotUrl}
                  onChange={(e) => setNewScreenshotUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white font-sans focus:outline-none focus:border-[#00FF66]"
                />
                <button
                  onClick={handleAddScreenshot}
                  className="px-4 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add</span>
                </button>
              </div>

              {experiment.screenshotUrls.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0B0C12] border border-slate-800 text-center text-slate-400 text-xs font-mono">
                  No screenshots attached to this experiment.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {experiment.screenshotUrls.map((url, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0C12]">
                      <img
                        src={url}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-40 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setZoomedImage(url)}
                      />
                      <button
                        onClick={() => handleRemoveScreenshot(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoomed chart" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};
