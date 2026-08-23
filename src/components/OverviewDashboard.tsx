import React from 'react';
import { Experiment } from '../types/trade';
import { calculateGlobalStats, calculateTradeStats } from '../utils/calculations';
import {
  TrendingUp,
  Target,
  BarChart3,
  Flame,
  ShieldAlert,
  Award,
  Clock,
  Share2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Plus,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface OverviewDashboardProps {
  experiments: Experiment[];
  onSelectExperiment: (exp: Experiment) => void;
  onOpenWhatsAppShare: (exp: Experiment) => void;
  onOpenNewExperiment: () => void;
  onOpenMt5Import: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  experiments,
  onSelectExperiment,
  onOpenWhatsAppShare,
  onOpenNewExperiment,
  onOpenMt5Import,
}) => {
  const globalStats = calculateGlobalStats(experiments);
  const netSign = globalStats.netR >= 0 ? '+' : '';
  const expSign = globalStats.expectancy >= 0 ? '+' : '';

  // Prepare Session Data for Bar Chart
  const sessionChartData = Object.entries(globalStats.sessionStats).map(([session, data]) => ({
    session,
    trades: data.trades,
    totalR: Number(data.totalR.toFixed(1)),
    winRate: data.trades > 0 ? Number(((data.wins / data.trades) * 100).toFixed(1)) : 0,
  }));

  // Prepare Pair Data for Chart
  const pairChartData = Object.entries(globalStats.pairStats).map(([pair, data]) => ({
    pair,
    trades: data.trades,
    totalR: Number(data.totalR.toFixed(1)),
    winRate: data.trades > 0 ? Number(((data.wins / data.trades) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="space-y-4">
      {/* Top Banner / Header (High Density) */}
      <div className="bg-[#111111] border border-[#222222] p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FF00]">
              Control Center
            </span>
            <span className="text-[10px] text-[#555555] font-mono">• {experiments.length} STUDIES ACTIVE</span>
          </div>
          <h1 className="text-lg font-medium text-white tracking-tight">
            Institutional Research & Quantitative Edge Engine
          </h1>
          <p className="text-xs text-[#888888] mt-0.5">
            Aggregated trading metrics, R-multiple statistical distributions, and 1-click WhatsApp research dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenNewExperiment}
            className="px-3.5 py-1.5 bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Experiment</span>
          </button>

          <button
            onClick={onOpenMt5Import}
            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] hover:text-white text-xs font-medium rounded border border-[#333] transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF00]" />
            <span>MT5 Parser</span>
          </button>
        </div>
      </div>

      {/* High Density Metric Cards (matching Design HTML layout) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Total Tests</span>
            <Layers className="w-3 h-3 text-[#777]" />
          </div>
          <div className="text-2xl font-mono text-white font-bold">{globalStats.totalExperiments}</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">{globalStats.totalTrades} total trades</div>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Win Rate</span>
            <Target className="w-3 h-3 text-[#00FF00]" />
          </div>
          <div className="text-2xl font-mono text-[#00FF00] font-bold">{globalStats.winRate}%</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">{globalStats.wins}W / {globalStats.losses}L</div>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Avg RR</span>
            <TrendingUp className="w-3 h-3 text-[#777]" />
          </div>
          <div className="text-2xl font-mono text-white font-bold">{globalStats.avgRR}R</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">Payoff ratio</div>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Expectancy</span>
            <Flame className="w-3 h-3 text-[#00FF00]" />
          </div>
          <div className="text-2xl font-mono text-[#00FF00] font-bold">{expSign}{globalStats.expectancy}R</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">Per trade EV</div>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Net Yield</span>
            <Award className="w-3 h-3 text-[#00FF00]" />
          </div>
          <div className="text-2xl font-mono text-[#00FF00] font-bold">{netSign}{globalStats.netR}R</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">Max DD: -{globalStats.maxDrawdownR}R</div>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3.5 rounded hover:border-[#333] transition-colors">
          <div className="text-[10px] text-[#555555] uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>Profit Factor</span>
            <Sparkles className="w-3 h-3 text-[#777]" />
          </div>
          <div className="text-2xl font-mono text-white font-bold">{globalStats.profitFactor}</div>
          <div className="text-[9px] text-[#555] font-mono mt-0.5">Gross gains / loss</div>
        </div>
      </section>

      {/* Fast Edge Identifiers (High Density) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-[#222222] p-3 rounded flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[#555] uppercase tracking-widest">Top Asset</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{globalStats.bestPair}</div>
          </div>
          <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#333] text-[#00FF00] text-[10px] font-mono font-bold rounded">
            FX / CFD
          </span>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3 rounded flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[#555] uppercase tracking-widest">Optimal Session</div>
            <div className="text-sm font-bold text-[#00FF00] font-mono mt-0.5">{globalStats.bestSession}</div>
          </div>
          <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#333] text-[#888] text-[10px] font-mono rounded">
            LIQUIDITY
          </span>
        </div>

        <div className="bg-[#111111] border border-[#222222] p-3 rounded flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[#555] uppercase tracking-widest">Leading Setup</div>
            <div className="text-sm font-bold text-white truncate max-w-[200px] mt-0.5">
              {globalStats.bestSetup}
            </div>
          </div>
          <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#333] text-[#00FF00] text-[10px] font-mono font-bold rounded">
            HIGH EDGE
          </span>
        </div>
      </div>

      {/* Global Equity Curve & Session Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Master Equity Curve (8 cols) */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#222222] p-4 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#00FF00]" />
                Aggregated Lab Cumulative R Equity Curve
              </h3>
              <p className="text-[10px] text-[#555] mt-0.5">
                Progression across {globalStats.totalTrades} consecutive execution samples
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-[#00FF00]">
                {netSign}{globalStats.netR}R Peak Net
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalStats.equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hdEqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00FF00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1A1A1A" />
                <XAxis dataKey="tradeNum" stroke="#444" tick={{ fontSize: 10, fill: '#666' }} />
                <YAxis stroke="#444" tick={{ fontSize: 10, fill: '#666' }} unit="R" />
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
                  fill="url(#hdEqGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Edge Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-[#111111] border border-[#222222] p-4 rounded flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#00FF00]" />
              Session Performance
            </h3>
            <p className="text-[10px] text-[#555]">Net R yield by market timing</p>
          </div>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="session" stroke="#444" tick={{ fontSize: 9, fill: '#666' }} />
                <YAxis stroke="#444" tick={{ fontSize: 9, fill: '#666' }} unit="R" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderColor: '#333333',
                    borderRadius: '4px',
                    color: '#E0E0E0',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [
                    `${val >= 0 ? '+' : ''}${val}R`,
                    'Net R',
                  ]}
                />
                <Bar dataKey="totalR" radius={[2, 2, 0, 0]}>
                  {sessionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.totalR >= 0 ? '#00FF00' : '#FF3333'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-[#1E1E1E] space-y-1 text-[11px] font-mono">
            {sessionChartData.map((item) => (
              <div key={item.session} className="flex items-center justify-between">
                <span className="text-[#666]">{item.session}:</span>
                <span className={`font-bold ${item.totalR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                  {item.totalR >= 0 ? '+' : ''}{item.totalR}R <span className="text-[#888] font-normal">({item.winRate}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layer 2: High-Density Table / Studies Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#666]">
              Recent Research Experiments
            </h3>
            <p className="text-[10px] text-[#555]">
              Click any experiment row to inspect trade parameters or trigger WhatsApp formatting
            </p>
          </div>
        </div>

        {/* High Density Table & Cards */}
        {experiments.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] border-dashed p-8 rounded text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-[#00FF00]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Research Database is Clean & Empty</h4>
              <p className="text-xs text-[#777] max-w-md mx-auto mt-1">
                Your slate is completely clear. Start by logging your first real trading experiment or importing your real MT5/CSV statement.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenNewExperiment}
                className="px-4 py-2 bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Real Experiment</span>
              </button>
              <button
                onClick={onOpenMt5Import}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] hover:text-white text-xs font-semibold rounded border border-[#333] flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#00FF00]" />
                <span>Import MT5 / CSV Report</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {experiments.map((exp) => {
            const stats = calculateTradeStats(exp.trades);
            const netR = stats.netR;
            const rSign = netR >= 0 ? '+' : '';

            return (
              <div
                key={exp.id}
                className="bg-[#111111] border border-[#222222] hover:border-[#00FF00]/60 p-3.5 rounded transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
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

                  {/* Title */}
                  <h4
                    onClick={() => onSelectExperiment(exp)}
                    className="text-xs font-semibold text-white group-hover:text-[#00FF00] transition-colors cursor-pointer line-clamp-1 mb-1"
                  >
                    {exp.title || exp.setupModel}
                  </h4>

                  <div className="text-[10px] text-[#666] font-mono flex items-center gap-2 mb-2.5">
                    <span>{exp.session}</span>
                    <span>•</span>
                    <span>{stats.totalTrades} Trades</span>
                  </div>

                  {/* High Density Metric Cells */}
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
                      <span className={`text-xs font-bold ${netR >= 0 ? 'text-[#00FF00]' : 'text-[#FF3333]'}`}>
                        {rSign}{netR}R
                      </span>
                    </div>
                  </div>

                  {/* Key Finding */}
                  <p className="text-[11px] text-[#888] line-clamp-2 italic mb-3">
                    "{exp.keyFinding}"
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectExperiment(exp)}
                    className="text-[10px] text-[#888] hover:text-white font-mono flex items-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3 text-[#555]" />
                  </button>

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
        )}
      </div>
    </div>
  );
};
