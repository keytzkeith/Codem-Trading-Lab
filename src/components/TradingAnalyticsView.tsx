import React from 'react';
import { Experiment } from '../types/trade';
import { calculateGlobalStats, calculateTradeStats } from '../utils/calculations';
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
  const globalStats = calculateGlobalStats(experiments);

  // Group all trades by R buckets
  const allTrades = experiments.flatMap((e) => e.trades);

  if (experiments.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">
              Quant Analytics & Edge Distribution
            </h1>
          </div>
          <p className="text-[11px] text-[#666]">
            Payoff asymmetry and statistical distributions across all recorded executions.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#222222] border-dashed p-10 rounded text-center space-y-3">
          <div className="w-10 h-10 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-[#00FF00]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              No Trade Executions to Analyze
            </h4>
            <p className="text-xs text-[#777] max-w-md mx-auto mt-1">
              Your database is clean. Log trade executions or import your MetaTrader history to visualize payoff distributions, expectancy curves, and setup leaderboards.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenNewExperiment && (
              <button
                onClick={onOpenNewExperiment}
                className="px-4 py-2 bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Experiment</span>
              </button>
            )}
            {onOpenMt5Import && (
              <button
                onClick={onOpenMt5Import}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] hover:text-white text-xs font-semibold rounded border border-[#333] flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#00FF00]" />
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
          <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">
            Quant Analytics & Edge Distribution
          </h1>
        </div>
        <p className="text-[11px] text-[#666]">
          Statistical payoff distributions and strategy model leaderboards across {allTrades.length} tested trades.
        </p>
      </div>

      {/* R-Multiple Distribution Histogram */}
      <div className="p-4 rounded bg-[#111111] border border-[#222222]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#00FF00]" />
              R-Multiple Frequency Distribution ({allTrades.length} Samples)
            </h3>
            <p className="text-[10px] text-[#555]">
              Asymmetry and payoff frequency across all completed executions
            </p>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1A1A1A" vertical={false} />
              <XAxis dataKey="bucket" stroke="#444" tick={{ fontSize: 10, fill: '#777' }} />
              <YAxis stroke="#444" tick={{ fontSize: 10, fill: '#777' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0A',
                  borderColor: '#333333',
                  borderRadius: '4px',
                  color: '#E0E0E0',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
                formatter={(val: any, name: string, item: any) => [
                  `${val} trades (${item.payload.percentage}%)`,
                  'Frequency',
                ]}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {histogramData.map((entry, index) => {
                  let color = '#00FF00';
                  if (entry.bucket.includes('Breakeven')) color = '#555555';
                  else if (entry.bucket.includes('-1.0R') || entry.bucket.includes('<-1.0R')) color = '#FF3333';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Setup Model Performance Matrix Table (High Density) */}
      <div className="p-4 rounded bg-[#111111] border border-[#222222] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00FF00]" />
              Strategy Model Performance Leaderboard
            </h3>
            <p className="text-[10px] text-[#555]">
              Ranked by total net R accumulated across sample backtests
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-[#222222] bg-[#0A0A0A]">
          <table className="w-full text-left text-[11px] font-mono border-collapse">
            <thead className="bg-[#181818] text-[#666] uppercase text-[10px] border-b border-[#222222]">
              <tr>
                <th className="px-3.5 py-2.5">Rank</th>
                <th className="px-3.5 py-2.5">ID</th>
                <th className="px-3.5 py-2.5">Setup Model</th>
                <th className="px-3.5 py-2.5">Asset</th>
                <th className="px-3.5 py-2.5">Sample</th>
                <th className="px-3.5 py-2.5">Win Rate</th>
                <th className="px-3.5 py-2.5">Avg RR</th>
                <th className="px-3.5 py-2.5">Expectancy</th>
                <th className="px-3.5 py-2.5">Net Yield</th>
                <th className="px-3.5 py-2.5">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[#CCC]">
              {setupRankings.map((row, idx) => (
                <tr
                  key={row.experiment.id}
                  onClick={() => onSelectExperiment(row.experiment)}
                  className="hover:bg-[#151515] transition-colors cursor-pointer"
                >
                  <td className="px-3.5 py-2.5 font-bold text-[#666]">#{idx + 1}</td>
                  <td className="px-3.5 py-2.5 font-bold text-white">{row.experiment.id}</td>
                  <td className="px-3.5 py-2.5 font-sans font-medium text-white max-w-xs truncate">{row.setup}</td>
                  <td className="px-3.5 py-2.5 text-[#00FF00] font-bold">{row.pair}</td>
                  <td className="px-3.5 py-2.5">{row.trades}</td>
                  <td className="px-3.5 py-2.5 font-bold text-[#00FF00]">{row.winRate}%</td>
                  <td className="px-3.5 py-2.5 text-white">{row.avgRR}R</td>
                  <td className="px-3.5 py-2.5 text-[#00FF00] font-bold">
                    {row.expectancy >= 0 ? '+' : ''}{row.expectancy}R
                  </td>
                  <td className={`px-3.5 py-2.5 font-bold ${row.netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                    {row.netR >= 0 ? '+' : ''}{row.netR}R
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        row.verdict === 'KEEP'
                          ? 'bg-[#002200] text-[#00FF00] border-[#006600]'
                          : row.verdict === 'KEEP_TESTING'
                          ? 'bg-[#221A00] text-[#FFCC00] border-[#664400]'
                          : row.verdict === 'DISCARD'
                          ? 'bg-[#220000] text-[#FF3333] border-[#660000]'
                          : 'bg-[#111] text-[#AAA] border-[#333]'
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
  );
};
