import React, { useState } from 'react';
import { Experiment } from '../types/trade';
import { calculateGlobalStats, calculateTradeStats } from '../utils/calculations';
import { MonteCarloSimulator } from './MonteCarloSimulator';
import { HeatmapBreakdown } from './HeatmapBreakdown';
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Shield,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Plus,
  FileSpreadsheet,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface TradingAnalyticsViewProps {
  experiments: Experiment[];
  onSelectExperiment: (exp: Experiment) => void;
  onOpenNewExperiment?: () => void;
  onOpenMt5Import?: () => void;
}

export const TradingAnalyticsView: React.FC<TradingAnalyticsViewProps> = ({
  experiments,
  onSelectExperiment,
  onOpenNewExperiment,
  onOpenMt5Import,
}) => {
  const [activeTab, setActiveTab] = useState<'edge' | 'montecarlo' | 'heatmap'>('edge');
  const globalStats = calculateGlobalStats(experiments);

  // Group all trades by R buckets
  const allTrades = experiments.flatMap((e) => e.trades);

  if (experiments.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              Edge Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quant Analytics & Edge Distribution
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Payoff asymmetry and statistical distributions across all recorded executions.
          </p>
        </div>

        <div className="bg-[#12131D] border border-slate-800/80 border-dashed p-10 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-[#181B28] border border-slate-700 flex items-center justify-center mx-auto text-[#00FF66]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white uppercase tracking-wider">
              No Trade Executions to Analyze
            </h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Your database is clean. Log trade executions or import your MetaTrader history to visualize payoff distributions, expectancy curves, and setup leaderboards.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenNewExperiment && (
              <button
                onClick={onOpenNewExperiment}
                className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00E05A] text-black text-sm font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Experiment</span>
              </button>
            )}
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
      </div>
    );
  }
  const rBuckets: Record<string, number> = {
    '≥ +3.0R': 0,
    '+2.0R to +2.9R': 0,
    '+1.0R to +1.9R': 0,
    'Breakeven (0R)': 0,
    '-1.0R (Stop Loss)': 0,
    '<-1.0R (Slippage)': 0,
  };

  allTrades.forEach((t) => {
    const r = t.realizedRR;
    if (r >= 3.0) rBuckets['≥ +3.0R']++;
    else if (r >= 2.0) rBuckets['+2.0R to +2.9R']++;
    else if (r > 0) rBuckets['+1.0R to +1.9R']++;
    else if (r === 0) rBuckets['Breakeven (0R)']++;
    else if (r >= -1.0) rBuckets['-1.0R (Stop Loss)']++;
    else rBuckets['<-1.0R (Slippage)']++;
  });

  const histogramData = Object.entries(rBuckets).map(([bucket, count]) => ({
    bucket,
    count,
    percentage: allTrades.length > 0 ? Number(((count / allTrades.length) * 100).toFixed(1)) : 0,
  }));

  // Setup ranking data
  const setupRankings = experiments.map((exp) => {
    const s = calculateTradeStats(exp.trades);
    return {
      experiment: exp,
      setup: exp.setupModel,
      pair: exp.pair,
      trades: s.totalTrades,
      winRate: s.winRate,
      avgRR: s.avgRR,
      netR: s.netR,
      expectancy: s.expectancy,
      profitFactor: s.profitFactor,
      verdict: exp.verdict,
    };
  }).sort((a, b) => b.netR - a.netR);

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              Statistical Engine
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono">
              • {allTrades.length} Total Trade Executions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trade Distribution & Risk Analytics
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Payoff frequency, Monte Carlo simulations, and session performance breakdowns.
          </p>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#12131D] border border-slate-800 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveTab('edge')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'edge'
                ? 'bg-[#1E2235] text-[#00FF66] border border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Payoff & Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('montecarlo')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'montecarlo'
                ? 'bg-[#1E2235] text-[#00FF66] border border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#00FF66]" />
            <span>Monte Carlo & Prop Firm</span>
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'heatmap'
                ? 'bg-[#1E2235] text-[#00FF66] border border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Liquidity Heatmap</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PAYOFF & LEADERBOARD */}
      {activeTab === 'edge' && (
        <div className="space-y-6">
          {/* R-Multiple Distribution Histogram */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#12131D] border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00FF66]" />
                  R-Multiple Frequency Distribution ({allTrades.length} Samples)
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Asymmetry and payoff frequency across all completed executions
                </p>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" vertical={false} />
                  <XAxis dataKey="bucket" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F111A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                    formatter={(val: any, name: string, item: any) => [
                      `${val} executions (${item.payload.percentage}%)`,
                      'Frequency',
                    ]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {histogramData.map((entry, index) => {
                      let color = '#00FF66';
                      if (entry.bucket.includes('Breakeven')) color = '#64748B';
                      else if (entry.bucket.includes('-1.0R') || entry.bucket.includes('<-1.0R')) color = '#FF4D4D';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Setup Model Performance Matrix Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#00FF66]" />
                  Strategy Model Performance Leaderboard
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Ranked by total net R accumulated across sample backtests
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0B0C12]">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-[#181B28] text-slate-400 uppercase text-xs border-b border-slate-800 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Rank</th>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Setup Model</th>
                    <th className="px-5 py-3.5">Asset</th>
                    <th className="px-5 py-3.5">Sample</th>
                    <th className="px-5 py-3.5">Win Rate</th>
                    <th className="px-5 py-3.5">Avg RR</th>
                    <th className="px-5 py-3.5">Expectancy</th>
                    <th className="px-5 py-3.5">Net Yield</th>
                    <th className="px-5 py-3.5">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {setupRankings.map((row, idx) => (
                    <tr
                      key={row.experiment.id}
                      onClick={() => onSelectExperiment(row.experiment)}
                      className="hover:bg-[#181B28]/70 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="px-5 py-4 font-bold text-white text-sm">{row.experiment.id}</td>
                      <td className="px-5 py-4 font-semibold text-white max-w-xs truncate">{row.setup}</td>
                      <td className="px-5 py-4 text-[#00FF66] font-bold">{row.pair}</td>
                      <td className="px-5 py-4 font-bold">{row.trades}</td>
                      <td className="px-5 py-4 font-extrabold text-[#00FF66] text-sm">{row.winRate}%</td>
                      <td className="px-5 py-4 text-white font-bold">{row.avgRR}R</td>
                      <td className="px-5 py-4 text-[#00FF66] font-extrabold">
                        {row.expectancy >= 0 ? '+' : ''}{row.expectancy}R
                      </td>
                      <td className={`px-5 py-4 font-extrabold text-sm ${row.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                        {row.netR >= 0 ? '+' : ''}{row.netR}R
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            row.verdict === 'KEEP'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                              : row.verdict === 'KEEP_TESTING'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : row.verdict === 'DISCARD'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {row.verdict.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTE CARLO PROBABILISTIC SIMULATOR */}
      {activeTab === 'montecarlo' && (
        <MonteCarloSimulator
          trades={allTrades}
          title="Monte Carlo Prop Firm & Ruin Simulator"
          subtitle={`Running 1,000 randomized resamplings across all ${allTrades.length} empirical trades in your database.`}
        />
      )}

      {/* VIEW 3: TEMPORAL LIQUIDITY HEATMAP */}
      {activeTab === 'heatmap' && (
        <HeatmapBreakdown experiments={experiments} />
      )}
    </div>
  );
};

