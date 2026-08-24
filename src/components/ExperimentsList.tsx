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
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              Research Lab Database
            </span>
            <span className="text-xs font-semibold text-slate-400">
              • {filtered.length} Studies Listed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Research Repository & Experiment Index
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Master database of backtests, forward tests, and live trading series.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#12131D] border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#1E2235] text-[#00FF66]' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-[#1E2235] text-[#00FF66]' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewExperiment}
            className="px-5 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.25)] transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID (e.g. BT-028), pair, setup model, key finding or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF66] font-mono"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-[#00FF66] font-mono"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="backtest">BACKTESTS</option>
              <option value="live">LIVE TRADES</option>
              <option value="forward_test">FORWARD TESTS</option>
            </select>

            <select
              value={selectedVerdict}
              onChange={(e) => setSelectedVerdict(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-[#00FF66] font-mono"
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
              className="px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-[#00FF66] font-mono"
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
              className="px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-[#00FF66] font-mono"
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
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-semibold pt-1">
          <span>
            SHOWING <strong className="text-[#00FF66] text-sm font-bold">{filtered.length}</strong> OF {experiments.length} STUDIES
          </span>
          {(selectedType !== 'ALL' || selectedVerdict !== 'ALL' || selectedPair !== 'ALL' || selectedSession !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedVerdict('ALL');
                setSelectedPair('ALL');
                setSelectedSession('ALL');
                setSearchQuery('');
              }}
              className="text-slate-400 hover:text-[#00FF66] underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#12131D] border border-slate-800/80 border-dashed p-10 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-[#181B28] border border-slate-700 flex items-center justify-center mx-auto text-[#00FF66]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white uppercase tracking-wider">No Experiments Found</h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              {experiments.length === 0
                ? 'Your database is currently empty. Create your first trading experiment or import from MetaTrader 5.'
                : 'No experiments matched your current filter criteria.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenNewExperiment}
              className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00E05A] text-black text-sm font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Experiment</span>
            </button>
            {onOpenMt5Import && (
              <button
                onClick={onOpenMt5Import}
                className="px-5 py-2.5 bg-[#171926] hover:bg-[#1E2132] text-slate-200 hover:text-white text-sm font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#00FF66]" />
                <span>Import MT5 / CSV</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exp) => {
            const stats = calculateTradeStats(exp.trades);
            const rSign = stats.netR >= 0 ? '+' : '';

            return (
              <div
                key={exp.id}
                className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 hover:border-[#00FF66]/60 transition-all flex flex-col justify-between group shadow-lg hover:shadow-xl"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs px-2.5 py-1 rounded-lg bg-[#181B28] border border-slate-700">
                        {exp.id}
                      </span>
                      <span className="text-[#00FF66] text-xs font-bold px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/30">
                        {exp.pair}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {exp.timeframe}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                        exp.verdict === 'KEEP'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : exp.verdict === 'KEEP_TESTING'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : exp.verdict === 'DISCARD'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {exp.verdict.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Setup */}
                  <h3
                    onClick={() => onSelectExperiment(exp)}
                    className="text-base font-bold text-white group-hover:text-[#00FF66] transition-colors cursor-pointer line-clamp-1 mb-1.5"
                  >
                    {exp.title || exp.setupModel}
                  </h3>

                  <div className="text-xs text-slate-400 font-semibold flex items-center gap-2 mb-3">
                    <span className="text-slate-300">{exp.session}</span>
                    <span>•</span>
                    <span>{stats.totalTrades} Executions</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0B0C12] border border-slate-800 text-center mb-3">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">WIN RATE</span>
                      <span className="text-sm sm:text-base font-bold text-[#00FF66]">{stats.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">AVG RR</span>
                      <span className="text-sm sm:text-base font-bold text-white">{stats.avgRR}R</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">NET YIELD</span>
                      <span className={`text-sm sm:text-base font-bold ${stats.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                        {rSign}{stats.netR}R
                      </span>
                    </div>
                  </div>

                  {/* Key Finding Snippet */}
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 italic mb-4 leading-relaxed">
                    "{exp.keyFinding}"
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectExperiment(exp)}
                      className="text-xs sm:text-sm text-slate-300 hover:text-white font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
                    >
                      <span>Inspect Study</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onDeleteExperiment(exp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors rounded-lg hover:bg-rose-950/30"
                      title="Delete Experiment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenWhatsAppShare(exp)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] hover:text-black text-[#25D366] font-bold text-xs uppercase tracking-wider border border-[#25D366]/50 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (High Readability) */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#12131D] shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-[#181B28] text-slate-400 uppercase text-xs border-b border-slate-800 font-bold">
              <tr>
                <th className="px-5 py-3.5 font-bold">ID</th>
                <th className="px-5 py-3.5 font-bold">Asset</th>
                <th className="px-5 py-3.5 font-bold">Strategy / Setup</th>
                <th className="px-5 py-3.5 font-bold">Session</th>
                <th className="px-5 py-3.5 font-bold">Trades</th>
                <th className="px-5 py-3.5 font-bold">Win Rate</th>
                <th className="px-5 py-3.5 font-bold">Net Yield</th>
                <th className="px-5 py-3.5 font-bold">Verdict</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.map((exp) => {
                const stats = calculateTradeStats(exp.trades);
                return (
                  <tr key={exp.id} className="hover:bg-[#181B28]/60 transition-colors">
                    <td className="px-5 py-4 font-bold text-white text-sm">{exp.id}</td>
                    <td className="px-5 py-4 font-bold text-[#00FF66] text-sm">
                      {exp.pair} <span className="text-xs text-slate-400 font-normal">({exp.timeframe})</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white max-w-xs truncate">{exp.setupModel}</td>
                    <td className="px-5 py-4 text-slate-300">{exp.session}</td>
                    <td className="px-5 py-4 font-bold">{stats.totalTrades}</td>
                    <td className="px-5 py-4 font-bold text-[#00FF66] text-sm">{stats.winRate}%</td>
                    <td className={`px-5 py-4 font-bold text-sm ${stats.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                      {stats.netR >= 0 ? '+' : ''}{stats.netR}R
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          exp.verdict === 'KEEP'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                            : exp.verdict === 'KEEP_TESTING'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : exp.verdict === 'DISCARD'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {exp.verdict.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenWhatsAppShare(exp)}
                          className="p-2 rounded-xl bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-black transition-colors"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectExperiment(exp)}
                          className="px-3 py-1.5 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white text-xs font-bold transition-colors"
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
