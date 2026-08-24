import React, { useState, useRef } from 'react';
import { Experiment } from '../types/trade';
import { VisualReportCard } from './VisualReportCard';
import { formatWhatsAppReport, WhatsAppTemplateId, openWhatsAppShare, openWhatsAppWeb } from '../utils/whatsappFormatter';
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
  X,
  FileText,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react';

interface WhatsAppShareModalProps {
  experiment: Experiment;
  onClose: () => void;
  onPublished?: (experimentId: string) => void;
  availableGroups: string[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  experiment,
  onClose,
  onPublished,
  availableGroups,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateId>('standard_summary');
  const [cardTheme, setCardTheme] = useState<'codem_orange' | 'cyber_dark' | 'midnight_stealth' | 'emerald_terminal'>('codem_orange');
  const [customNote, setCustomNote] = useState('');
  const [includeLink, setIncludeLink] = useState(true);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>(availableGroups[0] || 'Codem Trading VIP Room');
  const [customPhone, setCustomPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'card_preview' | 'text_preview'>('card_preview');

  const formattedText = formatWhatsAppReport(experiment, selectedTemplate, customNote, includeLink);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedText(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#06b6d4', '#e2e8f0'],
      });
      setTimeout(() => setCopiedText(false), 2500);
      if (onPublished) onPublished(experiment.id);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadCard = async () => {
    const node = document.getElementById('whatsapp-report-card-element');
    if (!node) return;

    try {
      setIsExportingImage(true);
      const dataUrl = await toPng(node, {
        pixelRatio: 2.5,
        backgroundColor: '#040711',
        fontEmbedCSS: '',
      });
      const link = document.createElement('a');
      link.download = `CODEM-LAB-${experiment.id}-${experiment.pair}.png`;
      link.href = dataUrl;
      link.click();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8', '#fbbf24'],
      });
      if (onPublished) onPublished(experiment.id);
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleCopyImage = async () => {
    const node = document.getElementById('whatsapp-report-card-element');
    if (!node) return;

    try {
      setIsExportingImage(true);
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: '#040711',
        fontEmbedCSS: '',
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#22c55e', '#38bdf8'],
        });
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handlePublishWhatsApp = (mode: 'app' | 'web') => {
    if (mode === 'web') {
      openWhatsAppWeb(formattedText);
    } else {
      openWhatsAppShare(formattedText, customPhone);
    }
    if (onPublished) onPublished(experiment.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#12131D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#161826] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  WhatsApp Dispatcher & Card Generator
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-[#1E2235] text-[#00FF66] border border-slate-700 font-bold">
                  {experiment.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-resolution PNG summary cards and formatted Markdown messages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Options (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Template Selector */}
            <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Message Template Style
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'standard_summary', label: '🧪 Standard Backtest' },
                  { id: 'detailed_breakdown', label: '🔬 Deep-Dive Log' },
                  { id: 'signal_idea', label: '⚡ Setup Alert' },
                  { id: 'weekly_digest', label: '📋 Research Digest' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as WhatsAppTemplateId)}
                    className={`p-2.5 rounded-xl text-left border font-bold transition-all ${
                      selectedTemplate === t.id
                        ? 'bg-[#1E2235] border-[#00FF66] text-[#00FF66]'
                        : 'bg-[#12131D] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                <Palette className="w-4 h-4 text-[#FF6A00]" />
                <span>Visual Card Theme</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { id: 'codem_orange', label: 'CODEM Orange' },
                  { id: 'cyber_dark', label: 'Cyan Cyber' },
                  { id: 'emerald_terminal', label: 'Emerald Quant' },
                  { id: 'midnight_stealth', label: 'Stealth Dark' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setCardTheme(th.id as any)}
                    className={`p-2.5 rounded-xl border font-bold transition-all text-left ${
                      cardTheme === th.id
                        ? 'bg-[#1E2235] border-[#FF6A00] text-[#FF8C00]'
                        : 'bg-[#12131D] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-800 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Custom Research Commentary
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add extra commentary for the group..."
                className="w-full p-3 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00FF66]"
              />
            </div>

            {/* Group Selector */}
            <div className="p-5 rounded-2xl bg-[#181B28] border border-slate-800 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Target WhatsApp Channel
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#12131D] border border-slate-700 text-sm text-white font-mono font-semibold focus:outline-none focus:border-[#00FF66]"
              >
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center p-1 rounded-xl bg-[#181B28] border border-slate-800 font-mono text-xs font-bold">
                <button
                  onClick={() => setActiveTab('card_preview')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'card_preview'
                      ? 'bg-[#1E2235] text-[#00FF66]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Visual Card Canvas</span>
                </button>
                <button
                  onClick={() => setActiveTab('text_preview')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeTab === 'text_preview'
                      ? 'bg-[#1E2235] text-[#00FF66]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Markdown Message</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCard}
                  disabled={isExportingImage}
                  className="px-3.5 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#FF6A00]" />
                  <span>Save Image</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="px-3.5 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copiedText ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* Display tab */}
            {activeTab === 'card_preview' ? (
              <div className="p-6 rounded-2xl bg-[#08080C] border border-slate-800 flex justify-center overflow-x-auto shadow-2xl">
                <VisualReportCard
                  experiment={experiment}
                  theme={cardTheme}
                  customNote={customNote}
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#0B0C12] border border-slate-800">
                <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {formattedText}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#161826] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span>Target: <strong className="text-white">{selectedGroup}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePublishWhatsApp('web')}
              className="px-4 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>WhatsApp Web</span>
            </button>

            <button
              onClick={() => handlePublishWhatsApp('app')}
              className="px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all"
            >
              <Send className="w-4 h-4 stroke-[3]" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
