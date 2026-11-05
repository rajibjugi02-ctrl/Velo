'use client';

import React from 'react';
import { useVelo } from '@/context/VeloContext';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useVelo();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl border border-zinc-200 dark:border-white/15 text-zinc-900 dark:text-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />}
            {(!toast.type || toast.type === 'info') && <Info className="w-5 h-5 text-sky-500 dark:text-sky-400 shrink-0" />}
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

