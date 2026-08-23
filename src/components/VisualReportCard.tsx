import React from 'react';
import { Experiment } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import { ShieldCheck, TrendingUp, Target, BarChart3, Clock, Zap, AlertCircle } from 'lucide-react';

interface VisualReportCardProps {
  experiment: Experiment;
  theme?: 'cyber_dark' | 'midnight_stealth' | 'emerald_terminal';
  customTitle?: string;
  customNote?: string;
}

export const VisualReportCard: React.FC<VisualReportCardProps> = ({
  experiment,
  theme = 'cyber_dark',
  customTitle,
  customNote,
}) => {
  const stats = calculateTradeStats(experiment.trades);
  const netSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';
  const dateStr = new Date(experiment.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  const getVerdictStyle = () => {
    switch (experiment.verdict) {
      case 'KEEP':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]',
          label: 'KEEP — VERIFIED EDGE',
        };
      case 'KEEP_TESTING':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]',
          label: 'KEEP TESTING — EXPAND SAMPLE',
        };
      case 'DISCARD':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
          label: 'DISCARD — NEGATIVE EV',
        };
      case 'MODIFY_PARAMS':
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          dot: 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]',
          label: 'MODIFY PARAMETERS',
        };
      default:
        return {
          bg: 'bg-slate-700/30 border-slate-600 text-slate-300',
          dot: 'bg-slate-400',
          label: experiment.verdict,
        };
    }
  };

  const verdictStyle = getVerdictStyle();

  // Mini equity curve sparkline SVG points
  const points = stats.equityCurve.map((pt, i) => {
    const minR = Math.min(...stats.equityCurve.map((p) => p.cumulativeR), 0);
    const maxR = Math.max(...stats.equityCurve.map((p) => p.cumulativeR), 1);
    const range = maxR - minR || 1;
    const x = (i / (stats.equityCurve.length - 1 || 1)) * 360;
    const y = 80 - ((pt.cumulativeR - minR) / range) * 65;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div
      id="whatsapp-report-card-element"
      className={`w-[480px] p-6 rounded-2xl border text-white select-none font-sans relative overflow-hidden transition-all shadow-2xl ${
        theme === 'cyber_dark'
          ? 'bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#040711] border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
          : theme === 'midnight_stealth'
          ? 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#000000] border-zinc-700/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
          : 'bg-gradient-to-b from-[#061e14] via-[#02110c] to-[#010805] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
      }`}
    >
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header Badge & Brand */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 p-[1.5px] flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.4)]">
            <div className="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center">
              <span className="font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
                CD
              </span>
            </div>
          </div>
          <div>
            <div className="text-[13px] font-extrabold tracking-wider uppercase text-white flex items-center gap-1.5">
              <span>CODEM TRADING LAB</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-medium border border-cyan-500/30">
                RESEARCH
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight">
              PROVING THE STATISTICAL EDGE
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono font-bold text-cyan-300">
            {experiment.id}
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-mono">
            {experiment.type === 'backtest' ? '🧪 BACKTEST' : '⚡ LIVE TRADE'}
          </div>
        </div>
      </div>

      {/* Experiment Title & Meta Tags */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono font-bold text-xs border border-white/10">
            {experiment.pair}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 font-mono text-xs border border-cyan-800/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {experiment.timeframe}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 font-mono text-xs border border-indigo-800/50">
            {experiment.session}
          </span>
        </div>
        <h2 className="text-sm font-semibold text-slate-200 line-clamp-1">
          {customTitle || experiment.setupModel}
        </h2>
      </div>

      {/* Core Performance Grid (4-Box Matrix) */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {/* Trades */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Sample
          </span>
          <span className="text-base font-bold font-mono text-white mt-0.5">
            {stats.totalTrades}
          </span>
          <span className="text-[9px] text-slate-500 font-mono">Trades</span>
        </div>

        {/* Win Rate */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Win Rate
          </span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-0.5">
            {stats.winRate}%
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            {stats.wins}W / {stats.losses}L
          </span>
        </div>

        {/* Expectancy */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Expectancy
          </span>
          <span className="text-base font-bold font-mono text-cyan-300 mt-0.5">
            {expSign}{stats.expectancy}R
          </span>
          <span className="text-[9px] text-slate-500 font-mono">/ trade</span>
        </div>

        {/* Net Yield */}
        <div className="p-2.5 rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/30 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-medium">
            Net Yield
          </span>
          <span className="text-base font-black font-mono text-emerald-300 mt-0.5">
            {netSign}{stats.netR}R
          </span>
          <span className="text-[9px] text-emerald-400/70 font-mono">
            Avg {stats.avgRR}R
          </span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-white/5 text-[10px] font-mono text-slate-400 mb-4">
        <div>
          <span>Max Loss Streak: </span>
          <span className="text-rose-400 font-bold">{stats.maxConsecutiveLosses}</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10" />
        <div>
          <span>Max Drawdown: </span>
          <span className="text-amber-400 font-bold">-{stats.maxDrawdownR}R</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10" />
        <div>
          <span>Profit Factor: </span>
          <span className="text-cyan-300 font-bold">{stats.profitFactor}</span>
        </div>
      </div>

      {/* Mini Equity Curve Visualization */}
      {stats.equityCurve.length > 2 && (
        <div className="mb-4 p-2.5 rounded-xl bg-black/50 border border-white/5">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
              CUMULATIVE R-MULTIPLE CURVE
            </span>
            <span className="text-emerald-400 font-bold">
              {netSign}{stats.netR}R Total
            </span>
          </div>
          <svg viewBox="0 0 360 85" className="w-full h-12 overflow-visible">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Zero line */}
            <line x1="0" y1="75" x2="360" y2="75" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      )}

      {/* Key Finding Box */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 mb-1 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          KEY FINDING & RESEARCH NOTE
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">
          {customNote || experiment.keyFinding || 'Systematic execution rules verified consistency across tested dataset.'}
        </p>
      </div>

      {/* Verdict Footer Badge */}
      <div className={`flex items-center justify-between p-3 rounded-xl border ${verdictStyle.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${verdictStyle.dot}`} />
          <span className="text-xs font-black tracking-wide">
            {verdictStyle.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {dateStr}
        </span>
      </div>

      {/* Card Footer Microcopy */}
      <div className="mt-3 flex items-center justify-between text-[8.5px] font-mono text-slate-500 pt-1">
        <span>CODEM TRADING RESEARCH SYSTEM</span>
        <span>codemtrading.com</span>
      </div>
    </div>
  );
};
