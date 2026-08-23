/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Experiment } from './types/trade';
import { INITIAL_EXPERIMENTS, STORAGE_KEY, WHATSAPP_GROUPS_KEY, DEFAULT_WHATSAPP_GROUPS } from './data/initialData';
import { deduplicateExperiments } from './utils/idGenerator';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ExperimentsList } from './components/ExperimentsList';
import { TradingAnalyticsView } from './components/TradingAnalyticsView';
import { WhatsAppHubView } from './components/WhatsAppHubView';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ExperimentDetailModal } from './components/ExperimentDetailModal';
import { NewExperimentModal } from './components/NewExperimentModal';
import { Mt5ImportModal } from './components/Mt5ImportModal';
import { ConfirmModal } from './components/ConfirmModal';
import confetti from 'canvas-confetti';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function App() {
  // Load persisted experiments with strict deduplication
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateExperiments(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load experiments from localStorage', e);
    }
    return deduplicateExperiments(INITIAL_EXPERIMENTS);
  });

  // Load WhatsApp groups
  const [whatsappGroups, setWhatsappGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WHATSAPP_GROUPS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load whatsapp groups', e);
    }
    return DEFAULT_WHATSAPP_GROUPS;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'experiments' | 'analytics' | 'whatsapp_hub'>('overview');

  // Modals state
  const [detailExp, setDetailExp] = useState<Experiment | null>(null);
  const [shareExp, setShareExp] = useState<Experiment | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMt5Modal, setShowMt5Modal] = useState(false);

  // Custom confirmation modal state (replaces window.confirm)
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    confirmVariant: 'danger',
    action: () => {},
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever experiments change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [experiments]);

  // Save WhatsApp groups
  useEffect(() => {
    try {
      localStorage.setItem(WHATSAPP_GROUPS_KEY, JSON.stringify(whatsappGroups));
    } catch (e) {
      console.error('Failed to save groups to localStorage', e);
    }
  }, [whatsappGroups]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add new experiment
  const handleSaveNewExperiment = (newExp: Experiment) => {
    const sanitized = deduplicateExperiments([newExp, ...experiments]);
    setExperiments(sanitized);
    setShowNewModal(false);
    showToast(`✅ Created experiment ${newExp.id} with ${newExp.trades.length} trades!`);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981'],
    });
  };

  // Import MT5 experiment
  const handleImportMt5 = (newExp: Experiment) => {
    const sanitized = deduplicateExperiments([newExp, ...experiments]);
    setExperiments(sanitized);
    setShowMt5Modal(false);
    showToast(`📊 Successfully imported ${newExp.trades.length} trades into ${newExp.id}!`);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#38bdf8', '#34d399', '#fbbf24'],
    });
  };

  // Update existing experiment
  const handleUpdateExperiment = (updated: Experiment) => {
    setExperiments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (detailExp?.id === updated.id) {
      setDetailExp(updated);
    }
    showToast(`Updated research parameters for ${updated.id}`);
  };

  // Delete experiment
  const handleDeleteExperiment = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Experiment ${id}?`,
      message: `Are you sure you want to permanently delete experiment study ${id} and all its recorded trades? This cannot be undone.`,
      confirmLabel: 'Delete Study',
      confirmVariant: 'danger',
      action: () => {
        setExperiments((prev) => prev.filter((e) => e.id !== id));
        if (detailExp?.id === id) setDetailExp(null);
        if (shareExp?.id === id) setShareExp(null);
        showToast(`🗑️ Deleted experiment ${id}`);
      },
    });
  };

  // Reset to default sample experiments
  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reload Demo Datasets?',
      message:
        'This will reload the 7 default Codem Trading sample studies (BT-028, BT-014, BT-022, etc.) into your workspace database.',
      confirmLabel: 'Reload Demo Studies',
      confirmVariant: 'warning',
      action: () => {
        const demo = deduplicateExperiments(INITIAL_EXPERIMENTS);
        setExperiments(demo);
        setWhatsappGroups(DEFAULT_WHATSAPP_GROUPS);
        showToast('🔄 Database reset to initial demo datasets.');
      },
    });
  };

  // Clear all data (blank slate for clean real data)
  const handleClearAllData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Wipe All Data & Start Clean Slate?',
      message:
        'This will clear ALL current sample experiments from your browser storage, leaving you with an empty database ready for your real backtests and live trading data.',
      confirmLabel: 'Wipe Database Clean',
      confirmVariant: 'danger',
      action: () => {
        setExperiments([]);
        setDetailExp(null);
        setShareExp(null);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (e) {
          console.error(e);
        }
        showToast('🗑️ Database wiped clean. Ready for real trading data!');
      },
    });
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(experiments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `codem-trading-lab-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported complete JSON research backup!');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] selection:bg-[#00FF00]/20 selection:text-[#00FF00] font-sans flex flex-col antialiased">
      {/* Top Navigation & Brand Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        experiments={experiments}
        onOpenNewExperiment={() => setShowNewModal(true)}
        onOpenMt5Import={() => setShowMt5Modal(true)}
        onResetData={handleResetData}
        onClearAllData={handleClearAllData}
        onExportBackup={handleExportBackup}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-4">
        {activeTab === 'overview' && (
          <OverviewDashboard
            experiments={experiments}
            onSelectExperiment={(exp) => setDetailExp(exp)}
            onOpenWhatsAppShare={(exp) => setShareExp(exp)}
            onOpenNewExperiment={() => setShowNewModal(true)}
            onOpenMt5Import={() => setShowMt5Modal(true)}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentsList
            experiments={experiments}
            onSelectExperiment={(exp) => setDetailExp(exp)}
            onOpenWhatsAppShare={(exp) => setShareExp(exp)}
            onOpenNewExperiment={() => setShowNewModal(true)}
            onOpenMt5Import={() => setShowMt5Modal(true)}
            onDeleteExperiment={handleDeleteExperiment}
          />
        )}

        {activeTab === 'analytics' && (
          <TradingAnalyticsView
            experiments={experiments}
            onSelectExperiment={(exp) => setDetailExp(exp)}
            onOpenNewExperiment={() => setShowNewModal(true)}
            onOpenMt5Import={() => setShowMt5Modal(true)}
          />
        )}

        {activeTab === 'whatsapp_hub' && (
          <WhatsAppHubView
            experiments={experiments}
            availableGroups={whatsappGroups}
            onUpdateGroups={setWhatsappGroups}
            onOpenWhatsAppShare={(exp) => setShareExp(exp)}
            onOpenNewExperiment={() => setShowNewModal(true)}
            onOpenMt5Import={() => setShowMt5Modal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] bg-[#0C0C0C] py-3.5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#666666] font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <span className="font-bold tracking-wider text-[#999999] uppercase">CODEM TRADING LAB</span>
            <span className="text-[#444444]">•</span>
            <span className="text-[#777777]">HIGH DENSITY QUANT ENGINE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#555555]">MT5 BRIDGE: <span className="text-[#00FF00]">ONLINE</span></span>
            <span className="text-[#444444]">•</span>
            <span>SYSTEMATIC BACKTEST & WHATSAPP DISPATCH</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: WhatsApp Share & Card Studio */}
      {shareExp && (
        <WhatsAppShareModal
          experiment={shareExp}
          onClose={() => setShareExp(null)}
          availableGroups={whatsappGroups}
          onPublished={(id) => {
            setExperiments((prev) =>
              prev.map((e) => (e.id === id ? { ...e, publishedToWhatsApp: true, publishedAt: new Date().toISOString() } : e))
            );
            showToast(`Report for ${id} prepared for WhatsApp dispatch!`);
          }}
        />
      )}

      {/* MODAL 2: Experiment Deep-Dive & Trade Log */}
      {detailExp && (
        <ExperimentDetailModal
          experiment={detailExp}
          onClose={() => setDetailExp(null)}
          onUpdate={handleUpdateExperiment}
          onOpenWhatsAppShare={(exp) => {
            setDetailExp(null);
            setShareExp(exp);
          }}
        />
      )}

      {/* MODAL 3: New Experiment Creator */}
      {showNewModal && (
        <NewExperimentModal
          onClose={() => setShowNewModal(false)}
          onSave={handleSaveNewExperiment}
          experiments={experiments}
        />
      )}

      {/* MODAL 4: MT5 / CSV Parser */}
      {showMt5Modal && (
        <Mt5ImportModal
          onClose={() => setShowMt5Modal(false)}
          onImport={handleImportMt5}
          experiments={experiments}
        />
      )}

      {/* MODAL 5: In-App Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
        onConfirm={() => {
          confirmConfig.action();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded bg-[#111111] border border-[#00FF00]/50 text-white text-xs font-mono shadow-[0_0_15px_rgba(0,255,0,0.15)] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
