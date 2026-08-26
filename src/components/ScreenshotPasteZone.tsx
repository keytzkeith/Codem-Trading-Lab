import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Clipboard,
  Upload,
  Link,
  Plus,
  Trash2,
  Maximize2,
  Check,
  Sparkles,
} from 'lucide-react';

interface ScreenshotPasteZoneProps {
  screenshots: string[];
  onChange: (updatedScreenshots: string[]) => void;
  maxScreenshots?: number;
  label?: string;
}

export const ScreenshotPasteZone: React.FC<ScreenshotPasteZoneProps> = ({
  screenshots,
  onChange,
  maxScreenshots = 12,
  label = 'Chart Screenshots & Visual Evidence',
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (screenshots.length >= maxScreenshots) {
          alert(`Maximum limit of ${maxScreenshots} screenshots reached.`);
          return;
        }
        onChange([...screenshots, result]);
        showNotice('Image attached from clipboard / file!');
      }
    };
    reader.readAsDataURL(file);
  };

  const showNotice = (msg: string) => {
    setPasteNotice(msg);
    setTimeout(() => setPasteNotice(null), 3000);
  };

  // Global & local clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [screenshots, onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      (Array.from(e.dataTransfer.files) as File[]).forEach((file) => processFile(file));
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;
    if (screenshots.length >= maxScreenshots) {
      alert(`Maximum limit of ${maxScreenshots} screenshots reached.`);
      return;
    }
    onChange([...screenshots, urlInput.trim()]);
    setUrlInput('');
    showNotice('Image URL attached!');
  };

  const handleRemove = (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4 font-sans" ref={containerRef}>
      {/* Header info */}
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-2 font-mono">
          <ImageIcon className="w-4 h-4 text-[#00FF66]" />
          <span>{label}</span>
          <span className="text-slate-500">({screenshots.length}/{maxScreenshots})</span>
        </label>

        {pasteNotice && (
          <span className="text-xs font-bold text-[#00FF66] bg-[#00FF66]/10 px-2.5 py-0.5 rounded-md border border-[#00FF66]/30 flex items-center gap-1 font-mono animate-pulse">
            <Check className="w-3.5 h-3.5" />
            {pasteNotice}
          </span>
        )}
      </div>

      {/* Interactive Drop & Paste Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? 'border-[#00FF66] bg-[#00FF66]/10'
            : 'border-slate-800 bg-[#12131D] hover:border-slate-700'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#181B28] border border-slate-700 flex items-center justify-center text-[#00FF66] shadow-lg">
          <Clipboard className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white">
            Press <kbd className="px-2 py-0.5 rounded bg-[#1E2235] text-[#00FF66] font-mono text-xs border border-slate-700 font-extrabold">Ctrl + V</kbd> or <kbd className="px-2 py-0.5 rounded bg-[#1E2235] text-[#00FF66] font-mono text-xs border border-slate-700 font-extrabold">⌘ + V</kbd> anywhere to paste chart
          </p>
          <p className="text-xs text-slate-400">
            Or drag & drop image files directly from TradingView, MT5, or your desktop
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                (Array.from(e.target.files) as File[]).forEach((file) => processFile(file));
              }
            }}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#00FF66]" />
            <span>Browse Files</span>
          </button>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            placeholder="Or paste direct image URL (e.g. TradingView snapshot link)..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#12131D] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          className="px-4 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00E05A] text-black font-extrabold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add URL</span>
        </button>
      </div>

      {/* Thumbnails Grid */}
      {screenshots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {screenshots.map((url, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-800 bg-[#0B0C12] aspect-video"
            >
              <img
                src={url}
                alt={`Chart ${idx + 1}`}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                onClick={() => setZoomedImage(url)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                <span className="text-[11px] font-mono font-bold text-white">#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomedImage(url)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:text-[#00FF66] transition-colors"
                    title="Zoom in"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 rounded-lg bg-black/60 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#0B0C12] border border-slate-800/80 text-center text-xs text-slate-500 font-mono">
          No chart captures attached yet. Copy a chart and hit Ctrl+V.
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img src={zoomedImage} alt="Chart full view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
