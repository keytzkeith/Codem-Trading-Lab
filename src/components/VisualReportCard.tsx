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
        theme === 'codem_orange'
          ? 'bg-gradient-to-b from-[#18120C] via-[#0E0C0A] to-[#060504] border-[#FF6A00]/50 shadow-[0_0_40px_rgba(255,106,0,0.2)]'
          : theme === 'cyber_dark'
          ? 'bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#040711] border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
          : theme === 'midnight_stealth'
          ? 'bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#000000] border-zinc-700/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
          : 'bg-gradient-to-b from-[#061e14] via-[#02110c] to-[#010805] border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
      }`}
    >
      {/* Subtle Background Glow Elements */}
      <div
        className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          theme === 'codem_orange' ? 'bg-[#FF6A00]/20' : 'bg-cyan-500/10'
        }`}
      />
      <div
        className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          theme === 'codem_orange' ? 'bg-[#FF8C00]/15' : 'bg-emerald-500/10'
        }`}
      />

      {/* Header Badge & Brand */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <CodemLogo size="sm" variant="full" />
        </div>

        <div className="text-right">
          <div
            className={`text-[12px] font-mono font-bold ${
              theme === 'codem_orange' ? 'text-[#FF6A00]' : 'text-cyan-300'
            }`}
          >
            {experiment.id}
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-mono">
            {experiment.type === 'backtest' ? '🧪 BACKTEST' : '⚡ LIVE TRADE'}
          </div>
        </div>
      </div>

      {/* Experiment Title & Meta Tags */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md bg-[#FF6A00] text-black font-mono font-bold text-xs shadow-[0_0_8px_rgba(255,106,0,0.3)]">
            {experiment.pair}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs border border-white/10 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {experiment.timeframe}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#221A14] text-[#FFA060] font-mono text-xs border border-[#FF6A00]/30">
            {experiment.session}
          </span>
        </div>
        <h2 className="text-sm font-semibold text-slate-100 line-clamp-1">
          {customTitle || experiment.setupModel}
        </h2>
      </div>

      {/* Core Performance Grid (4-Box Matrix) */}
      <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
        {/* Trades */}
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Sample
          </span>
          <span className="text-base font-bold font-mono text-white mt-0.5">
            {stats.totalTrades}
          </span>
          <span className="text-[9px] text-slate-500 font-mono">Trades</span>
        </div>

        {/* Win Rate */}
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Win Rate
          </span>
          <span className="text-base font-bold font-mono text-[#00E676] mt-0.5">
            {stats.winRate}%
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {stats.wins}W / {stats.losses}L
          </span>
        </div>

        {/* Expectancy */}
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
            Expectancy
          </span>
          <span className="text-base font-bold font-mono text-[#00D2FF] mt-0.5">
            {expSign}{stats.expectancy}R
          </span>
          <span className="text-[9px] text-slate-500 font-mono">/ trade</span>
        </div>

        {/* Net Yield */}
        <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#FF6A00]/20 to-transparent border border-[#FF6A00]/40 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] uppercase tracking-wider text-[#FF8C00] font-bold">
            Net Yield
          </span>
          <span className="text-base font-black font-mono text-[#FF6A00] mt-0.5">
            {netSign}{stats.netR}R
          </span>
          <span className="text-[9px] text-[#FFA060]/80 font-mono">
            Avg {stats.avgRR}R
          </span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-[10px] font-mono text-slate-300 mb-4 relative z-10">
        <div>
          <span className="text-slate-400">Loss Streak: </span>
          <span className="text-rose-400 font-bold">{stats.maxConsecutiveLosses}</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10" />
        <div>
          <span className="text-slate-400">Max DD: </span>
          <span className="text-amber-400 font-bold">-{stats.maxDrawdownR}R</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10" />
        <div>
          <span className="text-slate-400">Profit Factor: </span>
          <span className="text-white font-bold">{stats.profitFactor}</span>
        </div>
      </div>

      {/* Mini Equity Curve Visualization */}
      {stats.equityCurve.length > 2 && (
        <div className="mb-4 p-2.5 rounded-xl bg-black/60 border border-white/10 relative z-10">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-[#FF8C00]">
              <TrendingUp className="w-2.5 h-2.5" />
              CUMULATIVE R-MULTIPLE CURVE
            </span>
            <span className="text-[#FF6A00] font-bold font-mono">
              {netSign}{stats.netR}R Peak
            </span>
          </div>
          <svg viewBox="0 0 360 85" className="w-full h-12 overflow-visible">
            <defs>
              <linearGradient id="cardOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF6A00" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="75" x2="360" y2="75" stroke="#333" strokeDasharray="3 3" strokeWidth="0.8" />
            <polyline
              fill="none"
              stroke="#FF6A00"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      )}

      {/* Key Finding Box */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-4 relative z-10">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF8C00] mb-1 flex items-center gap-1.5 font-mono">
          <Zap className="w-3 h-3 text-[#FF6A00]" />
          QUANTITATIVE RESEARCH FINDING
        </div>
        <p className="text-[11px] leading-relaxed text-slate-200">
          {customNote || experiment.keyFinding || 'Systematic execution rules verified consistency across tested dataset.'}
        </p>
      </div>

      {/* Verdict Footer Badge */}
      <div className={`flex items-center justify-between p-3 rounded-xl border relative z-10 ${verdictStyle.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${verdictStyle.dot}`} />
          <span className="text-xs font-black tracking-wide">
            {verdictStyle.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-300">
          {dateStr}
        </span>
      </div>

      {/* Card Footer Watermark & Domain */}
      <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 relative z-10">
        <span className="text-[#FF8C00] font-bold">CODEM TRADING LAB</span>
        <span className="text-white/80">codemlab.online</span>
      </div>
    </div>
  );
};
