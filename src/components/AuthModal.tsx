import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, LogOut, User as UserIcon, Shield, Cloud, CloudOff, X } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#12131D] border border-slate-800 rounded-3xl p-6 font-sans text-xs sm:text-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2235] border border-slate-700 flex items-center justify-center text-[#00FF66]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Cloud Sync & Authentication
              </h3>
              <p className="text-xs text-slate-400">
                Real-Time Firestore Database Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {user ? (
          <div className="mt-5 space-y-5">
            <div className="p-4 bg-[#181B28] border border-slate-700 rounded-2xl flex items-center gap-3.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-[#00FF66]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1E2235] border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {user.displayName || (user.isAnonymous ? 'Guest Trader' : 'Trader')}
                </div>
                <div className="text-xs text-slate-400 truncate font-mono">
                  {user.email || (user.isAnonymous ? 'Anonymous Session' : user.uid)}
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono text-xs uppercase font-bold">
                Online
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00FF66]" />
                <span>All experiments and trade logs automatically sync across devices in real-time.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#181B28] hover:bg-[#1E2235] text-slate-200 text-xs sm:text-sm font-bold border border-slate-700"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2 border border-rose-800"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sign in with Google to sync your quantitative studies, custom trade tags, and WhatsApp presets securely to the cloud.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>{loading ? 'Authenticating...' : 'Continue with Google Account'}</span>
              </button>

              <button
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#181B28] hover:bg-[#1E2235] text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <UserIcon className="w-4 h-4" />
                <span>Continue as Local Guest</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
