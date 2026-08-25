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
  Activity,
  CheckCircle2,
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
  onResetData?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  experiments,
  onSelectExperiment,
  onOpenWhatsAppShare,
  onOpenNewExperiment,
  onOpenMt5Import,
  onResetData,
}) => {
  const [showGuide, setShowGuide] = React.useState(true);
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
    <div className="space-y-6">
      {/* Top Banner / Account Header */}
      <div className="bg-[#12131D] border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-pulse" />
              Live Quant Control Center
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono">
              • {experiments.length} Active Studies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quantitative Research & Edge Engine
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Institutional backtest distributions, cumulative R-multiple performance curves, and instant 1-click WhatsApp research cards.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            onClick={onOpenNewExperiment}
            className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00E05A] text-black text-sm font-extrabold rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center gap-2 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Experiment</span>
          </button>

          <button
            onClick={onOpenMt5Import}
            className="px-4 py-2.5 bg-[#171926] hover:bg-[#1E2132] text-slate-200 hover:text-white text-sm font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00FF66]" />
            <span>MT5 Sync</span>
          </button>
        </div>
      </div>

      {/* Methodology & Quick-Start Guide Banner for First Impression */}
      {showGuide && (
        <div className="relative bg-gradient-to-r from-[#121422] via-[#16192B] to-[#121422] border border-slate-700/70 p-5 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00FF66]/15 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Quantitative Edge Workflow Guide
                </h3>
                <p className="text-xs text-slate-400">
                  How institutional systematic traders formulate and validate edges in CODEM
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#0B0C12]/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[#FF8C00] mb-1">
                <span className="w-5 h-5 rounded-full bg-[#FF8C00]/20 flex items-center justify-center text-[11px]">1</span>
                <span>Hypothesis Formulation</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Define the model setup, timeframe, session window, and planned risk-to-reward target.
              </p>
            </div>

            <div className="p-3 bg-[#0B0C12]/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
                <span className="w-5 h-5 rounded-full bg-sky-400/20 flex items-center justify-center text-[11px]">2</span>
                <span>Backtest / MT5 Sync</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Execute 20–50 consecutive trade samples manually or import an MT5 statement file.
              </p>
            </div>

            <div className="p-3 bg-[#0B0C12]/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-[#00FF66] mb-1">
                <span className="w-5 h-5 rounded-full bg-[#00FF66]/20 flex items-center justify-center text-[11px]">3</span>
                <span>Mathematical Expectancy</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Verify positive EV, profit factor, max drawdown in R, and optimal liquidity sessions.
              </p>
            </div>

            <div className="p-3 bg-[#0B0C12]/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center text-[11px]">4</span>
                <span>Visual WhatsApp Cards</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Render 1-click high-res report cards & formatted summaries for research groups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trading Objectives & Key Metrics Section (Inspired by Goat Funded Trader) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00FF66]" />
            Trading Objectives & Aggregate Edge
          </h2>
          <span className="text-xs sm:text-sm font-semibold text-slate-400 font-mono">
            TOTAL TRADES: <strong className="text-white">{globalStats.totalTrades}</strong>
          </span>
        </div>

        {/* 6 Large High-Readability Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Experiments */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-slate-700 transition-all shadow-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Total Tests</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {globalStats.totalExperiments}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-slate-200 font-semibold">{globalStats.totalTrades}</span> executions logged
            </div>
          </div>

          {/* Card 2: Win Rate */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-[#00FF66]/40 transition-all shadow-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Win Rate</span>
              <Target className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#00FF66] tracking-tight">
              {globalStats.winRate}%
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              <strong className="text-emerald-400 font-semibold">{globalStats.wins}W</strong> / <strong className="text-rose-400 font-semibold">{globalStats.losses}L</strong>
            </div>
          </div>

          {/* Card 3: Avg RR */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-slate-700 transition-all shadow-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Avg RR</span>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {globalStats.avgRR}R
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              Payoff ratio per trade
            </div>
          </div>

          {/* Card 4: Expectancy */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-slate-700 transition-all shadow-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Expectancy</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#00FF66] tracking-tight">
              {expSign}{globalStats.expectancy}R
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              Mathematical EV / trade
            </div>
          </div>

          {/* Card 5: Net Yield */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-[#FF6A00]/40 transition-all shadow-md">
            <div className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Net Yield</span>
              <Award className="w-4 h-4 text-[#FF8C00]" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#FF8C00] tracking-tight">
              {netSign}{globalStats.netR}R
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              Max DD: <strong className="text-rose-400 font-semibold">-{globalStats.maxDrawdownR}R</strong>
            </div>
          </div>

          {/* Card 6: Profit Factor */}
          <div className="bg-[#12131D] border border-slate-800/80 p-4 sm:p-5 rounded-2xl hover:border-slate-700 transition-all shadow-md">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Profit Factor</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {globalStats.profitFactor}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">
              Gross gains vs loss
            </div>
          </div>
        </section>
      </div>

      {/* Fast Edge Identifiers (High Contrast Highlight Banners) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-[#12131D] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Performing Asset</div>
            <div className="text-lg font-extrabold text-white mt-0.5 truncate">{globalStats.bestPair}</div>
          </div>
          <span className="px-2.5 py-1 bg-[#1A1D2B] border border-slate-700 text-[#00FF66] text-[11px] font-bold rounded-lg shrink-0">
            PRIMARY PAIR
          </span>
        </div>

        <div className="bg-[#12131D] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Optimal Liquidity Session</div>
            <div className="text-lg font-extrabold text-[#00FF66] mt-0.5 truncate">{globalStats.bestSession}</div>
          </div>
          <span className="px-2.5 py-1 bg-[#1A1D2B] border border-slate-700 text-sky-400 text-[11px] font-bold rounded-lg shrink-0">
            MAX EV SESSION
          </span>
        </div>

        <div className="bg-[#12131D] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leading Strategy Setup</div>
            <div className="text-base font-bold text-white truncate max-w-[200px] mt-0.5">
              {globalStats.bestSetup}
            </div>
          </div>
          <span className="px-2.5 py-1 bg-[#1A1D2B] border border-slate-700 text-[#FF8C00] text-[11px] font-bold rounded-lg shrink-0">
            VERIFIED EDGE
          </span>
        </div>
      </div>

      {/* Global Equity Curve & Session Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Master Equity Curve (8 cols) */}
        <div className="lg:col-span-8 bg-[#12131D] border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00FF66]" />
                Cumulative R-Multiple Equity Curve
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Aggregated progression across {globalStats.totalTrades} consecutive trade samples
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm sm:text-base font-extrabold text-[#00FF66] bg-[#00FF66]/10 px-3 py-1 rounded-lg border border-[#00FF66]/30">
                {netSign}{globalStats.netR}R Peak Net
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalStats.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="hdEqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF66" stopOpacity={0.3} />
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
                    fontWeight: 'bold',
                  }}
                  formatter={(val: any) => [`${val >= 0 ? '+' : ''}${val}R`, 'Cumulative R']}
                  labelFormatter={(label) => `Execution #${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeR"
                  stroke="#00FF66"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hdEqGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Edge Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-[#12131D] border border-slate-800/80 p-5 sm:p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="mb-3">
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00FF66]" />
              Session Performance
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Net R yield partitioned by market hours</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" vertical={false} />
                <XAxis dataKey="session" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="R" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F111A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [
                    `${val >= 0 ? '+' : ''}${val}R`,
                    'Net R',
                  ]}
                />
                <Bar dataKey="totalR" radius={[4, 4, 0, 0]}>
                  {sessionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.totalR >= 0 ? '#00FF66' : '#FF4D4D'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs sm:text-sm">
            {sessionChartData.map((item) => (
              <div key={item.session} className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">{item.session}:</span>
                <span className={`font-extrabold ${item.totalR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                  {item.totalR >= 0 ? '+' : ''}{item.totalR}R <span className="text-slate-400 font-normal">({item.winRate}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layer 2: Research Studies Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Recent Research Experiments
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Click any experiment to inspect execution setups or dispatch 1-click WhatsApp research cards.
            </p>
          </div>
        </div>

        {experiments.length === 0 ? (
          <div className="bg-[#12131D] border border-slate-800/80 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1D2B] border border-slate-700 flex items-center justify-center mx-auto text-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.15)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-xl mx-auto">
              <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Your Quantitative Trading Database is Ready
              </h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Choose how you would like to begin your research session. You can create a new hypothesis from scratch, sync MetaTrader 5 trade history, or explore the pre-configured sample backtest studies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2 text-left">
              {/* Option 1: New Study */}
              <div
                onClick={onOpenNewExperiment}
                className="p-5 rounded-2xl bg-[#171926] border border-slate-800 hover:border-[#00FF66] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#00FF66]/15 text-[#00FF66] flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h5 className="font-bold text-white text-base group-hover:text-[#00FF66] transition-colors">
                    New Experiment
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Formulate a setup hypothesis with session, timeframe, and RR targets.
                  </p>
                </div>
                <div className="mt-4 text-xs font-bold text-[#00FF66] flex items-center gap-1">
                  <span>Start Blank</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Option 2: MT5 CSV */}
              <div
                onClick={onOpenMt5Import}
                className="p-5 rounded-2xl bg-[#171926] border border-slate-800 hover:border-sky-400 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-white text-base group-hover:text-sky-400 transition-colors">
                    MT5 / CSV Importer
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Import trades automatically from MetaTrader 5 or TradeTally exports.
                  </p>
                </div>
                <div className="mt-4 text-xs font-bold text-sky-400 flex items-center gap-1">
                  <span>Upload Statement</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Option 3: Load Sample Studies */}
              <div
                onClick={() => {
                  if (onResetData) onResetData();
                }}
                className="p-5 rounded-2xl bg-[#171926] border border-slate-800 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold mb-3 group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                    Load Demo Studies
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore 7 pre-configured studies (London Silver Bullet, NY AMD, etc.).
                  </p>
                </div>
                <div className="mt-4 text-xs font-bold text-amber-400 flex items-center gap-1">
                  <span>Explore Demo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiments.map((exp) => {
              const stats = calculateTradeStats(exp.trades);
              const netR = stats.netR;
              const rSign = netR >= 0 ? '+' : '';

              return (
                <div
                  key={exp.id}
                  className="bg-[#12131D] border border-slate-800/80 hover:border-[#00FF66]/60 p-5 rounded-2xl transition-all flex flex-col justify-between group shadow-lg hover:shadow-xl"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs px-2.5 py-1 rounded-lg bg-[#181B28] border border-slate-700">
                          {exp.id}
                        </span>
                        <span className="font-mono text-[#00FF66] text-xs font-extrabold px-2 py-0.5 rounded bg-[#00FF66]/10 border border-[#00FF66]/30">
                          {exp.pair}
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-semibold">
                          {exp.timeframe}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
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

                    {/* Title */}
                    <h4
                      onClick={() => onSelectExperiment(exp)}
                      className="text-base font-bold text-white group-hover:text-[#00FF66] transition-colors cursor-pointer line-clamp-1 mb-1.5"
                    >
                      {exp.title || exp.setupModel}
                    </h4>

                    <div className="text-xs text-slate-400 font-mono font-semibold flex items-center gap-2 mb-3">
                      <span className="text-slate-300">{exp.session}</span>
                      <span>•</span>
                      <span>{stats.totalTrades} Executions</span>
                    </div>

                    {/* High Density Metric Cells */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0B0C12] border border-slate-800 text-center font-mono mb-3">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">WIN RATE</span>
                        <span className="text-sm sm:text-base font-extrabold text-[#00FF66]">{stats.winRate}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">AVG RR</span>
                        <span className="text-sm sm:text-base font-extrabold text-white">{stats.avgRR}R</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">NET YIELD</span>
                        <span className={`text-sm sm:text-base font-extrabold ${netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                          {rSign}{netR}R
                        </span>
                      </div>
                    </div>

                    {/* Key Finding */}
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 italic mb-4 leading-relaxed">
                      "{exp.keyFinding}"
                    </p>
                  </div>

                  {/* Footer buttons */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectExperiment(exp)}
                      className="text-xs sm:text-sm text-slate-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
                    >
                      <span>Inspect Study</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => onOpenWhatsAppShare(exp)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] hover:text-black text-[#25D366] font-extrabold text-xs font-mono uppercase tracking-wider border border-[#25D366]/50 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
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
