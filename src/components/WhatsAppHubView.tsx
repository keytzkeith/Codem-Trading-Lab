import React, { useState } from 'react';
import { Experiment } from '../types/trade';
import { VisualReportCard } from './VisualReportCard';
import { formatWhatsAppReport, WhatsAppTemplateId, openWhatsAppShare, openWhatsAppWeb } from '../utils/whatsappFormatter';
import { calculateTradeStats } from '../utils/calculations';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  Share2,
  Copy,
  Check,
  Download,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Layers,
  Palette,
  Plus,
  Trash2,
  Smartphone,
  Eye,
} from 'lucide-react';

interface WhatsAppHubViewProps {
  experiments: Experiment[];
  availableGroups: string[];
  onUpdateGroups: (groups: string[]) => void;
  onOpenWhatsAppShare: (exp: Experiment) => void;
  onOpenNewExperiment?: () => void;
  onOpenMt5Import?: () => void;
}

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({
  experiments,
  availableGroups,
  onUpdateGroups,
  onOpenWhatsAppShare,
  onOpenNewExperiment,
  onOpenMt5Import,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0]?.id || '');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateId>('standard_summary');
  const [cardTheme, setCardTheme] = useState<'codem_orange' | 'cyber_dark' | 'midnight_stealth' | 'emerald_terminal'>('codem_orange');
  const [customNote, setCustomNote] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState(availableGroups[0] || 'Codem Trading VIP Room');

  const currentExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  if (experiments.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">
              WhatsApp Publishing Hub & Card Studio
            </h1>
          </div>
          <p className="text-[11px] text-[#666]">
            Automated Markdown report generation, high-density PNG card exports, and group broadcasts.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#222222] border-dashed p-10 rounded text-center space-y-3">
          <div className="w-10 h-10 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center mx-auto text-[#00FF00]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              No Experiments Available to Dispatch
            </h4>
            <p className="text-xs text-[#777] max-w-md mx-auto mt-1">
              Create your first real trading experiment or import your trade history from MT5/CSV to generate WhatsApp report cards and copy-paste text templates.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenNewExperiment && (
              <button
                onClick={onOpenNewExperiment}
                className="px-4 py-2 bg-[#00FF00] hover:bg-[#00CC00] text-black text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-[0_0_10px_rgba(0,255,0,0.2)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Experiment</span>
              </button>
            )}
            {onOpenMt5Import && (
              <button
                onClick={onOpenMt5Import}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] hover:text-white text-xs font-semibold rounded border border-[#333] flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#00FF00]" />
                <span>Import MT5 / CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formattedText = currentExp
    ? formatWhatsAppReport(currentExp, selectedTemplate, customNote, true)
    : '';

  const handleCopyText = async () => {
    if (!formattedText) return;
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedText(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#06b6d4'],
      });
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCard = async () => {
    const node = document.getElementById('whatsapp-report-card-element');
    if (!node || !currentExp) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(node, {
        pixelRatio: 2.5,
        backgroundColor: '#040711',
        fontEmbedCSS: '',
      });
      const link = document.createElement('a');
      link.download = `CODEM-${currentExp.id}-${currentExp.pair}-REPORT.png`;
      link.href = dataUrl;
      link.click();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8', '#fbbf24'],
      });
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (!availableGroups.includes(newGroupName.trim())) {
      const updated = [...availableGroups, newGroupName.trim()];
      onUpdateGroups(updated);
      setActiveGroup(newGroupName.trim());
    }
    setNewGroupName('');
  };

  const handleRemoveGroup = (name: string) => {
    const updated = availableGroups.filter((g) => g !== name);
    onUpdateGroups(updated);
    if (activeGroup === name) setActiveGroup(updated[0] || '');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]" />
            <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em] font-mono">
              WhatsApp Publishing Hub & Card Studio
            </h1>
          </div>
          <p className="text-[11px] text-[#666]">
            Automated Markdown report generation, high-density PNG card exports, and group broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => currentExp && openWhatsAppShare(formattedText)}
            className="px-3.5 py-1.5 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-colors"
          >
            <Send className="w-3.5 h-3.5 stroke-[3]" />
            <span>Broadcast to WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Side: Select Experiment & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* 1. Pick Experiment */}
          <div className="p-3.5 rounded bg-[#111111] border border-[#222222] space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] flex items-center justify-between font-mono">
              <span>Select Research Experiment</span>
              <span className="text-[#00FF00] font-mono">{experiments.length} available</span>
            </label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white font-mono focus:outline-none focus:border-[#00FF00]"
            >
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  [{exp.id}] {exp.pair} {exp.timeframe} — {exp.setupModel}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Format Template */}
          <div className="p-3.5 rounded bg-[#111111] border border-[#222222] space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] font-mono">
              Message Template Style
            </label>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              {[
                { id: 'standard_summary', label: '🧪 Standard Backtest' },
                { id: 'detailed_breakdown', label: '🔬 Deep-Dive Log' },
                { id: 'signal_idea', label: '⚡ Setup Alert' },
                { id: 'weekly_digest', label: '📋 Research Digest' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id as WhatsAppTemplateId)}
                  className={`p-2 rounded text-left border text-[11px] font-semibold transition-all ${
                    selectedTemplate === t.id
                      ? 'bg-[#1A1A1A] border-[#00FF00] text-[#00FF00]'
                      : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Card Visual Style */}
          <div className="p-3.5 rounded bg-[#111111] border border-[#222222] space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] flex items-center gap-1.5 font-mono">
              <Palette className="w-3 h-3 text-[#FF6A00]" />
              Visual Card Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
              {[
                { id: 'codem_orange', label: '🔥 Codem Orange' },
                { id: 'cyber_dark', label: 'Terminal Dark' },
                { id: 'emerald_terminal', label: 'Neon Green' },
                { id: 'midnight_stealth', label: 'Monochrome' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setCardTheme(theme.id as any)}
                  className={`p-1.5 rounded text-[10px] text-center border font-medium transition-all ${
                    cardTheme === theme.id
                      ? 'bg-[#1A1A1A] border-[#FF6A00] text-[#FF6A00] font-bold shadow-[0_0_8px_rgba(255,106,0,0.2)]'
                      : 'bg-[#141414] border-[#222222] text-[#777]'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Target WhatsApp Groups */}
          <div className="p-3.5 rounded bg-[#111111] border border-[#222222] space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888]">
                Preset WhatsApp Channels
              </label>
            </div>

            <div className="space-y-1">
              {availableGroups.map((group) => (
                <div
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-[11px] cursor-pointer transition-all ${
                    activeGroup === group
                      ? 'bg-[#1A1A1A] border-[#00FF00]/60 text-[#00FF00] font-semibold'
                      : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    {group}
                  </span>
                  {availableGroups.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGroup(group);
                      }}
                      className="p-0.5 text-[#555] hover:text-[#FF3333]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddGroup} className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Add custom group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#00FF00]"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded bg-[#1A1A1A] hover:bg-[#222] text-xs text-[#00FF00] font-bold border border-[#333]"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <button
              onClick={handleCopyText}
              className={`p-2.5 rounded text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                copiedText
                  ? 'bg-[#002200] border-[#006600] text-[#00FF00]'
                  : 'bg-[#161616] border-[#2A2A2A] text-[#CCC] hover:bg-[#1E1E1E]'
              }`}
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied Markdown' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={isExporting}
              className="p-2.5 rounded bg-[#1A1A1A] hover:bg-[#222] text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-[#333] transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>{isExporting ? 'Exporting...' : 'Export Card PNG'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Live Visual Report Card & WhatsApp Chat Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {currentExp ? (
            <div className="p-4 rounded bg-[#111111] border border-[#222222] flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-3 font-mono text-[10px]">
                <span className="font-bold uppercase tracking-wider text-[#888]">
                  Live Visual Card Canvas ({cardTheme.replace('_', ' ')})
                </span>
                <span className="text-[#00FF00]">
                  Target: {activeGroup}
                </span>
              </div>

              <div className="transform scale-[0.95] sm:scale-100 origin-center my-1">
                <VisualReportCard
                  experiment={currentExp}
                  theme={cardTheme}
                  customNote={customNote}
                />
              </div>

              {/* Message Preview Text Box below */}
              <div className="w-full mt-4 p-3 rounded bg-[#0A0A0A] border border-[#222222] text-[11px] font-mono text-[#AAA] whitespace-pre-wrap leading-relaxed">
                <div className="text-[9px] uppercase font-bold text-[#555] mb-1.5 tracking-wider">
                  WhatsApp Markdown Preview:
                </div>
                {formattedText}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#555] font-mono text-xs">
              No experiments found. Create an experiment first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
