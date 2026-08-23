import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  FileSpreadsheet,
  Share2,
  TrendingUp,
  BarChart3,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Trash2,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { Experiment } from '../types/trade';
import { calculateGlobalStats } from '../utils/calculations';

interface NavbarProps {
  activeTab: 'overview' | 'experiments' | 'analytics' | 'whatsapp_hub';
  setActiveTab: (tab: 'overview' | 'experiments' | 'analytics' | 'whatsapp_hub') => void;
  experiments: Experiment[];
  onOpenNewExperiment: () => void;
  onOpenMt5Import: () => void;
  onResetData: () => void;
  onClearAllData: () => void;
  onExportBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  experiments,
  onOpenNewExperiment,
  onOpenMt5Import,
  onResetData,
  onClearAllData,
  onExportBackup,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const globalStats = calculateGlobalStats(experiments);
  const netSign = globalStats.netR >= 0 ? '+' : '';

  // Close menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A] border-b border-[#222222] text-[#E0E0E0]">
      {/* Top Ticker / Brand Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('overview')}>
            <div className="w-7 h-7 bg-[#1A1A1A] border border-[#333333] rounded flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-[0.2em] text-[#00FF00] uppercase">
                  CODEM TRADING LAB
                </span>
                <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-[#111] text-[#888] border border-[#333]">
                  V2.4
                </span>
              </div>
              <p className="text-[9px] text-[#666666] font-mono tracking-wider uppercase hidden sm:block">
                QUANT RESEARCH • BACKTEST • DISPATCH
              </p>
            </div>
          </div>

          {/* Quick Metrics Ticker (High Density) */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-[#111111] border border-[#222222] rounded text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-[#666666] uppercase text-[9px] tracking-wider">NET:</span>
              <span className="text-[#00FF00] font-bold">
                {netSign}{globalStats.netR}R
              </span>
            </div>
            <div className="w-[1px] h-3 bg-[#222222]" />
            <div className="flex items-center gap-1">
              <span className="text-[#666666] uppercase text-[9px] tracking-wider">WR:</span>
              <span className="text-white font-bold">{globalStats.winRate}%</span>
            </div>
            <div className="w-[1px] h-3 bg-[#222222]" />
            <div className="flex items-center gap-1">
              <span className="text-[#666666] uppercase text-[9px] tracking-wider">AVG RR:</span>
              <span className="text-[#00FF00] font-bold">{globalStats.avgRR}R</span>
            </div>
            <div className="w-[1px] h-3 bg-[#222222]" />
            <div className="flex items-center gap-1">
              <span className="text-[#666666] uppercase text-[9px] tracking-wider">EXP:</span>
              <span className="text-white font-bold">{globalStats.expectancy >= 0 ? '+' : ''}{globalStats.expectancy}R</span>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewExperiment}
              className="px-3 py-1.5 bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">New Experiment</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              onClick={onOpenMt5Import}
              className="px-2.5 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] text-[#CCC] hover:text-white text-xs font-semibold rounded border border-[#2A2A2A] flex items-center gap-1.5 transition-colors"
              title="Import MT5 / TradeTally CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF00]" />
              <span className="hidden sm:inline">MT5 Sync</span>
            </button>

            {/* Settings & Database Management Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`px-2 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] text-[#AAA] hover:text-white border rounded text-xs flex items-center gap-1.5 transition-colors ${
                  isMenuOpen ? 'border-[#00FF00] text-[#00FF00] bg-[#1A1A1A]' : 'border-[#2A2A2A]'
                }`}
                title="Database Settings & Actions"
                aria-expanded={isMenuOpen}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono uppercase hidden sm:inline">Data</span>
                <ChevronDown className={`w-3 h-3 text-[#666] transition-transform ${isMenuOpen ? 'rotate-180 text-[#00FF00]' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 p-1.5 bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl z-50 text-xs font-sans space-y-1 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#666] tracking-wider border-b border-[#222]">
                    Data & Storage Control
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportBackup();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-[#1C1C1C] text-[#CCC] hover:text-white flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00FF00]" />
                    <div>
                      <div className="font-semibold">Backup Database (JSON)</div>
                      <div className="text-[10px] text-[#666]">Export research file locally</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onResetData();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-[#1C1C1C] text-[#CCC] hover:text-white flex items-center gap-2.5 text-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <div>
                      <div className="font-semibold">Reload Demo Datasets</div>
                      <div className="text-[10px] text-[#666]">Restore 7 sample studies</div>
                    </div>
                  </button>

                  <div className="border-t border-[#222222] my-1" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClearAllData();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded hover:bg-[#2A0000] text-[#FF4444] hover:text-[#FF6666] flex items-center gap-2.5 text-xs font-semibold transition-colors group"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#FF4444] group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold">Wipe All (Empty for Real Data)</div>
                      <div className="text-[10px] text-[#888]">Clear slate to log your live/backtests</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar - High Density */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-[#1C1C1C] py-1">
          {[
            { id: 'overview', label: 'CONTROL CENTER', icon: Layers },
            { id: 'experiments', label: `RESEARCH LAB (${experiments.length})`, icon: Sparkles },
            { id: 'analytics', label: 'QUANT EDGE ANALYTICS', icon: BarChart3 },
            { id: 'whatsapp_hub', label: 'WHATSAPP DISPATCH HUB', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-3 text-[11px] font-mono tracking-wider font-semibold rounded flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white border border-[#333333]'
                    : 'text-[#777777] hover:text-[#CCC] hover:bg-[#111111]'
                }`}
              >
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#00FF00] shadow-[0_0_6px_#00FF00]" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

