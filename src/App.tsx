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
import { AuthModal } from './components/AuthModal';
import { ExperimentSpotlightView } from './components/ExperimentSpotlightView';
import { AuthProvider, useAuth } from './lib/AuthContext';
import {
  subscribeToExperiments,
  saveExperimentToFirestore,
  deleteExperimentFromFirestore,
  clearAllExperimentsInFirestore,
  bulkSaveExperimentsToFirestore,
  saveUserSettingsToFirestore,
  fetchUserSettingsFromFirestore,
  fetchExperimentById,
} from './services/firestoreService';
import confetti from 'canvas-confetti';
import { CheckCircle2, Cloud, Layers, Sparkles, BarChart3, Share2, Plus } from 'lucide-react';

function TradingAppInner() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load experiments state
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

  // Modals & Spotlight state
  const [detailExp, setDetailExp] = useState<Experiment | null>(null);
  const [shareExp, setShareExp] = useState<Experiment | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMt5Modal, setShowMt5Modal] = useState(false);
  const [spotlightExp, setSpotlightExp] = useState<Experiment | null>(null);

  // Check URL search parameters on mount (?exp=BT-001 or ?study=BT-001)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const expParam = urlParams.get('exp') || urlParams.get('study') || urlParams.get('id');

    if (expParam) {
      const targetId = decodeURIComponent(expParam).trim().toUpperCase();
      // First check in currently loaded experiments
      const match = experiments.find((e) => e.id.toUpperCase() === targetId);
      if (match) {
        setSpotlightExp(match);
      } else {
        // If not found in current memory, query Firestore directly
        fetchExperimentById(targetId).then((fetched) => {
          if (fetched) {
            setSpotlightExp(fetched);
          }
        });
      }
    }
  }, [experiments]);

  // Custom confirmation modal state
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(experiments));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [experiments]);

  // Save WhatsApp groups locally and in Cloud if signed in
  useEffect(() => {
    try {
      localStorage.setItem(WHATSAPP_GROUPS_KEY, JSON.stringify(whatsappGroups));
    } catch (e) {
      console.error('Failed to save groups to localStorage', e);
    }

    if (user && !user.isAnonymous) {
      saveUserSettingsToFirestore(user.uid, whatsappGroups).catch((err) =>
        console.warn('Could not sync user settings to Firestore:', err)
      );
    }
  }, [whatsappGroups, user]);

  // Firestore Real-time synchronization
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeToExperiments(
      user?.uid || null,
      (cloudExperiments) => {
        setIsSyncing(false);
        if (cloudExperiments && cloudExperiments.length > 0) {
          setExperiments(deduplicateExperiments(cloudExperiments));
        } else if (user) {
          // If Firestore is empty on first launch and user is authenticated, seed initial data
          const localStored = localStorage.getItem(STORAGE_KEY);
          if (localStored) {
            try {
              const parsed = JSON.parse(localStored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                bulkSaveExperimentsToFirestore(parsed, user.uid).catch((err) =>
                  console.warn('Could not seed initial data to cloud:', err)
                );
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      },
      (err) => {
        setIsSyncing(false);
        console.warn('Firestore offline / local fallback mode active:', err.message);
      }
    );

    // Fetch user-custom settings if signed in
    if (user && !user.isAnonymous) {
      fetchUserSettingsFromFirestore(user.uid).then((customGroups) => {
        if (customGroups && Array.isArray(customGroups) && customGroups.length > 0) {
          setWhatsappGroups(customGroups);
        }
      });
    }

    return () => unsubscribe();
  }, [user]);

  // Add new experiment with Firestore sync
  const handleSaveNewExperiment = async (newExp: Experiment) => {
    const sanitized = deduplicateExperiments([newExp, ...experiments]);
    setExperiments(sanitized);
    setShowNewModal(false);
    showToast(`✅ Saved ${newExp.id} to Workspace!`);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00FF00', '#38bdf8'],
    });

    if (user) {
      try {
        setIsSyncing(true);
        await saveExperimentToFirestore(newExp, user.uid);
      } catch (e) {
        console.warn('Saved to local storage, will sync when cloud connected:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Import MT5 experiment with Firestore sync
  const handleImportMt5 = async (newExp: Experiment) => {
    const sanitized = deduplicateExperiments([newExp, ...experiments]);
    setExperiments(sanitized);
    setShowMt5Modal(false);
    showToast(`📊 Saved ${newExp.trades.length} trades (${newExp.id})!`);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#38bdf8', '#34d399', '#fbbf24'],
    });

    if (user) {
      try {
        setIsSyncing(true);
        await saveExperimentToFirestore(newExp, user.uid);
      } catch (e) {
        console.warn('Saved to local storage, will sync when cloud connected:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Update existing experiment
  const handleUpdateExperiment = async (updated: Experiment) => {
    setExperiments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (detailExp?.id === updated.id) {
      setDetailExp(updated);
    }
    showToast(`Updated research parameters for ${updated.id}`);

    if (user) {
      try {
        setIsSyncing(true);
        await saveExperimentToFirestore(updated, user.uid);
      } catch (e) {
        console.warn('Could not sync update to cloud:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Delete experiment
  const handleDeleteExperiment = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: `Delete Experiment ${id}?`,
      message: `Are you sure you want to permanently delete experiment study ${id}? This cannot be undone.`,
      confirmLabel: 'Delete Study',
      confirmVariant: 'danger',
      action: async () => {
        setExperiments((prev) => prev.filter((e) => e.id !== id));
        if (detailExp?.id === id) setDetailExp(null);
        if (shareExp?.id === id) setShareExp(null);
        showToast(`🗑️ Deleted experiment ${id}`);

        if (user) {
          try {
            setIsSyncing(true);
            await deleteExperimentFromFirestore(id);
          } catch (e) {
            console.warn('Could not delete from Firestore:', e);
          } finally {
            setIsSyncing(false);
          }
        }
      },
    });
  };

  // Reset to default sample experiments
  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reload Demo Datasets?',
      message:
        'This will reload the default Codem Trading sample studies into your workspace.',
      confirmLabel: 'Reload Demo Studies',
      confirmVariant: 'warning',
      action: async () => {
        const demo = deduplicateExperiments(INITIAL_EXPERIMENTS);
        setExperiments(demo);
        setWhatsappGroups(DEFAULT_WHATSAPP_GROUPS);
        showToast('🔄 Workspace reset to initial demo datasets.');

        if (user) {
          try {
            setIsSyncing(true);
            await bulkSaveExperimentsToFirestore(demo, user.uid);
          } catch (e) {
            console.warn('Could not bulk save to Firestore:', e);
          } finally {
            setIsSyncing(false);
          }
        }
      },
    });
  };

  // Clear all data (blank slate for clean real data)
  const handleClearAllData = () => {
    const existingIds = experiments.map((e) => e.id);
    setConfirmConfig({
      isOpen: true,
      title: 'Wipe All Data & Start Clean Slate?',
      message:
        'This will clear ALL experiments from your database and local storage, leaving you with an empty workspace ready for real trading data.',
      confirmLabel: 'Wipe Database Clean',
      confirmVariant: 'danger',
      action: async () => {
        setExperiments([]);
        setDetailExp(null);
        setShareExp(null);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch (e) {
          console.error(e);
        }
        showToast('🗑️ Database wiped clean. Ready for real trading data!');

        if (user) {
          try {
            setIsSyncing(true);
            await clearAllExperimentsInFirestore(existingIds);
          } catch (e) {
            console.warn('Could not wipe Firestore database:', e);
          } finally {
            setIsSyncing(false);
          }
        }
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

  // If a public spotlight study link is active (from WhatsApp click)
  if (spotlightExp) {
    return (
      <div className="min-h-screen bg-[#08080A]">
        <ExperimentSpotlightView
          experiment={spotlightExp}
          onBackToLab={() => {
            setSpotlightExp(null);
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', window.location.pathname);
            }
          }}
          onOpenWhatsAppShare={() => setShareExp(spotlightExp)}
        />

        {/* MODAL: WhatsApp Share from Spotlight */}
        {shareExp && (
          <WhatsAppShareModal
            experiment={shareExp}
            onClose={() => setShareExp(null)}
            availableGroups={whatsappGroups}
            onPublished={async (id) => {
              const updated = experiments.map((e) =>
                e.id === id ? { ...e, publishedToWhatsApp: true, publishedAt: new Date().toISOString() } : e
              );
              setExperiments(updated);
              const exp = updated.find((e) => e.id === id);
              if (exp) {
                await saveExperimentToFirestore(exp, user?.uid || null).catch(console.error);
              }
              showToast(`Report for ${id} prepared for WhatsApp dispatch!`);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] selection:bg-[#00FF00]/20 selection:text-[#00FF00] font-sans flex flex-col antialiased">
      {/* Top Navigation & Brand Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        experiments={experiments}
        isSyncing={isSyncing}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenNewExperiment={() => setShowNewModal(true)}
        onOpenMt5Import={() => setShowMt5Modal(true)}
        onResetData={handleResetData}
        onClearAllData={handleClearAllData}
        onExportBackup={handleExportBackup}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 pb-24 sm:pb-6">
        {activeTab === 'overview' && (
          <OverviewDashboard
            experiments={experiments}
            onSelectExperiment={(exp) => setDetailExp(exp)}
            onOpenWhatsAppShare={(exp) => setShareExp(exp)}
            onOpenNewExperiment={() => setShowNewModal(true)}
            onOpenMt5Import={() => setShowMt5Modal(true)}
            onResetData={handleResetData}
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
            onResetData={handleResetData}
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

      {/* Mobile Floating Bottom Bar for Fast Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0D14]/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-between shadow-2xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'overview' ? 'text-[#00FF66]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Control</span>
        </button>

        <button
          onClick={() => setActiveTab('experiments')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'experiments' ? 'text-[#00FF66]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Lab</span>
        </button>

        {/* Center Quick Add Button */}
        <button
          onClick={() => setShowNewModal(true)}
          className="w-10 h-10 rounded-full bg-[#00FF66] text-black flex items-center justify-center -mt-4 shadow-[0_0_15px_rgba(0,255,102,0.4)] border-2 border-[#0A0A0A] font-extrabold hover:scale-105 transition-transform"
          title="New Study"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'analytics' ? 'text-[#00FF66]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Edge</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp_hub')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            activeTab === 'whatsapp_hub' ? 'text-[#00FF66]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0C0D14] py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
            <span className="font-extrabold tracking-wider text-slate-200 uppercase">CODEM TRADING LAB</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">QUANT RESEARCH TERMINAL</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              STORAGE: <span className="text-[#00FF66] font-bold">FIREBASE FIRESTORE</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-medium text-slate-300">REAL-TIME MULTI-DEVICE SYNC</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: WhatsApp Share & Card Studio */}
      {shareExp && (
        <WhatsAppShareModal
          experiment={shareExp}
          onClose={() => setShareExp(null)}
          availableGroups={whatsappGroups}
          onPublished={async (id) => {
            const updated = experiments.map((e) =>
              e.id === id ? { ...e, publishedToWhatsApp: true, publishedAt: new Date().toISOString() } : e
            );
            setExperiments(updated);
            const exp = updated.find((e) => e.id === id);
            if (exp) {
              await saveExperimentToFirestore(exp, user?.uid || null).catch(console.error);
            }
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

      {/* MODAL 6: Authentication & Cloud Sync Dialog */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => showToast('🎉 Connected to Firebase Firestore!')}
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

export default function App() {
  return (
    <AuthProvider>
      <TradingAppInner />
    </AuthProvider>
  );
}
