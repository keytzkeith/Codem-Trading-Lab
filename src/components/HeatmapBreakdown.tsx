import React, { useState, useMemo } from 'react';
import { SingleTrade, Experiment } from '../types/trade';
import { calculateSessionDayHeatmap } from '../utils/calculations';
import {
  Calendar,
  Clock,
  Flame,
  AlertOctagon,
  Filter,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';

interface HeatmapBreakdownProps {
  experiments: Experiment[];
  initialPairFilter?: string;
}

export const HeatmapBreakdown: React.FC<HeatmapBreakdownProps> = ({
  experiments,
  initialPairFilter = 'ALL',
}) => {
  const [selectedPair, setSelectedPair] = useState<string>(initialPairFilter);
  const [metricMode, setMetricMode] = useState<'netR' | 'winRate' | 'expectancy' | 'trades'>('netR');

  const pairsList = useMemo(() => {
    const pairs = new Set<string>();
    experiments.forEach((e) => pairs.add(e.pair));
    return ['ALL', ...Array.from(pairs)];
  }, [experiments]);

  const filteredTrades = useMemo(() => {
    let trades: SingleTrade[] = [];
    experiments.forEach((exp) => {
      if (selectedPair === 'ALL' || exp.pair === selectedPair) {
        trades.push(...exp.trades);
      }
    });
    return trades;
  }, [experiments, selectedPair]);

  const heatmapData = useMemo(() => {
    return calculateSessionDayHeatmap(filteredTrades);
  }, [filteredTrades]);

  // Color intensity calculator based on Net R or Win Rate
  const getCellBg = (cell: { tradesCount: number; netR: number; winRate: number; expectancy: number }) => {
    if (cell.tradesCount === 0) return 'bg-[#141622] text-slate-600 border-slate-800/40';

    if (metricMode === 'netR') {
      if (cell.netR > 5) return 'bg-[#00FF66]/25 border-[#00FF66]/50 text-[#00FF66] shadow-[inset_0_0_12px_rgba(0,255,102,0.15)]';
      if (cell.netR > 0) return 'bg-[#00FF66]/15 border-[#00FF66]/30 text-emerald-300';
      if (cell.netR === 0) return 'bg-[#1E2235] border-slate-700 text-slate-300';
      if (cell.netR > -3) return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      return 'bg-rose-500/30 border-rose-500/60 text-rose-400 shadow-[inset_0_0_12px_rgba(244,63,94,0.2)]';
    }

    if (metricMode === 'winRate') {
      if (cell.winRate >= 65) return 'bg-[#00FF66]/25 border-[#00FF66]/50 text-[#00FF66]';
      if (cell.winRate >= 50) return 'bg-[#00FF66]/15 border-[#00FF66]/30 text-emerald-300';
      if (cell.winRate >= 40) return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      return 'bg-rose-500/25 border-rose-500/50 text-rose-400';
    }

    if (metricMode === 'expectancy') {
      if (cell.expectancy >= 0.5) return 'bg-[#00FF66]/25 border-[#00FF66]/50 text-[#00FF66]';
      if (cell.expectancy > 0) return 'bg-[#00FF66]/15 border-[#00FF66]/30 text-emerald-300';
      return 'bg-rose-500/25 border-rose-500/50 text-rose-400';
    }

    // trades count
    return 'bg-[#1E2235] border-slate-700 text-white';
  };

  const dayLabels: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 font-mono">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <Calendar className="w-3.5 h-3.5" />
              Temporal Edge Matrix
            </span>
            <span className="text-xs text-slate-400">
              • {filteredTrades.length} Total Trades Mapped
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Session & Day-of-Week Liquidity Heatmap
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans">
            Identify which sessions and days generate the highest payoff asymmetry vs toxic chop periods.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Pair Filter Dropdown */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#12131D] border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-slate-400">Asset:</span>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-[#181B28] border border-slate-700 text-[#00FF66] font-bold rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {pairsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#12131D] border border-slate-800 text-xs">
            {[
              { id: 'netR', label: 'Net R-Multiple' },
              { id: 'winRate', label: 'Win Rate %' },
              { id: 'expectancy', label: 'EV (Expectancy)' },
              { id: 'trades', label: 'Sample Count' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMetricMode(m.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  metricMode === m.id
                    ? 'bg-[#1E2235] text-[#00FF66] border border-[#00FF66]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Algorithmic Key Insights Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#12131D] to-[#122419] border border-[#00FF66]/40 shadow-xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00FF66]/15 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-[#00FF66] font-extrabold block">
              Optimal High-EV Window
            </span>
            <div className="text-base font-extrabold text-white mt-0.5">
              {heatmapData.bestCell.tradesCount > 0 ? (
                <>
                  {dayLabels[heatmapData.bestCell.day]} • {heatmapData.bestCell.session}
                </>
              ) : (
                'Insufficient Data'
              )}
            </div>
            <div className="text-xs text-slate-300 font-sans mt-0.5">
              Yielded <strong className="text-[#00FF66]">+{heatmapData.bestCell.netR}R</strong> across {heatmapData.bestCell.tradesCount} executions ({heatmapData.bestCell.winRate}% win rate, {heatmapData.bestCell.expectancy >= 0 ? '+' : ''}{heatmapData.bestCell.expectancy}R EV).
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#12131D] to-[#251214] border border-rose-500/40 shadow-xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-rose-400 font-extrabold block">
              Sub-Optimal / Chop Window
            </span>
            <div className="text-base font-extrabold text-white mt-0.5">
              {heatmapData.worstCell.tradesCount > 0 ? (
                <>
                  {dayLabels[heatmapData.worstCell.day]} • {heatmapData.worstCell.session}
                </>
              ) : (
                'No Negative Outliers'
              )}
            </div>
            <div className="text-xs text-slate-300 font-sans mt-0.5">
              Generated <strong className="text-rose-400">{heatmapData.worstCell.netR}R</strong> across {heatmapData.worstCell.tradesCount} trades ({heatmapData.worstCell.winRate}% win rate). Consider restricting execution during this slot.
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#12131D] border border-slate-800 shadow-xl overflow-x-auto font-mono">
        <div className="min-w-[650px]">
          {/* Header Row: Sessions */}
          <div className="grid grid-cols-6 gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="p-2 text-slate-500">Day / Session</div>
            {heatmapData.sessions.map((sess) => (
              <div key={sess} className="p-2 text-center truncate" title={sess}>
                {sess}
              </div>
            ))}
          </div>

          {/* Body Rows: Days */}
          {heatmapData.days.map((day) => {
            const dayTotal = heatmapData.dayStats[day];
            const dayWinRate = dayTotal.trades > 0 ? ((dayTotal.wins / dayTotal.trades) * 100).toFixed(1) : 0;
            return (
              <div key={day} className="grid grid-cols-6 gap-2 mb-2">
                {/* Day Header with sub-stat */}
                <div className="p-3 rounded-xl bg-[#161826] border border-slate-800 flex flex-col justify-center">
                  <div className="text-sm font-extrabold text-white">{dayLabels[day]}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {dayTotal.trades} trades •{' '}
                    <span className={dayTotal.netR >= 0 ? 'text-[#00FF66] font-bold' : 'text-rose-400 font-bold'}>
                      {dayTotal.netR >= 0 ? '+' : ''}{dayTotal.netR.toFixed(1)}R
                    </span>
                  </div>
                </div>

                {/* Session Cells for this day */}
                {heatmapData.sessions.map((sess) => {
                  const cell = heatmapData.cells.find((c) => c.day === day && c.session === sess) || {
                    tradesCount: 0,
                    winsCount: 0,
                    winRate: 0,
                    netR: 0,
                    expectancy: 0,
                    day,
                    session: sess,
                  };

                  return (
                    <div
                      key={`${day}-${sess}`}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${getCellBg(
                        cell
                      )}`}
                    >
                      {cell.tradesCount > 0 ? (
                        <>
                          <div className="text-base font-extrabold">
                            {metricMode === 'netR' && (
                              <span className={cell.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}>
                                {cell.netR >= 0 ? '+' : ''}{cell.netR}R
                              </span>
                            )}
                            {metricMode === 'winRate' && `${cell.winRate}%`}
                            {metricMode === 'expectancy' && (
                              <span className={cell.expectancy >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}>
                                {cell.expectancy >= 0 ? '+' : ''}{cell.expectancy}R
                              </span>
                            )}
                            {metricMode === 'trades' && `${cell.tradesCount} trades`}
                          </div>
                          <div className="text-[10px] text-slate-300 font-sans mt-0.5">
                            {cell.tradesCount} trades • {cell.winRate}% WR
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-600 font-bold">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Marginal Column Totals for Sessions */}
          <div className="grid grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
            <div className="p-2 text-xs font-extrabold uppercase text-slate-400 flex items-center">
              Session Totals:
            </div>
            {heatmapData.sessions.map((sess) => {
              const stat = heatmapData.sessionStats[sess];
              const sessWinRate = stat.trades > 0 ? ((stat.wins / stat.trades) * 100).toFixed(1) : 0;
              return (
                <div key={sess} className="p-2 rounded-lg bg-[#161826] border border-slate-800 text-center text-xs">
                  <div className={`font-extrabold ${stat.netR >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                    {stat.netR >= 0 ? '+' : ''}{stat.netR.toFixed(1)}R
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {stat.trades} trds • {sessWinRate}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
