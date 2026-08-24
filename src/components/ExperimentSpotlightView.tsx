import React, { useState } from 'react';
import { Experiment } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import { CodemLogo } from './CodemLogo';
import {
  TrendingUp,
  Share2,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Target,
  BarChart3,
  Zap,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface ExperimentSpotlightViewProps {
  experiment: Experiment;
  onBackToLab: () => void;
  onOpenWhatsAppShare?: () => void;
}

export const ExperimentSpotlightView: React.FC<ExperimentSpotlightViewProps> = ({
  experiment,
  onBackToLab,
  onOpenWhatsAppShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<number | null>(null);

  const stats = calculateTradeStats(experiment.trades);
  const netSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://codemlab.online/?exp=${experiment.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const peakR = stats.equityCurve.reduce((max, point) => Math.max(max, point.cumulativeR), 0);

  const getVerdictBadge = () => {
    switch (experiment.verdict) {
      case 'KEEP':
        return {
          label: 'KEEP — VERIFIED POSITIVE EV EDGE',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
        };
      case 'KEEP_TESTING':
        return {
          label: 'KEEP TESTING — EXPAND SAMPLE SIZE',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
        };
      case 'DISCARD':
        return {
          label: 'DISCARD — NEGATIVE EXPECTANCY',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400 shadow-[0_0_10px_#f43f5e]',
        };
      case 'MODIFY_PARAMS':
        return {
          label: 'MODIFY PARAMETERS REQUIRED',
          bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          dot: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
        };
      default:
        return {
          label: experiment.verdict,
          bg: 'bg-slate-750 border-slate-600 text-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const verdictBadge = getVerdictBadge();

  return (
    <div className="min-h-screen bg-[#0A0B10] text-slate-100 font-sans antialiased pb-16">
      {/* Top Spotlight Header */}
      <header className="sticky top-0 z-40 bg-[#0C0D14]/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CodemLogo size="md" variant="full" />
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6A00]/15 border border-[#FF6A00]/40 text-[#FF8C00] font-mono text-xs uppercase font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Public Study Record</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-[#171926] hover:bg-[#1E2132] border border-slate-700 text-xs sm:text-sm font-mono text-slate-200 hover:text-white flex items-center gap-2 transition-colors font-semibold"
              title="Copy link to this study"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-[#00FF66] font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {onOpenWhatsAppShare && (
              <button
                onClick={onOpenWhatsAppShare}
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">WhatsApp Dispatch</span>
              </button>
            )}

            <button
              onClick={onBackToLab}
              className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#e05e00] text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,106,0,0.3)]"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">All Studies</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Banner Card */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#141624] via-[#0F101A] to-[#0A0B10] border border-slate-800 shadow-2xl">
          {/* Subtle Orange Glow Ambient */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#FF6A00]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-slate-800">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 flex-wrap font-mono">
                <span className="px-3 py-1 rounded-xl bg-[#FF6A00] text-black font-mono font-extrabold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(255,106,0,0.4)]">
                  {experiment.id}
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#1E2235] text-white font-mono font-bold text-xs border border-slate-700">
                  {experiment.pair}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-[#171926] text-[#00D2FF] font-mono text-xs border border-[#00D2FF]/40 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {experiment.timeframe}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-[#171926] text-[#FFA060] font-mono text-xs border border-[#FF8C00]/40 font-bold">
                  {experiment.session} Session
                </span>
                <span className="text-xs text-slate-400 font-mono font-medium">
                  Created {new Date(experiment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {experiment.title || `${experiment.setupModel} Performance Study`}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-sans">
                Setup Model: <span className="text-white font-bold">{experiment.setupModel}</span>
              </p>
            </div>

            {/* Verdict Box */}
            <div className={`p-5 rounded-2xl border ${verdictBadge.bg} max-w-sm shrink-0 shadow-lg`}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className={`w-3 h-3 rounded-full ${verdictBadge.dot}`} />
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
                  {verdictBadge.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200 mt-1">
                {experiment.verdictNotes || 'Quantitative study meets statistical criteria for systematic trading rules.'}
              </p>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-6">
            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Sample Size
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                {stats.totalTrades}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">Documented Trades</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Win Rate
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#00FF66] mt-1">
                {stats.winRate}%
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">
                {stats.wins}W / {stats.losses}L / {stats.breakevens}BE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-[#FF8C00] font-bold">
                Net Yield
              </span>
              <span className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${stats.netR >= 0 ? 'text-[#FF8C00]' : 'text-rose-400'}`}>
                {netSign}{stats.netR}R
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">Avg {stats.avgRR}R</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Expectancy
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#00D2FF] mt-1">
                {expSign}{stats.expectancy}R
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">per execution</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Profit Factor
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                {stats.profitFactor}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">Gross Gain / Loss</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800 flex flex-col">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                Max Drawdown
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
                -{stats.maxDrawdownR}R
              </span>
              <span className="text-xs text-slate-400 font-mono mt-0.5">
                Loss Streak: {stats.maxConsecutiveLosses}
              </span>
            </div>
          </div>
        </div>

        {/* Equity Curve Progression Chart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#12131D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A1D2B] border border-slate-700 flex items-center justify-center text-[#00FF66]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Cumulative Performance Curve (R-Multiple)
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Continuous equity progression over {stats.totalTrades} consecutive trade executions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs sm:text-sm">
              <span className="text-slate-300">Peak: <strong className="text-[#00FF66] font-bold">+{peakR}R</strong></span>
              <span className="text-slate-300">Final: <strong className="text-[#FF8C00] font-bold">{netSign}{stats.netR}R</strong></span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {stats.equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orangeEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A00" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E2235" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="tradeNum"
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(v) => `#${v}`}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}R`}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F111A',
                      borderColor: '#FF6A00',
                      borderRadius: 10,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: '#F8FAFC',
                      fontWeight: 'bold',
                    }}
                    formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}R`, 'Cumulative R']}
                    labelFormatter={(label) => `Trade Execution #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeR"
                    stroke="#FF6A00"
                    strokeWidth={3}
                    fill="url(#orangeEquity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 font-mono">
                No trade data recorded in this study.
              </div>
            )}
          </div>
        </div>

        {/* Research Hypotheses & Core Takeaways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-3xl bg-[#12131D] border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-[#FF8C00] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4 text-[#FF6A00]" />
              <span>Core Hypothesis & Trading Rules</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {experiment.hypotheses || 'Testing systematic edge and statistical win-rate distribution over predefined execution parameters.'}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#12131D] border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-[#00D2FF] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Target className="w-4 h-4 text-[#00D2FF]" />
              <span>Key Quantitative Finding</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {experiment.keyFinding || 'Risk/reward distribution confirms repeatable asymmetry during active session liquidity.'}
            </p>
          </div>
        </div>

        {/* Documented Trade Execution Log */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#12131D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A1D2B] border border-slate-700 flex items-center justify-center text-[#FF6A00]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Documented Trade Executions ({experiment.trades.length})
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Granular trade-by-trade records with entry session, direction, and realized outcome
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0B0C12]">
            <table className="w-full text-left font-mono text-xs sm:text-sm">
              <thead className="bg-[#181B28] text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Planned RR</th>
                  <th className="py-3.5 px-4">Realized R</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Execution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {experiment.trades.map((t, idx) => (
                  <tr
                    key={t.id || idx}
                    className="hover:bg-[#181B28]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-400 font-bold">#{t.tradeNumber || idx + 1}</td>
                    <td className="py-3.5 px-4 font-extrabold">
                      <span className={t.direction === 'Buy' ? 'text-[#00FF66]' : 'text-rose-400'}>
                        {t.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{t.session}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">{t.plannedRR}R</td>
                    <td className="py-3.5 px-4 font-extrabold">
                      <span
                        className={
                          t.realizedRR > 0
                            ? 'text-[#00FF66]'
                            : t.realizedRR < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {t.realizedRR > 0 ? `+${t.realizedRR}` : t.realizedRR}R
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          t.result === 'Win'
                            ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
                            : t.result === 'Loss'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-700/40 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {t.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans text-xs sm:text-sm max-w-xs truncate">
                      {t.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="mt-12 border-t border-slate-800 bg-[#0C0D14] py-8 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CodemLogo size="sm" variant="badge" />
            <span className="font-bold">INSTITUTIONAL QUANTITATIVE RESEARCH INFRASTRUCTURE</span>
          </div>
          <div>
            <span>Verified Domain: </span>
            <a href="https://codemlab.online" className="text-[#FF6A00] hover:underline font-bold">
              codemlab.online
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
