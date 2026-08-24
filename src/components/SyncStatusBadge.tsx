import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface SyncStatusBadgeProps {
  isSyncing: boolean;
  isOnline: boolean;
  onOpenAuth: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  isSyncing,
  isOnline,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  return (
    <button
      onClick={onOpenAuth}
      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border ${
        user
          ? 'bg-[#00FF66]/10 border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/20'
          : 'bg-[#181B28] border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
      }`}
      title={
        user
          ? `Synced as ${user.displayName || user.email || 'Trader'} to Firebase Firestore`
          : 'Click to Sign in and enable Firebase Cloud Sync'
      }
    >
      {isSyncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
      ) : user ? (
        <Cloud className="w-3.5 h-3.5 text-[#00FF66]" />
      ) : (
        <CloudOff className="w-3.5 h-3.5 text-slate-400" />
      )}

      <span className="hidden sm:inline">
        {isSyncing ? 'SYNCING...' : user ? 'CLOUD SYNC' : 'CONNECT CLOUD'}
      </span>

      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="w-4 h-4 rounded-full border border-[#00FF66]"
        />
      ) : user ? (
        <UserIcon className="w-3.5 h-3.5 text-[#00FF66]" />
      ) : null}
    </button>
  );
};
