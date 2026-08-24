import React from 'react';
import { Experiment } from '../types/trade';
import { calculateTradeStats } from '../utils/calculations';
import { CodemLogo } from './CodemLogo';
import { TrendingUp, Clock, Zap } from 'lucide-react';

interface VisualReportCardProps {
  experiment: Experiment;
  theme?: 'codem_orange' | 'cyber_dark' | 'midnight_stealth' | 'emerald_terminal';
  customTitle?: string;
  customNote?: string;
}

export const VisualReportCard: React.FC<VisualReportCardProps> = ({
  experiment,
  theme = 'codem_orange',
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
          bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
          dot: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]',
          label: 'KEEP — VERIFIED POSITIVE EDGE',
        };
      case 'KEEP_TESTING':
        return {
          bg: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]',
          label: 'KEEP TESTING — EXPAND SAMPLE',
        };
      case 'DISCARD':
        return {
          bg: 'bg-rose-500/20 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.9)]',
          label: 'DISCARD — NEGATIVE EV',
        };
      case 'MODIFY_PARAMS':
        return {
          bg: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
          dot: 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]',
          label: 'MODIFY PARAMETERS REQUIRED',
        };
      default:
        return {
          bg: 'bg-slate-700/40 border-slate-600 text-slate-200',
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
      className={`w-[520px] p-7 rounded-3xl border text-white select-none font-sans relative overflow-hidden transition-all shadow-2xl ${
        theme === 'codem_orange'
          ? 'bg-gradient-to-b from-[#1C130A] via-[#100D0A] to-[#080705] border-[#FF6A00]/60 shadow-[0_0_50px_rgba(255,106,0,0.25)]'
          : theme === 'cyber_dark'
          ? 'bg-gradient-to-b from-[#111A2E] via-[#0B101E] to-[#050810] border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)]'
          : theme === 'midnight_stealth'
          ? 'bg-gradient-to-b from-[#1E202B] via-[#0E1017] to-[#040508] border-slate-700/80 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
          : 'bg-gradient-to-b from-[#082418] via-[#03150E] to-[#010A06] border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]'
      }`}
    >
      {/* Subtle Background Glow Elements */}
      <div
        className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
          theme === 'codem_orange' ? 'bg-[#FF6A00]/25' : 'bg-cyan-500/15'
        }`}
      />
      <div
        className={`absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
          theme === 'codem_orange' ? 'bg-[#FF8C00]/20' : 'bg-emerald-500/15'
        }`}
      />

      {/* Header Badge & Brand */}
      <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <CodemLogo size="sm" variant="full" />
        </div>

        <div className="text-right font-mono">
          <div
            className={`text-sm font-extrabold ${
              theme === 'codem_orange' ? 'text-[#FF8C00]' : 'text-cyan-300'
            }`}
          >
            {experiment.id}
          </div>
          <div className="text-xs text-slate-300 font-bold uppercase">
            {experiment.type === 'backtest' ? '🧪 BACKTEST' : '⚡ LIVE TRADE'}
          </div>
        </div>
      </div>

      {/* Experiment Title & Meta Tags */}
      <div className="mb-5 relative z-10">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap font-mono">
          <span className="px-3 py-1 rounded-lg bg-[#FF6A00] text-black font-extrabold text-xs shadow-[0_0_10px_rgba(255,106,0,0.35)]">
            {experiment.pair}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs border border-white/15 flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {experiment.timeframe}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#2A1D14] text-[#FFA060] text-xs border border-[#FF6A00]/40 font-bold">
            {experiment.session}
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
          {customTitle || experiment.setupModel}
        </h2>
      </div>

      {/* Core Performance Grid (4-Box Matrix) */}
      <div className="grid grid-cols-4 gap-2.5 mb-5 relative z-10">
        {/* Trades */}
        <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
            Sample
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">
            {stats.totalTrades}
          </span>
          <span className="text-xs text-slate-400 font-mono">Trades</span>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
            Win Rate
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-[#00FF66] mt-0.5">
            {stats.winRate}%
          </span>
          <span className="text-xs text-slate-300 font-mono">
            {stats.wins}W / {stats.losses}L
          </span>
        </div>

        {/* Expectancy */}
        <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
            Expectancy
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-[#00D2FF] mt-0.5">
            {expSign}{stats.expectancy}R
          </span>
          <span className="text-xs text-slate-400 font-mono">/ trade</span>
        </div>

        {/* Net Yield */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-[#FF6A00]/25 to-transparent border border-[#FF6A00]/50 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-[#FF8C00] font-extrabold">
            Net Yield
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-[#FF8C00] mt-0.5">
            {netSign}{stats.netR}R
          </span>
          <span className="text-xs text-[#FFA060] font-mono font-bold">
            Avg {stats.avgRR}R
          </span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-slate-200 mb-5 relative z-10">
        <div>
          <span className="text-slate-400">Max Loss Streak: </span>
          <span className="text-rose-400 font-extrabold">{stats.maxConsecutiveLosses}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/20" />
        <div>
          <span className="text-slate-400">Max Drawdown: </span>
          <span className="text-amber-400 font-extrabold">-{stats.maxDrawdownR}R</span>
        </div>
        <div className="w-[1px] h-4 bg-white/20" />
        <div>
          <span className="text-slate-400">Profit Factor: </span>
          <span className="text-white font-extrabold">{stats.profitFactor}</span>
        </div>
      </div>

      {/* Mini Equity Curve Visualization */}
      {stats.equityCurve.length > 2 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-black/70 border border-white/15 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 text-[#FF8C00] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              CUMULATIVE R-MULTIPLE CURVE
            </span>
            <span className="text-[#FF8C00] font-extrabold font-mono">
              {netSign}{stats.netR}R Peak Net
            </span>
          </div>
          <svg viewBox="0 0 360 85" className="w-full h-14 overflow-visible">
            <line x1="0" y1="75" x2="360" y2="75" stroke="#333" strokeDasharray="3 3" strokeWidth="1" />
            <polyline
              fill="none"
              stroke="#FF6A00"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      )}

      {/* Key Finding Box */}
      <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 mb-5 relative z-10">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#FF8C00] mb-1.5 flex items-center gap-2 font-mono">
          <Zap className="w-4 h-4 text-[#FF8C00]" />
          QUANTITATIVE RESEARCH FINDING
        </div>
        <p className="text-sm leading-relaxed text-slate-100 font-medium">
          {customNote || experiment.keyFinding || 'Systematic execution rules verified edge consistency across tested dataset.'}
        </p>
      </div>

      {/* Verdict Footer Badge */}
      <div className={`flex items-center justify-between p-3.5 rounded-2xl border relative z-10 ${verdictStyle.bg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${verdictStyle.dot}`} />
          <span className="text-xs sm:text-sm font-black tracking-wide">
            {verdictStyle.label}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-200 font-bold">
          {dateStr}
        </span>
      </div>

      {/* Card Footer Watermark & Domain */}
      <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-300 pt-1 relative z-10">
        <span className="text-[#FF8C00] font-extrabold">CODEM TRADING LAB</span>
        <span className="text-white font-semibold">codemlab.online</span>
      </div>
    </div>
  );
};
