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

  const getVerdictBadge = () => {
    switch (experiment.verdict) {
      case 'KEEP':
        return {
          label: 'KEEP — VERIFIED POSITIVE EV EDGE',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
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
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
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
          bg: 'bg-slate-700/40 border-slate-600 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const verdictBadge = getVerdictBadge();

  return (
    <div className="min-h-screen bg-[#08080A] text-[#E0E0E0] font-sans antialiased pb-16">
      {/* Top Spotlight Header */}
      <header className="sticky top-0 z-40 bg-[#0C0D10]/95 backdrop-blur border-b border-[#20222A] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CodemLogo size="md" variant="full" />
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF8C00] font-mono text-[10px] uppercase font-bold">
              <ShieldCheck className="w-3 h-3 text-[#FF6A00]" />
              <span>Public Study Record</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded bg-[#181920] hover:bg-[#22242D] border border-[#2D303B] text-xs font-mono text-[#CCC] hover:text-white flex items-center gap-1.5 transition-colors"
              title="Copy link to this study"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                  <span className="text-[#00E676] font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#AAA]" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {onOpenWhatsAppShare && (
              <button
                onClick={onOpenWhatsAppShare}
                className="px-3.5 py-1.5 rounded bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(37,211,102,0.25)]"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">WhatsApp Dispatch</span>
              </button>
            )}

            <button
              onClick={onBackToLab}
              className="px-3 py-1.5 rounded bg-[#FF6A00] hover:bg-[#E65F00] text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(255,106,0,0.3)]"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">All Studies</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner Card */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#14151B] via-[#0E0F14] to-[#0A0A0D] border border-[#262833] shadow-2xl">
          {/* Subtle Orange Glow Ambient */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#FF6A00]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#22242E]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-[#FF6A00] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_8px_rgba(255,106,0,0.4)]">
                  {experiment.id}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#1E202A] text-white font-mono font-bold text-xs border border-[#343847]">
                  {experiment.pair}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181920] text-[#00D2FF] font-mono text-xs border border-[#00D2FF]/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {experiment.timeframe}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181920] text-[#E0A070] font-mono text-xs border border-[#FF8C00]/30">
                  {experiment.session} Session
                </span>
                <span className="text-[11px] text-[#777] font-mono">
                  Created {new Date(experiment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {experiment.title || `${experiment.setupModel} Performance Study`}
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9E9E] font-sans">
                Setup Model: <span className="text-white font-semibold">{experiment.setupModel}</span>
              </p>
            </div>

            {/* Verdict Box */}
            <div className={`p-4 rounded-xl border ${verdictBadge.bg} max-w-sm shrink-0`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${verdictBadge.dot}`} />
                <span className="font-extrabold text-xs tracking-wider uppercase">
                  {verdictBadge.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#CCC] mt-1">
                {experiment.verdictNotes || 'Quantitative study meets statistical criteria for live strategy deployment.'}
              </p>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-5">
            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Sample Size
              </span>
              <span className="text-xl font-black font-mono text-white mt-1">
                {stats.totalTrades}
              </span>
              <span className="text-[10px] text-[#666] font-mono">Documented Trades</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Win Rate
              </span>
              <span className="text-xl font-black font-mono text-[#00E676] mt-1">
                {stats.winRate}%
              </span>
              <span className="text-[10px] text-[#777] font-mono">
                {stats.wins}W / {stats.losses}L / {stats.breakevens}BE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Net R Multiple
              </span>
              <span className={`text-xl font-black font-mono mt-1 ${stats.netR >= 0 ? 'text-[#FF6A00]' : 'text-[#FF3D71]'}`}>
                {netSign}{stats.netR}R
              </span>
              <span className="text-[10px] text-[#777] font-mono">Avg {stats.avgRR}R</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Expectancy
              </span>
              <span className="text-xl font-black font-mono text-[#00D2FF] mt-1">
                {expSign}{stats.expectancy}R
              </span>
              <span className="text-[10px] text-[#777] font-mono">per execution</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Profit Factor
              </span>
              <span className="text-xl font-black font-mono text-white mt-1">
                {stats.profitFactor}
              </span>
              <span className="text-[10px] text-[#777] font-mono">Gross Gain / Loss</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111217] border border-[#22242E] flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">
                Max Drawdown
              </span>
              <span className="text-xl font-black font-mono text-[#FFB800] mt-1">
                -{stats.maxDrawdownR}R
              </span>
              <span className="text-[10px] text-[#777] font-mono">
                Loss Streak: {stats.maxConsecutiveLosses}
              </span>
            </div>
          </div>
        </div>

        {/* Equity Curve Progression Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111217] border border-[#22242E] shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#181920] border border-[#2C2E3A] flex items-center justify-center text-[#FF6A00]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Cumulative Performance Curve (R-Multiple)
                </h3>
                <p className="text-[11px] text-[#777]">
                  Continuous equity progression over {stats.totalTrades} consecutive trade executions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-[#888]">Peak: <strong className="text-[#00E676]">+{stats.maxCumulativeR}R</strong></span>
              <span className="text-[#888]">Final: <strong className="text-[#FF6A00]">{netSign}{stats.netR}R</strong></span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {stats.equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orangeEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A00" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FF6A00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E202A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="tradeNumber"
                    stroke="#555"
                    fontSize={10}
                    tickFormatter={(v) => `#${v}`}
                  />
                  <YAxis
                    stroke="#555"
                    fontSize={10}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}R`}
                  />
                  <ReferenceLine y={0} stroke="#333" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16171F',
                      borderColor: '#FF6A00',
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                    formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}R`, 'Cumulative R']}
                    labelFormatter={(label) => `Trade Execution #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeR"
                    stroke="#FF6A00"
                    strokeWidth={2.5}
                    fill="url(#orangeEquity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#666] font-mono">
                No trade data recorded in this study.
              </div>
            )}
          </div>
        </div>

        {/* Research Hypotheses & Core Takeaways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#111217] border border-[#22242E] space-y-2.5">
            <div className="flex items-center gap-2 text-[#FF6A00] font-mono text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Core Hypothesis & Trading Rules</span>
            </div>
            <p className="text-xs text-[#CCC] leading-relaxed">
              {experiment.hypotheses || 'Testing systematic edge and statistical win-rate distribution over predefined execution parameters.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#111217] border border-[#22242E] space-y-2.5">
            <div className="flex items-center gap-2 text-[#00D2FF] font-mono text-xs font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>Key Quantitative Finding</span>
            </div>
            <p className="text-xs text-[#CCC] leading-relaxed">
              {experiment.keyFinding || 'Risk/reward distribution confirms repeatable asymmetry during active session liquidity.'}
            </p>
          </div>
        </div>

        {/* Documented Trade Execution Log */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111217] border border-[#22242E] shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#181920] border border-[#2C2E3A] flex items-center justify-center text-[#FF6A00]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Documented Trade Executions ({experiment.trades.length})
                </h3>
                <p className="text-[11px] text-[#777]">
                  Granular trade-by-trade records with entry session, direction, and realized outcome
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#22242E] text-[#777] text-[10px] uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3">Planned RR</th>
                  <th className="py-2.5 px-3">Realized R</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Execution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1C24]">
                {experiment.trades.map((t, idx) => (
                  <tr
                    key={t.id || idx}
                    className="hover:bg-[#161720] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-[#777]">#{t.tradeNumber || idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={t.direction === 'Buy' ? 'text-[#00E676]' : 'text-[#FF3D71]'}>
                        {t.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#AAA]">{t.session}</td>
                    <td className="py-2.5 px-3 text-[#AAA]">{t.plannedRR}R</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span
                        className={
                          t.realizedRR > 0
                            ? 'text-[#00E676]'
                            : t.realizedRR < 0
                            ? 'text-[#FF3D71]'
                            : 'text-[#888]'
                        }
                      >
                        {t.realizedRR > 0 ? `+${t.realizedRR}` : t.realizedRR}R
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.result === 'Win'
                            ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                            : t.result === 'Loss'
                            ? 'bg-[#FF3D71]/15 text-[#FF3D71] border border-[#FF3D71]/30'
                            : 'bg-slate-700/30 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {t.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#AAA] font-sans text-[11px] max-w-xs truncate">
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
      <footer className="mt-12 border-t border-[#1F212B] bg-[#0A0B0E] py-6 text-center text-xs text-[#666] font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CodemLogo size="sm" variant="badge" />
            <span>INSTITUTIONAL RESEARCH INFRASTRUCTURE</span>
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
