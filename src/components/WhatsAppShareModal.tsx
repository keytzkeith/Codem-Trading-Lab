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

  const cardRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222] bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-[#00FF00]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  WhatsApp Dispatch & Card Studio
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1A1A1A] text-[#00FF00] border border-[#333]">
                  {experiment.id}
                </span>
              </div>
              <p className="text-[10px] text-[#666] font-mono">
                {experiment.pair} • {experiment.setupModel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#222222] max-h-[82vh] overflow-y-auto">
          {/* Left Column: Controls & Configuration (5 cols) */}
          <div className="lg:col-span-5 p-4 space-y-3.5 bg-[#111111] font-mono text-xs">
            {/* Step 1: Select Format Template */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-[#00FF00]" />
                1. Report Format Template
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard_summary', label: '🧪 Standard Backtest', desc: 'Core metrics & verdict' },
                  { id: 'detailed_breakdown', label: '🔬 Deep-Dive Log', desc: 'Trade log & stats' },
                  { id: 'signal_idea', label: '⚡ Setup Alert', desc: 'Quick execution rule' },
                  { id: 'weekly_digest', label: '📋 Research Digest', desc: 'Summary highlight' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id as WhatsAppTemplateId)}
                    className={`p-2 rounded text-left border transition-all ${
                      selectedTemplate === tmpl.id
                        ? 'bg-[#1A1A1A] border-[#00FF00] text-white shadow-[0_0_8px_rgba(0,255,0,0.15)]'
                        : 'bg-[#141414] border-[#222222] text-[#888] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-white">{tmpl.label}</div>
                    <div className="text-[9px] text-[#666] mt-0.5">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Visual Card Theme */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-[#FF6A00]" />
                2. Visual Card Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'codem_orange', label: '🔥 Codem Orange' },
                  { id: 'cyber_dark', label: 'Terminal Dark' },
                  { id: 'emerald_terminal', label: 'Neon Green' },
                  { id: 'midnight_stealth', label: 'Monochrome' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCardTheme(theme.id as any)}
                    className={`px-1.5 py-1.5 rounded text-[10px] font-medium border text-center transition-all ${
                      cardTheme === theme.id
                        ? 'bg-[#1A1A1A] border-[#FF6A00] text-[#FF6A00] font-bold shadow-[0_0_8px_rgba(255,106,0,0.2)]'
                        : 'bg-[#141414] border-[#222222] text-[#777] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Custom Group & Add Note */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-[#00FF00]" />
                3. Target WhatsApp Channel
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white focus:outline-none focus:border-[#00FF00]"
              >
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    👥 {g}
                  </option>
                ))}
                <option value="custom">✏️ Enter Specific Phone Number...</option>
              </select>

              {selectedGroup === 'custom' && (
                <div className="mt-1.5">
                  <input
                    type="text"
                    placeholder="e.g. +447123456789 (international format)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white focus:outline-none focus:border-[#00FF00]"
                  />
                </div>
              )}
            </div>

            {/* Step 4: Optional Add Note & Toggle Link */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#888]">
                Lead Trader Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add extra context or instructions for the group..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#161616] border border-[#2A2A2A] text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#00FF00] resize-none"
              />

              <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={includeLink}
                  onChange={(e) => setIncludeLink(e.target.checked)}
                  className="rounded border-[#333] bg-[#161616] text-[#00FF00] focus:ring-[#00FF00]"
                />
                <span className="text-[11px] text-[#888]">
                  Include Lab Dashboard Link in report
                </span>
              </label>
            </div>

            {/* Action Buttons Hub */}
            <div className="pt-2 border-t border-[#222222] space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handlePublishWhatsApp('app')}
                  className="px-3 py-2 rounded bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(0,255,0,0.2)] transition-colors"
                >
                  <Send className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Send WhatsApp</span>
                </button>

                <button
                  onClick={() => handlePublishWhatsApp('web')}
                  className="px-3 py-2 rounded bg-[#1A1A1A] hover:bg-[#222] text-[#CCC] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#333] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-[#00FF00]" />
                  <span>WhatsApp Web</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleCopyText}
                  className={`px-2.5 py-2 rounded font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    copiedText
                      ? 'bg-[#002200] border-[#006600] text-[#00FF00]'
                      : 'bg-[#161616] border-[#2A2A2A] text-[#CCC] hover:bg-[#1E1E1E]'
                  }`}
                >
                  {copiedText ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Text Copied' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleDownloadCard}
                  disabled={isExportingImage}
                  className="px-2.5 py-2 rounded bg-[#1A1A1A] hover:bg-[#222] text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-[#333] transition-all disabled:opacity-50"
                >
                  <Download className="w-3 h-3 text-[#00FF00]" />
                  <span>{isExportingImage ? 'Exporting...' : 'Export PNG'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Previews (7 cols) */}
          <div className="lg:col-span-7 p-4 flex flex-col bg-[#0A0A0A]">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between mb-3 font-mono">
              <div className="flex items-center gap-1 p-0.5 rounded bg-[#111111] border border-[#222222]">
                <button
                  onClick={() => setActiveTab('card_preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'card_preview'
                      ? 'bg-[#1F1F1F] text-[#00FF00]'
                      : 'text-[#666] hover:text-[#CCC]'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Card Canvas</span>
                </button>
                <button
                  onClick={() => setActiveTab('text_preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'text_preview'
                      ? 'bg-[#1F1F1F] text-[#00FF00]'
                      : 'text-[#666] hover:text-[#CCC]'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Markdown Text</span>
                </button>
              </div>

              {activeTab === 'card_preview' && (
                <button
                  onClick={handleCopyImage}
                  disabled={isExportingImage}
                  className="px-2 py-1 rounded bg-[#141414] hover:bg-[#1C1C1C] text-[#CCC] text-[10px] font-mono border border-[#2A2A2A] flex items-center gap-1"
                >
                  {copiedImage ? <Check className="w-3 h-3 text-[#00FF00]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedImage ? 'Image Copied' : 'Copy Image'}</span>
                </button>
              )}
            </div>

            {/* Preview Box */}
            <div className="flex-1 flex items-center justify-center min-h-[380px] p-2 bg-[#0C0C0C] rounded border border-[#1E1E1E] overflow-auto">
              {activeTab === 'card_preview' ? (
                <div ref={cardRef} className="transform scale-95 origin-center">
                  <VisualReportCard
                    experiment={experiment}
                    theme={cardTheme}
                    customNote={customNote}
                  />
                </div>
              ) : (
                <div className="w-full max-w-md p-3.5 rounded bg-[#111111] border border-[#222222] text-[#DDD] font-sans shadow-xl">
                  {/* WhatsApp Chat Header Simulation */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#222222] mb-2.5">
                    <div className="w-6 h-6 rounded bg-[#25D366] flex items-center justify-center text-black font-mono font-bold text-[10px]">
                      CD
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{selectedGroup}</div>
                      <div className="text-[9px] text-[#00FF00] font-mono">Trading Lab Dispatch</div>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="p-3 rounded bg-[#075E54]/30 border border-[#075E54]/60 text-white text-[11px] font-mono leading-relaxed whitespace-pre-wrap">
                    {formattedText}
                    <div className="text-[8px] text-[#888] text-right mt-1 font-mono">
                      10:16 AM • CODEM BOT ✓✓
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
