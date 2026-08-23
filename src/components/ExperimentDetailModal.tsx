import React, { useState } from 'react';
import { Experiment, SingleTrade, VerdictType } from '../types/trade';
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

  const stats = calculateTradeStats(experiment.trades);
  const netSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#222222] bg-[#161616] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="px-2 py-0.5 rounded bg-[#1A1A1A] text-[#00FF00] font-mono font-bold text-xs border border-[#333]">
              {experiment.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase font-mono">
                  {experiment.title || experiment.setupModel}
                </h2>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                    experiment.verdict === 'KEEP'
                      ? 'bg-[#002200] text-[#00FF00] border-[#006600]'
                      : experiment.verdict === 'KEEP_TESTING'
                      ? 'bg-[#221A00] text-[#FFCC00] border-[#664400]'
                      : experiment.verdict === 'DISCARD'
                      ? 'bg-[#220000] text-[#FF3333] border-[#660000]'
                      : 'bg-[#111] text-[#AAA] border-[#333]'
                  }`}
                >
                  {experiment.verdict.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#666] font-mono mt-0.5">
                <span className="text-[#00FF00] font-bold">{experiment.pair}</span>
                <span>•</span>
                <span>{experiment.timeframe}</span>
                <span>•</span>
                <span>{experiment.session}</span>
                <span>•</span>
                <span className="uppercase">{experiment.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenWhatsAppShare(experiment)}
              className="px-3 py-1.5 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[3]" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-[#222222] bg-[#141414] flex items-center gap-1 overflow-x-auto font-mono">
          {[
            { id: 'overview', label: '📊 Statistics & Equity' },
            { id: 'trades', label: `📋 Trade Log (${experiment.trades.length})` },
            { id: 'findings', label: '🧠 Findings & Verdict' },
            { id: 'screenshots', label: `🖼️ Screenshots (${experiment.screenshotUrls.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 text-[11px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00FF00] text-[#00FF00]'
                  : 'border-transparent text-[#666] hover:text-[#CCC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
          {/* TAB 1: OVERVIEW & EQUITY CURVE */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Top Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Total Trades</span>
                  <div className="text-base font-bold text-white mt-0.5">{stats.totalTrades}</div>
                  <span className="text-[9px] text-[#555]">Sample count</span>
                </div>
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Win Rate</span>
                  <div className="text-base font-bold text-[#00FF00] mt-0.5">{stats.winRate}%</div>
                  <span className="text-[9px] text-[#555]">{stats.wins}W / {stats.losses}L</span>
                </div>
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Net Return</span>
                  <div className={`text-base font-bold mt-0.5 ${stats.netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                    {netSign}{stats.netR}R
                  </div>
                  <span className="text-[9px] text-[#555]">R-Multiple</span>
                </div>
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Expectancy</span>
                  <div className="text-base font-bold text-[#00FF00] mt-0.5">{expSign}{stats.expectancy}R</div>
                  <span className="text-[9px] text-[#555]">/ trade</span>
                </div>
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Profit Factor</span>
                  <div className="text-base font-bold text-white mt-0.5">{stats.profitFactor}</div>
                  <span className="text-[9px] text-[#555]">Avg: +{stats.avgWinRR}R</span>
                </div>
                <div className="p-2.5 rounded bg-[#161616] border border-[#222222]">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">Loss Streak</span>
                  <div className="text-base font-bold text-[#FF3333] mt-0.5">{stats.maxConsecutiveLosses}</div>
                  <span className="text-[9px] text-[#FF3333]/70">DD: -{stats.maxDrawdownR}R</span>
                </div>
              </div>

              {/* Interactive Equity Curve */}
              <div className="p-3.5 rounded bg-[#0E0E0E] border border-[#222222]">
                <div className="flex items-center justify-between mb-2.5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF00]" />
                    <h3 className="font-bold text-[#888] uppercase tracking-wider">Cumulative R-Multiple Curve</h3>
                  </div>
                  <div className="text-[#00FF00] font-semibold">
                    Net: {netSign}{stats.netR}R | Peak DD: -{stats.maxDrawdownR}R
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="eqGradientModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00FF00" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00FF00" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" stroke="#1A1A1A" />
                      <XAxis dataKey="tradeNum" stroke="#444" tick={{ fontSize: 10, fill: '#777' }} />
                      <YAxis stroke="#444" tick={{ fontSize: 10, fill: '#777' }} unit="R" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0A0A0A',
                          borderColor: '#333333',
                          borderRadius: '4px',
                          color: '#E0E0E0',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                        formatter={(val: any) => [`${val >= 0 ? '+' : ''}${val}R`, 'Cumulative R']}
                        labelFormatter={(label) => `Trade #${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulativeR"
                        stroke="#00FF00"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#eqGradientModal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Research Summary Quick Card */}
              <div className="p-3 rounded bg-[#161616] border border-[#2A2A2A] flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-[#00FF00] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#00FF00]" />
                    Key Research Conclusion
                  </div>
                  <p className="text-[11px] text-[#CCC] leading-relaxed font-sans">
                    {experiment.keyFinding}
                  </p>
                </div>
                <button
                  onClick={() => onOpenWhatsAppShare(experiment)}
                  className="shrink-0 px-2.5 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#222] text-[#00FF00] font-bold text-xs flex items-center gap-1 border border-[#333] transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TRADE LOG */}
          {activeTab === 'trades' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded bg-[#161616] border border-[#222222]">
                  {(['ALL', 'WIN', 'LOSS', 'BE'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTradeFilter(filter)}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
                        tradeFilter === filter
                          ? 'bg-[#1F1F1F] text-[#00FF00]'
                          : 'text-[#666] hover:text-[#CCC]'
                      }`}
                    >
                      {filter} {filter === 'ALL' ? `(${experiment.trades.length})` : ''}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[#666]">
                  Showing {filteredTrades.length} of {experiment.trades.length} trades
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-[#222222] bg-[#0A0A0A]">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <thead className="bg-[#181818] text-[#666] uppercase text-[10px] border-b border-[#222222]">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Session</th>
                      <th className="px-3 py-2">Direction</th>
                      <th className="px-3 py-2">Realized R</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Notes & Execution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] text-[#CCC]">
                    {filteredTrades.map((trade, idx) => (
                      <tr key={trade.id || idx} className="hover:bg-[#151515] transition-colors">
                        <td className="px-3 py-2 text-[#666] font-bold">{trade.tradeNumber || idx + 1}</td>
                        <td className="px-3 py-2 text-[#888]">{trade.date}</td>
                        <td className="px-3 py-2 text-white">{trade.session}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              trade.direction === 'Long'
                                ? 'bg-[#002200] text-[#00FF00] border border-[#006600]'
                                : 'bg-[#220000] text-[#FF3333] border border-[#660000]'
                            }`}
                          >
                            {trade.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold">
                          <span
                            className={
                              trade.realizedRR > 0
                                ? 'text-[#00FF00]'
                                : trade.realizedRR < 0
                                ? 'text-[#FF3333]'
                                : 'text-[#888]'
                            }
                          >
                            {trade.realizedRR > 0 ? '+' : ''}
                            {trade.realizedRR}R
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {trade.result === 'Win' ? (
                            <span className="flex items-center gap-1 text-[#00FF00] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> WIN
                            </span>
                          ) : trade.result === 'Loss' ? (
                            <span className="flex items-center gap-1 text-[#FF3333] font-semibold">
                              <XCircle className="w-3 h-3" /> LOSS
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#888] font-semibold">
                              <MinusCircle className="w-3 h-3" /> BE
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#888] max-w-xs truncate font-sans text-xs">
                          {trade.notes || 'Clean rule execution.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINDINGS & VERDICT */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
                  Research Findings & Rule Invalidation
                </h3>
                {!isEditingFinding ? (
                  <button
                    onClick={() => setIsEditingFinding(true)}
                    className="px-2.5 py-1 rounded bg-[#161616] hover:bg-[#222] text-xs font-semibold text-[#CCC] border border-[#333] flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3 text-[#00FF00]" />
                    <span>Edit Findings</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSaveFindings}
                    className="px-3 py-1 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Save className="w-3 h-3 stroke-[3]" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>

              {/* Key Finding Box */}
              <div className="p-3.5 rounded bg-[#161616] border border-[#222222] space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Key Statistical Finding
                </label>
                {isEditingFinding ? (
                  <textarea
                    rows={3}
                    value={editedFinding}
                    onChange={(e) => setEditedFinding(e.target.value)}
                    className="w-full p-2.5 rounded bg-[#111111] border border-[#333] text-xs text-white focus:outline-none focus:border-[#00FF00]"
                  />
                ) : (
                  <p className="text-xs text-[#CCC] leading-relaxed font-sans">
                    {experiment.keyFinding}
                  </p>
                )}
              </div>

              {/* Hypotheses Box */}
              <div className="p-3.5 rounded bg-[#161616] border border-[#222222] space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Underlying Market Mechanics Hypothesis
                </label>
                {isEditingFinding ? (
                  <textarea
                    rows={2}
                    value={editedHypothesis}
                    onChange={(e) => setEditedHypothesis(e.target.value)}
                    className="w-full p-2.5 rounded bg-[#111111] border border-[#333] text-xs text-white focus:outline-none focus:border-[#00FF00]"
                  />
                ) : (
                  <p className="text-xs text-[#AAA] leading-relaxed font-sans">
                    {experiment.hypotheses || 'No hypothesis logged yet.'}
                  </p>
                )}
              </div>

              {/* Verdict Selector */}
              <div className="p-3.5 rounded bg-[#161616] border border-[#222222] space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666]">
                  Strategy Verdict (Codem Trading Decision)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'KEEP', label: '🟢 KEEP (Edge)', desc: 'Live playbook' },
                    { id: 'KEEP_TESTING', label: '🟡 KEEP TESTING', desc: 'Expand sample' },
                    { id: 'DISCARD', label: '🔴 DISCARD', desc: 'Negative EV' },
                    { id: 'MODIFY_PARAMS', label: '🔄 MODIFY PARAMS', desc: 'Adjust SL/TP' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVerdict(v.id as VerdictType);
                        if (!isEditingFinding) {
                          const updated: Experiment = {
                            ...experiment,
                            verdict: v.id as VerdictType,
                            updatedAt: new Date().toISOString(),
                          };
                          onUpdate(updated);
                        }
                      }}
                      className={`p-2.5 rounded text-left border transition-all ${
                        selectedVerdict === v.id
                          ? 'bg-[#1A1A1A] border-[#00FF00] text-[#00FF00] shadow-[0_0_8px_rgba(0,255,0,0.15)]'
                          : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-white">{v.label}</div>
                      <div className="text-[9px] text-[#666] mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SCREENSHOTS GALLERY */}
          {activeTab === 'screenshots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="url"
                    placeholder="Paste TradingView chart image URL..."
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white focus:outline-none focus:border-[#00FF00]"
                  />
                  <button
                    onClick={handleAddScreenshot}
                    className="px-2.5 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#222] text-[#00FF00] font-bold text-xs flex items-center gap-1 border border-[#333] shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Chart</span>
                  </button>
                </div>
              </div>

              {experiment.screenshotUrls.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#222] rounded bg-[#0A0A0A]">
                  <ImageIcon className="w-8 h-8 text-[#444] mx-auto mb-1.5" />
                  <p className="text-xs text-[#666]">No chart screenshots added for this experiment yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {experiment.screenshotUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded overflow-hidden border border-[#222222] bg-[#0A0A0A] aspect-video"
                    >
                      <img
                        src={url}
                        alt={`Chart #${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setZoomedImage(url)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                        <span className="text-[10px] font-mono text-white">Chart #{idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setZoomedImage(url)}
                            className="px-2 py-0.5 rounded bg-black/70 text-[10px] text-white hover:bg-black"
                          >
                            Zoom
                          </button>
                          <button
                            onClick={() => handleRemoveScreenshot(idx)}
                            className="p-1 rounded bg-[#FF3333]/80 text-white hover:bg-[#FF3333]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img src={zoomedImage} alt="Zoomed chart" className="max-w-full max-h-[85vh] rounded object-contain border border-[#333]" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black text-white rounded hover:bg-[#222]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
