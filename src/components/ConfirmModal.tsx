import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-[#FF3333] hover:bg-[#E62E2E] text-white shadow-[0_0_12px_rgba(255,51,51,0.3)]';
      case 'warning':
        return 'bg-[#FFCC00] hover:bg-[#E6B800] text-black font-bold shadow-[0_0_12px_rgba(255,204,0,0.3)]';
      case 'primary':
      default:
        return 'bg-[#00FF00] hover:bg-[#00CC00] text-black font-bold shadow-[0_0_12px_rgba(0,255,0,0.3)]';
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-[#FF3333]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#FFCC00]" />;
      case 'primary':
      default:
        return <RotateCcw className="w-5 h-5 text-[#00FF00]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="relative w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded shadow-2xl p-5 font-mono text-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded bg-[#1A1A1A] border border-[#333333] shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-[#888888] font-sans leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[#222222]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${getButtonStyles()}`}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
