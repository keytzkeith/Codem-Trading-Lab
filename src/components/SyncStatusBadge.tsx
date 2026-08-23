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
      className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all border ${
        user
          ? 'bg-[#00FF00]/10 border-[#00FF00]/40 text-[#00FF00] hover:bg-[#00FF00]/20'
          : 'bg-[#181818] border-[#2A2A2A] text-[#888] hover:text-[#CCC] hover:border-[#444]'
      }`}
      title={
        user
          ? `Synced as ${user.displayName || user.email || 'Trader'} to Firebase Firestore`
          : 'Click to Sign in and enable Firebase Cloud Sync'
      }
    >
      {isSyncing ? (
        <RefreshCw className="w-3 h-3 animate-spin text-[#38bdf8]" />
      ) : user ? (
        <Cloud className="w-3 h-3 text-[#00FF00]" />
      ) : (
        <CloudOff className="w-3 h-3 text-[#666]" />
      )}

      <span className="hidden sm:inline font-semibold">
        {isSyncing ? 'SYNCING' : user ? 'CLOUD SYNC ON' : 'CONNECT CLOUD'}
      </span>

      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="w-3.5 h-3.5 rounded-full border border-[#00FF00]/60 ml-0.5"
        />
      ) : user ? (
        <UserIcon className="w-3 h-3 text-[#00FF00] ml-0.5" />
      ) : null}
    </button>
  );
};
