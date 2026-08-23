import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, LogOut, User as UserIcon, Shield, Cloud, CloudOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, signInWithGoogle, signInAsGuest, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAsGuest();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded p-6 font-sans text-xs shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[#00FF00]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Cloud Sync & Authentication
              </h3>
              <p className="text-[11px] text-[#666]">
                Firebase Firestore Real-Time Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white px-2 py-1 rounded hover:bg-[#1C1C1C]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-[#200] border border-[#FF3333]/40 text-[#FF6666] text-xs">
            {error}
          </div>
        )}

        {user ? (
          <div className="mt-5 space-y-4">
            <div className="p-3 bg-[#161616] border border-[#282828] rounded flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full border border-[#00FF00]/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#AAA]">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {user.displayName || (user.isAnonymous ? 'Guest Trader' : 'Trader')}
                </div>
                <div className="text-[11px] text-[#777] truncate font-mono">
                  {user.email || (user.isAnonymous ? 'Anonymous Session' : user.uid)}
                </div>
              </div>
              <div className="px-2 py-0.5 rounded bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] font-mono text-[9px] uppercase font-bold">
                Connected
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-[#888]">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>All experiments and trade logs automatically sync across devices in real-time.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222] flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-[#CCC] text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded bg-[#2A0000] hover:bg-[#3A0000] text-[#FF4444] text-xs font-semibold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-[#888] leading-relaxed">
              Sign in with your Google account to automatically back up your quantitative backtests, MT5 imports, and trading statistics securely in Firebase Firestore.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded bg-white hover:bg-[#EEE] text-black font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Connecting...' : 'Continue with Google Account'}</span>
              </button>

              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2 px-4 rounded bg-[#181818] hover:bg-[#202020] text-[#AAA] hover:text-white font-medium text-xs border border-[#333] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <CloudOff className="w-3.5 h-3.5 text-[#777]" />
                <span>Continue as Guest / Offline Session</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-[#555] font-mono">
                🔒 Enterprise security with Firebase Firestore cloud encryption
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
