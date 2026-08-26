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
  FlaskConical,
  Microscope,
  Zap,
  ClipboardList
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
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              WhatsApp Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            WhatsApp Publishing Hub & Card Studio
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Automated Markdown report generation, high-density PNG card exports, and group broadcasts.
          </p>
        </div>

        <div className="bg-[#12131D] border border-slate-800/80 border-dashed p-10 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-[#181B28] border border-slate-700 flex items-center justify-center mx-auto text-[#00FF66]">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white uppercase tracking-wider">
              No Experiments Available to Dispatch
            </h4>
            <p className="text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Create your first real trading experiment or import your trade history from MT5/CSV to generate WhatsApp report cards and copy-paste text templates.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenNewExperiment && (
              <button
                onClick={onOpenNewExperiment}
                className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00E05A] text-black text-sm font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Experiment</span>
              </button>
            )}
            {onOpenMt5Import && (
              <button
                onClick={onOpenMt5Import}
                className="px-5 py-2.5 bg-[#171926] hover:bg-[#1E2132] text-slate-200 hover:text-white text-sm font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#00FF66]" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30">
              <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]" />
              WhatsApp Studio & Dispatcher
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            WhatsApp Publishing Hub & Card Studio
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Automated Markdown report generation, high-density PNG card exports, and instant group broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => currentExp && openWhatsAppShare(formattedText)}
            className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.35)] transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4 stroke-[3]" />
            <span>Broadcast to WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Select Experiment & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Pick Experiment */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-2 shadow-lg">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between font-mono">
              <span>Select Research Experiment</span>
              <span className="text-[#00FF66] font-bold font-mono">{experiments.length} available</span>
            </label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181B28] border border-slate-700/80 text-sm text-white font-mono font-semibold focus:outline-none focus:border-[#00FF66]"
            >
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  [{exp.id}] {exp.pair} {exp.timeframe} — {exp.setupModel}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Format Template */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3 shadow-lg">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Message Template Style
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              {[
                { id: 'standard_summary', label: 'Standard Backtest', icon: FlaskConical },
                { id: 'detailed_breakdown', label: 'Deep-Dive Log', icon: Microscope },
                { id: 'signal_idea', label: 'Setup Alert', icon: Zap },
                { id: 'weekly_digest', label: 'Research Digest', icon: ClipboardList },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id as WhatsAppTemplateId)}
                  className={`p-3 rounded-xl text-left border text-xs sm:text-sm font-bold transition-all flex flex-col gap-1.5 ${
                    selectedTemplate === t.id
                      ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                      : 'bg-[#181B28] border-slate-800 text-slate-400 hover:bg-[#1E2235] hover:text-white'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Card Visual Style */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3 shadow-lg">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
              <Palette className="w-4 h-4 text-[#FF6A00]" />
              <span>Report Card Visual Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { id: 'codem_orange', label: 'CODEM Orange (Signature)' },
                { id: 'cyber_dark', label: 'Cyan Cyber' },
                { id: 'emerald_terminal', label: 'Emerald Quant' },
                { id: 'midnight_stealth', label: 'Stealth Midnight' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => setCardTheme(th.id as any)}
                  className={`p-2.5 rounded-xl border font-bold transition-all text-left ${
                    cardTheme === th.id
                      ? 'bg-[#1E2235] border-[#FF6A00] text-[#FF8C00] shadow-[0_0_10px_rgba(255,106,0,0.2)]'
                      : 'bg-[#181B28] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Custom Key Finding / Note */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-2 shadow-lg">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Custom Commentary / Key Finding
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Override finding notes with your custom takeaway..."
              className="w-full p-3 rounded-xl bg-[#181B28] border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF66] font-sans"
            />
          </div>

          {/* 5. WhatsApp Broadcast Groups */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-3 shadow-lg">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between font-mono">
              <span>Managed WhatsApp Channels</span>
              <span className="text-slate-400">{availableGroups.length} channels</span>
            </label>

            <form onSubmit={handleAddGroup} className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Add Channel / Group Name..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#181B28] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF66]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white text-xs font-bold uppercase tracking-wider border border-slate-700"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {availableGroups.map((grp) => (
                <div
                  key={grp}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
                    activeGroup === grp
                      ? 'bg-[#25D366]/20 border-[#25D366]/50 text-[#25D366]'
                      : 'bg-[#181B28] border-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className="cursor-pointer"
                    onClick={() => setActiveGroup(grp)}
                  >
                    {grp}
                  </span>
                  {availableGroups.length > 1 && (
                    <button
                      onClick={() => handleRemoveGroup(grp)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Visual Card Preview & Formatted Markdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-[#12131D] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="px-4 py-2 bg-[#1E2235] hover:bg-[#282E47] text-white text-xs sm:text-sm font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText ? 'Copied Markdown!' : 'Copy Formatted Text'}</span>
              </button>

              <button
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="px-4 py-2 bg-[#1E2235] hover:bg-[#282E47] text-white text-xs sm:text-sm font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#FF6A00]" />
                <span>{isExporting ? 'Generating PNG...' : 'Save Visual Card'}</span>
              </button>
            </div>

            <button
              onClick={() => openWhatsAppShare(formattedText)}
              className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]"
            >
              <Send className="w-4 h-4 stroke-[3]" />
              <span>Share to Group</span>
            </button>
          </div>

          {/* Visual Card Canvas */}
          <div className="p-6 rounded-2xl bg-[#08080C] border border-slate-800/80 flex justify-center overflow-x-auto shadow-2xl">
            {currentExp && (
              <VisualReportCard
                experiment={currentExp}
                theme={cardTheme}
                customNote={customNote}
              />
            )}
          </div>

          {/* Formatted Text Preview */}
          <div className="p-5 rounded-2xl bg-[#12131D] border border-slate-800/80 space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400 font-bold">
              <span>Markdown Message Output</span>
              <span>WhatsApp Native Syntax</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#0B0C12] border border-slate-800 text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
              {formattedText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
