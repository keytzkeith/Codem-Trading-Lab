import React, { useState } from 'react';
import { Experiment, TradeType, VerdictType, SessionType } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import {
  Search,
  Filter,
  Plus,
  Share2,
  Trash2,
  ExternalLink,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  FileSpreadsheet,
} from 'lucide-react';

interface ExperimentsListProps {
  experiments: Experiment[];
  onSelectExperiment: (exp: Experiment) => void;
  onOpenWhatsAppShare: (exp: Experiment) => void;
  onOpenNewExperiment: () => void;
  onOpenMt5Import?: () => void;
  onDeleteExperiment: (id: string) => void;
}

export const ExperimentsList: React.FC<ExperimentsListProps> = ({
  experiments,
  onSelectExperiment,
  onOpenWhatsAppShare,
  onOpenNewExperiment,
  onOpenMt5Import,
  onDeleteExperiment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('ALL');
  const [selectedPair, setSelectedPair] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const uniquePairs = Array.from(new Set(experiments.map((e) => e.pair)));
  const uniqueSessions = Array.from(new Set(experiments.map((e) => e.session)));

  const filtered = experiments.filter((exp) => {
    if (selectedType !== 'ALL' && exp.type !== selectedType) return false;
    if (selectedVerdict !== 'ALL' && exp.verdict !== selectedVerdict) return false;
    if (selectedPair !== 'ALL' && exp.pair !== selectedPair) return false;
    if (selectedSession !== 'ALL' && exp.session !== selectedSession) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = exp.id.toLowerCase().includes(q);
      const matchTitle = exp.title?.toLowerCase().includes(q);
      const matchModel = exp.setupModel.toLowerCase().includes(q);
      const matchFinding = exp.keyFinding.toLowerCase().includes(q);
      const matchPair = exp.pair.toLowerCase().includes(q);
      const matchTag = exp.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchId && !matchTitle && !matchModel && !matchFinding && !matchPair && !matchTag) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">
              Research Repository & Experiment Index
            </h1>
          </div>
          <p className="text-[11px] text-[#666]">
            Master database of backtests, forward tests, and live trading series.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / Table Toggle */}
          <div className="flex items-center p-0.5 rounded bg-[#111111] border border-[#222222]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid' ? 'bg-[#222222] text-[#00FF00]' : 'text-[#666] hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${
                viewMode === 'table' ? 'bg-[#222222] text-[#00FF00]' : 'text-[#666] hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenNewExperiment}
            className="px-3 py-1.5 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (High Density) */}
      <div className="p-3 rounded bg-[#111111] border border-[#222222] space-y-2">
        <div className="flex flex-col lg:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-[#555] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID (e.g. BT-028), pair, model, finding or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#00FF00] font-mono"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-[#CCC] focus:outline-none focus:border-[#00FF00] font-mono"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="backtest">BACKTESTS</option>
              <option value="live">LIVE TRADES</option>
              <option value="forward_test">FORWARD TESTS</option>
            </select>

            <select
              value={selectedVerdict}
              onChange={(e) => setSelectedVerdict(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-[#CCC] focus:outline-none focus:border-[#00FF00] font-mono"
            >
              <option value="ALL">ALL VERDICTS</option>
              <option value="KEEP">KEEP</option>
              <option value="KEEP_TESTING">KEEP TESTING</option>
              <option value="DISCARD">DISCARD</option>
              <option value="MODIFY_PARAMS">MODIFY</option>
            </select>

            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-[#CCC] focus:outline-none focus:border-[#00FF00] font-mono"
            >
              <option value="ALL">ALL PAIRS</option>
              {uniquePairs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-[#161616] border border-[#262626] text-xs text-[#CCC] focus:outline-none focus:border-[#00FF00] font-mono"
            >
              <option value="ALL">ALL SESSIONS</option>
              {uniqueSessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Stats Badge */}
        <div className="flex items-center justify-between text-[10px] text-[#666] font-mono pt-0.5">
          <span>
            SHOWING <span className="text-[#00FF00] font-bold">{filtered.length}</span> OF {experiments.length} EXPERIMENTS
          </span>
          {(selectedType !== 'ALL' || selectedVerdict !== 'ALL' || selectedPair !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedVerdict('ALL');
                setSelectedPair('ALL');
                setSelectedSession('ALL');
                setSearchQuery('');
              }}
              className="text-[#888] hover:text-[#00FF00] underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] border-dashed p-8 rounded text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-[#00FF00]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Experiments Found</h4>
            <p className="text-xs text-[#777] max-w-md mx-auto mt-1">
              {experiments.length === 0
                ? 'Your database is currently empty and clean. Create your first real trading experiment or import from MT5.'
                : 'No experiments matched your current filter selection.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenNewExperiment}
              className="px-4 py-2 bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Experiment</span>
            </button>
            <button
              onClick={onOpenMt5Import}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] hover:text-white text-xs font-semibold rounded border border-[#333] flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00FF00]" />
              <span>Import MT5 / CSV</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((exp) => {
            const stats = calculateTradeStats(exp.trades);
            const rSign = stats.netR >= 0 ? '+' : '';

            return (
              <div
                key={exp.id}
                className="p-3.5 rounded bg-[#111111] border border-[#222222] hover:border-[#00FF00]/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white text-[11px] px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#333]">
                        {exp.id}
                      </span>
                      <span className="font-mono text-[#00FF00] text-[11px] font-bold">
                        {exp.pair}
                      </span>
                      <span className="text-[10px] font-mono text-[#666]">
                        {exp.timeframe}
                      </span>
                    </div>

                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        exp.verdict === 'KEEP'
                          ? 'bg-[#002200] text-[#00FF00] border-[#006600]'
                          : exp.verdict === 'KEEP_TESTING'
                          ? 'bg-[#221A00] text-[#FFCC00] border-[#664400]'
                          : exp.verdict === 'DISCARD'
                          ? 'bg-[#220000] text-[#FF3333] border-[#660000]'
                          : 'bg-[#111] text-[#AAA] border-[#333]'
                      }`}
                    >
                      {exp.verdict.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Setup */}
                  <h3
                    onClick={() => onSelectExperiment(exp)}
                    className="text-xs font-semibold text-white group-hover:text-[#00FF00] transition-colors cursor-pointer line-clamp-1 mb-1"
                  >
                    {exp.title || exp.setupModel}
                  </h3>

                  <div className="text-[10px] text-[#666] font-mono flex items-center gap-2 mb-2.5">
                    <span>{exp.session}</span>
                    <span>•</span>
                    <span>{stats.totalTrades} Trades</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A] text-center font-mono mb-2.5">
                    <div>
                      <span className="text-[8px] text-[#555] uppercase block">WR</span>
                      <span className="text-xs font-bold text-[#00FF00]">{stats.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#555] uppercase block">AVG RR</span>
                      <span className="text-xs font-bold text-white">{stats.avgRR}R</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#555] uppercase block">NET</span>
                      <span className={`text-xs font-bold ${stats.netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                        {rSign}{stats.netR}R
                      </span>
                    </div>
                  </div>

                  {/* Key Finding Snippet */}
                  <p className="text-[11px] text-[#888] line-clamp-2 italic mb-3">
                    "{exp.keyFinding}"
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectExperiment(exp)}
                      className="text-[10px] text-[#888] hover:text-white font-mono flex items-center gap-1 transition-colors uppercase tracking-wider"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3 text-[#555]" />
                    </button>
                    <button
                      onClick={() => onDeleteExperiment(exp.id)}
                      className="text-[#444] hover:text-[#FF3333] p-1 transition-colors"
                      title="Delete Experiment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenWhatsAppShare(exp)}
                    className="px-2.5 py-1 rounded bg-[#25D366]/15 hover:bg-[#25D366] hover:text-black text-[#25D366] font-bold text-[10px] font-mono uppercase tracking-wider border border-[#25D366]/40 flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Matching Design HTML Table Pattern) */
        <div className="overflow-x-auto rounded border border-[#222222] bg-[#111111]">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead className="bg-[#181818] text-[#666666] uppercase text-[10px] border-b border-[#222222]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">ID</th>
                <th className="px-4 py-2.5 font-semibold">Asset</th>
                <th className="px-4 py-2.5 font-semibold">Strategy / Setup</th>
                <th className="px-4 py-2.5 font-semibold">Session</th>
                <th className="px-4 py-2.5 font-semibold">Trades</th>
                <th className="px-4 py-2.5 font-semibold">Win Rate</th>
                <th className="px-4 py-2.5 font-semibold">Net Yield</th>
                <th className="px-4 py-2.5 font-semibold">Verdict</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[#CCC]">
              {filtered.map((exp) => {
                const stats = calculateTradeStats(exp.trades);
                return (
                  <tr key={exp.id} className="hover:bg-[#151515] transition-colors">
                    <td className="px-4 py-2.5 font-bold text-white">{exp.id}</td>
                    <td className="px-4 py-2.5 font-bold text-[#00FF00]">
                      {exp.pair} <span className="text-[9px] text-[#666] font-normal">{exp.timeframe}</span>
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium text-white max-w-xs truncate">{exp.setupModel}</td>
                    <td className="px-4 py-2.5 text-[#888]">{exp.session}</td>
                    <td className="px-4 py-2.5">{stats.totalTrades}</td>
                    <td className="px-4 py-2.5 font-bold text-[#00FF00]">{stats.winRate}%</td>
                    <td className={`px-4 py-2.5 font-bold ${stats.netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                      {stats.netR >= 0 ? '+' : ''}{stats.netR}R
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          exp.verdict === 'KEEP'
                            ? 'bg-[#002200] text-[#00FF00] border-[#006600]'
                            : exp.verdict === 'KEEP_TESTING'
                            ? 'bg-[#221A00] text-[#FFCC00] border-[#664400]'
                            : exp.verdict === 'DISCARD'
                            ? 'bg-[#220000] text-[#FF3333] border-[#660000]'
                            : 'bg-[#111] text-[#AAA] border-[#333]'
                        }`}
                      >
                        {exp.verdict.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenWhatsAppShare(exp)}
                          className="p-1 rounded bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-black transition-colors"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onSelectExperiment(exp)}
                          className="px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#262626] text-[#CCC] hover:text-white text-[10px] font-mono transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
