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
  Cloud,
} from 'lucide-react';
import { Experiment } from '../types/trade';
import { calculateGlobalStats } from '../utils/calculations';
import { SyncStatusBadge } from './SyncStatusBadge';
import { CodemLogo } from './CodemLogo';

interface NavbarProps {
  activeTab: 'overview' | 'experiments' | 'analytics' | 'whatsapp_hub';
  setActiveTab: (tab: 'overview' | 'experiments' | 'analytics' | 'whatsapp_hub') => void;
  experiments: Experiment[];
  isSyncing: boolean;
  onOpenAuth: () => void;
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
  isSyncing,
  onOpenAuth,
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
    <header className="sticky top-0 z-40 bg-[#0C0D14]/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100 shadow-xl">
      {/* Top Ticker / Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <CodemLogo size="sm" variant="full" />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FF6A00]/15 text-[#FF8C00] border border-[#FF6A00]/40 tracking-wider">
              V2.4 PRO
            </span>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="hidden xl:flex items-center gap-3.5 px-3.5 py-1.5 bg-[#141622] border border-slate-800 rounded-xl text-xs shadow-inner shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">NET:</span>
              <span className="text-[#00FF66] font-bold">
                {netSign}{globalStats.netR}R
              </span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">WIN RATE:</span>
              <span className="text-white font-bold">{globalStats.winRate}%</span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">AVG RR:</span>
              <span className="text-[#00FF66] font-bold">{globalStats.avgRR}R</span>
            </div>
            <div className="w-[1px] h-3.5 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">EXP:</span>
              <span className="text-white font-bold">{globalStats.expectancy >= 0 ? '+' : ''}{globalStats.expectancy}R</span>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <SyncStatusBadge
              isSyncing={isSyncing}
              isOnline={navigator.onLine}
              onOpenAuth={onOpenAuth}
            />

            <button
              onClick={onOpenNewExperiment}
              className="px-3.5 sm:px-4 py-2 bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs sm:text-sm rounded-xl uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:scale-[1.02] shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">New Experiment</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              onClick={onOpenMt5Import}
              className="px-3 sm:px-3.5 py-2 bg-[#171926] hover:bg-[#1E2132] text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-750 flex items-center gap-1.5 sm:gap-2 transition-colors shrink-0"
              title="Import MT5 / TradeTally CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00FF66]" />
              <span className="hidden md:inline">MT5 Sync</span>
            </button>

            {/* Settings & Database Management Dropdown */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`p-2 bg-[#171926] hover:bg-[#1E2132] text-slate-300 hover:text-white border rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                  isMenuOpen ? 'border-[#00FF66] text-[#00FF66] bg-[#1E2132]' : 'border-slate-800'
                }`}
                title="Database Settings & Actions"
                aria-expanded={isMenuOpen}
              >
                <Settings className="w-4 h-4" />
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180 text-[#00FF66]' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-[#141622] border border-slate-800 rounded-2xl shadow-2xl z-50 text-sm space-y-1.5 animate-fade-in">
                  <div className="px-3 py-1.5 text-xs font-mono uppercase text-slate-400 tracking-wider border-b border-slate-800 font-bold">
                    Database & Storage Control
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportBackup();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#1D2030] text-slate-200 hover:text-white flex items-center gap-3 text-xs sm:text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#00FF66]" />
                    <div>
                      <div className="font-semibold text-white">Backup Database (JSON)</div>
                      <div className="text-xs text-slate-400">Export research file locally</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onResetData();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#1D2030] text-slate-200 hover:text-white flex items-center gap-3 text-xs sm:text-sm font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold text-white">Reload Demo Datasets</div>
                      <div className="text-xs text-slate-400">Restore 7 sample studies</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClearAllData();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-3 text-xs sm:text-sm font-semibold transition-colors group"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-rose-400">Wipe All Data</div>
                      <div className="text-xs text-slate-400">Clear slate to log your live/backtests</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar - Chunky, High Readability Pills */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 py-2.5 no-scrollbar">
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
                className={`py-2 px-4 text-xs sm:text-sm font-bold tracking-wide rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#FF6A00] text-black font-extrabold shadow-[0_0_15px_rgba(255,106,0,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-[#161826] bg-[#12131C]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
