import React, { useState, useMemo } from 'react';
import { SingleTrade, MonteCarloConfig } from '../types/trade';
import { runMonteCarloSimulation } from '../utils/calculations';
import {
  Sparkles,
  ShieldAlert,
  Target,
  Trophy,
  RefreshCw,
  TrendingUp,
  Percent,
  Sliders,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

interface MonteCarloSimulatorProps {
  trades: SingleTrade[];
  title?: string;
  subtitle?: string;
}

export const MonteCarloSimulator: React.FC<MonteCarloSimulatorProps> = ({
  trades,
  title = 'Monte Carlo Prop Firm & Ruin Engine',
  subtitle = '1,000 randomized resamplings evaluating evaluation pass rates, maximum drawdown risk, and asymptotic confidence bands.',
}) => {
  // Preset challenge profiles: FTMO / 1-Step / 2-Step / Custom
  const [profile, setProfile] = useState<'ftmo_10_8' | 'funded_5_4' | 'eval_8_5' | 'custom'>('ftmo_10_8');
  const [simulationsCount, setSimulationsCount] = useState<number>(1000);
  const [tradesPerRun, setTradesPerRun] = useState<number>(40);
  const [profitTargetR, setProfitTargetR] = useState<number>(10);
  const [maxDrawdownR, setMaxDrawdownR] = useState<number>(8);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [runTrigger, setRunTrigger] = useState<number>(0);

  const handleProfileChange = (p: 'ftmo_10_8' | 'funded_5_4' | 'eval_8_5' | 'custom') => {
    setProfile(p);
    if (p === 'ftmo_10_8') {
      setProfitTargetR(10); // +10% at 1% risk = +10R
      setMaxDrawdownR(8); // -8% or -10% max DD = -8R
      setTradesPerRun(40);
    } else if (p === 'eval_8_5') {
      setProfitTargetR(8); // +8%
      setMaxDrawdownR(5); // -5%
      setTradesPerRun(35);
    } else if (p === 'funded_5_4') {
      setProfitTargetR(5); // +5% payout milestone
      setMaxDrawdownR(4); // -4% protective buffer
      setTradesPerRun(30);
    }
  };

  const simulationResult = useMemo(() => {
    return runMonteCarloSimulation(trades, {
      simulationsCount,
      tradesPerRun,
      profitTargetR,
      maxDrawdownR,
      riskPercent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, simulationsCount, tradesPerRun, profitTargetR, maxDrawdownR, riskPercent, runTrigger]);

  const targetDollar = profitTargetR * riskPercent;
  const drawdownDollar = maxDrawdownR * riskPercent;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <Sparkles className="w-3.5 h-3.5" />
              Probabilistic Risk Modeling
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • Based on {trades.length} Empirical Samples
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
            {subtitle}
          </p>
        </div>

        <button
          onClick={() => setRunTrigger((prev) => prev + 1)}
          className="px-4 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#00FF66] font-mono font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-colors shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Simulate (1,000 Runs)</span>
        </button>
      </div>

      {/* Preset Profiles & Simulation Controls */}
      <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800 space-y-4 shadow-xl font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00FF66]" />
            Challenge / Risk Presets
          </span>

          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <button
              onClick={() => handleProfileChange('ftmo_10_8')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                profile === 'ftmo_10_8'
                  ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'bg-[#181B28] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              10% Target / 8% Max DD (FTMO Phase 1)
            </button>
            <button
              onClick={() => handleProfileChange('eval_8_5')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                profile === 'eval_8_5'
                  ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'bg-[#181B28] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              8% Target / 5% Max DD (2-Step Phase 2)
            </button>
            <button
              onClick={() => handleProfileChange('funded_5_4')}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                profile === 'funded_5_4'
                  ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'bg-[#181B28] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Funded Buffer (+5% / -4% Safe Guard)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-[#181B28] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Profit Target</span>
              <strong className="text-[#00FF66]">+{profitTargetR}R ({targetDollar}%)</strong>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={profitTargetR}
              onChange={(e) => {
                setProfitTargetR(Number(e.target.value));
                setProfile('custom');
              }}
              className="w-full accent-[#00FF66] cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#181B28] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Max Drawdown Limit</span>
              <strong className="text-rose-400">-{maxDrawdownR}R (-{drawdownDollar}%)</strong>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={maxDrawdownR}
              onChange={(e) => {
                setMaxDrawdownR(Number(e.target.value));
                setProfile('custom');
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#181B28] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Trade Horizon</span>
              <strong className="text-white">{tradesPerRun} trades</strong>
            </div>
            <input
              type="range"
              min="15"
              max="150"
              step="5"
              value={tradesPerRun}
              onChange={(e) => setTradesPerRun(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#181B28] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Risk per Trade</span>
              <strong className="text-white">{riskPercent}% / trade</strong>
            </div>
            <input
              type="range"
              min="0.25"
              max="3.0"
              step="0.25"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Probability Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        {/* Pass Probability */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12131D] to-[#122419] border border-[#00FF66]/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#00FF66] font-extrabold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#00FF66]" />
              Pass Probability
            </span>
            <span className="text-xs font-bold text-slate-400">{simulationResult.passCount} / 1,000 runs</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#00FF66] mt-2">
            {simulationResult.passProbability}%
          </div>
          <p className="text-xs text-slate-300 font-sans mt-1">
            Likelihood of reaching +{profitTargetR}R target within {tradesPerRun} trades without violating max drawdown.
          </p>
        </div>

        {/* Risk of Ruin */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12131D] to-[#251214] border border-rose-500/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-400 font-extrabold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Risk of Ruin (Breach)
            </span>
            <span className="text-xs font-bold text-slate-400">{simulationResult.ruinCount} / 1,000 runs</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 mt-2">
            {simulationResult.ruinProbability}%
          </div>
          <p className="text-xs text-slate-300 font-sans mt-1">
            Probability of encountering an adverse -{maxDrawdownR}R drawdown streak causing account breach.
          </p>
        </div>

        {/* Median Expected Yield */}
        <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-300 font-extrabold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              50th Pctl Median Return
            </span>
            <span className="text-xs font-bold text-slate-400">@ {tradesPerRun} trades</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-extrabold mt-2 ${simulationResult.medianFinalR >= 0 ? 'text-[#FF8C00]' : 'text-rose-400'}`}>
            {simulationResult.medianFinalR >= 0 ? '+' : ''}{simulationResult.medianFinalR}R
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>95% Upper: <strong className="text-[#00FF66]">+{simulationResult.top95FinalR}R</strong></span>
            <span>5% Lower: <strong className="text-rose-400">{simulationResult.bottom5FinalR}R</strong></span>
          </div>
        </div>
      </div>

      {/* Fan Chart / Confidence Envelope */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C12] border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00FF66]" />
            <h3 className="font-extrabold text-white uppercase tracking-wider">
              Monte Carlo Equity Envelope (1,000 Resamplings)
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#00FF66]" />
              <span className="text-slate-300">95th Percentile (Upper Bound)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#38BDF8]" />
              <span className="text-slate-300">50th Median Path</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500" />
              <span className="text-slate-300">5th Percentile (Worst 5% Runs)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationResult.fanChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
              <XAxis
                dataKey="tradeIndex"
                stroke="#64748B"
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                label={{ value: 'Consecutive Trade Count', position: 'insideBottomRight', offset: -5, fill: '#64748B', fontSize: 11 }}
              />
              <YAxis stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8' }} unit="R" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F111A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
                formatter={(val: any, name: string) => {
                  const label =
                    name === 'p95'
                      ? '95% Upper Bound'
                      : name === 'median'
                      ? 'Median (50%)'
                      : name === 'p5'
                      ? '5% Lower Bound'
                      : name === 'path1'
                      ? 'Sample Path A'
                      : name === 'path2'
                      ? 'Sample Path B'
                      : 'Sample Path C';
                  return [`${val >= 0 ? '+' : ''}${val}R`, label];
                }}
                labelFormatter={(label) => `Trade #${label}`}
              />
              {/* Profit Target Reference Line */}
              <ReferenceLine y={profitTargetR} stroke="#00FF66" strokeDasharray="4 4" label={{ value: `Target +${profitTargetR}R`, fill: '#00FF66', fontSize: 11, position: 'right' }} />
              {/* Max Drawdown Reference Line */}
              <ReferenceLine y={-maxDrawdownR} stroke="#FF4D4D" strokeDasharray="4 4" label={{ value: `Breach -${maxDrawdownR}R`, fill: '#FF4D4D', fontSize: 11, position: 'right' }} />

              {/* Sample simulated paths in the background */}
              <Line type="monotone" dataKey="path1" stroke="#475569" strokeWidth={1} dot={false} strokeOpacity={0.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="path2" stroke="#475569" strokeWidth={1} dot={false} strokeOpacity={0.6} isAnimationActive={false} />
              <Line type="monotone" dataKey="path3" stroke="#475569" strokeWidth={1} dot={false} strokeOpacity={0.6} isAnimationActive={false} />

              {/* Percentile Lines */}
              <Line type="monotone" dataKey="p95" stroke="#00FF66" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="median" stroke="#38BDF8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p5" stroke="#FF4D4D" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quant Interpretations */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#141522] border border-slate-800 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#00FF66] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">Prop Firm Viability:</strong>
              {simulationResult.passProbability >= 70 ? (
                <span>
                  High mathematical edge. With a <strong>{simulationResult.passProbability}% pass rate</strong> and low risk of breach ({simulationResult.ruinProbability}%), this strategy setup is suitable for evaluation challenges.
                </span>
              ) : simulationResult.passProbability >= 45 ? (
                <span>
                  Moderate expectancy. A <strong>{simulationResult.passProbability}% pass probability</strong> indicates sensitivity to losing streaks. Consider reducing per-trade risk to 0.5% to lower drawdown ruin risk.
                </span>
              ) : (
                <span>
                  High variance or negative EV. Risk of ruin ({simulationResult.ruinProbability}%) exceeds recommended limits. Gather more sample data before risking evaluation capital.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#141522] border border-slate-800 text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">Drawdown Stress Test:</strong>
              <span>
                Median peak drawdown across 1,000 resamplings is <strong>-{simulationResult.medianMaxDrawdown}R</strong>, while the 95th worst-case tail drawdown reached <strong>-{simulationResult.worstMaxDrawdown}R</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
