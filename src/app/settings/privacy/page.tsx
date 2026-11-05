'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { ArrowLeft, Lock, Eye, Activity, ShieldCheck, Check } from 'lucide-react';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useVelo();

  const bioVisibility = settings.privacy?.bioVisibility || 'everyone';
  const lastSeenVisibility = settings.privacy?.lastSeenVisibility || 'everyone';
  const showOnlineStatus = settings.privacy?.showOnlineStatus ?? true;

  const visibilityOptions: Array<{
    id: 'everyone' | 'friends' | 'only_me';
    label: string;
    description: string;
  }> = [
    { id: 'everyone', label: 'Everyone (Semua Orang)', description: 'Visible to any visitor on Velo' },
    { id: 'friends', label: 'Friends / Mutual Followers (Teman Saja)', description: 'Only people you follow back' },
    { id: 'only_me', label: 'Only Me (Hanya Saya)', description: 'Completely private to you' },
  ];

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-200 dark:border-white/10 transition-colors">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 hover:text-black dark:text-neutral-300 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
            Privacy & Status
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control your audience visibility and presence telemetry
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* About / Bio Visibility */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              About & Bio Visibility
            </h2>
          </div>

          <div className="space-y-2">
            {visibilityOptions.map((opt) => {
              const isSelected = bioVisibility === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      privacy: { ...settings.privacy, bioVisibility: opt.id },
                    })
                  }
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 text-zinc-600 dark:text-neutral-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold leading-tight">{opt.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Last Seen & Online Status */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Last Seen & Online Presence
            </h2>
          </div>

          {/* Toggle Online status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Show Active Status</p>
              <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                Display green presence ring when you are online in Velo
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  privacy: { ...settings.privacy, showOnlineStatus: !showOnlineStatus },
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                showOnlineStatus ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  showOnlineStatus
                    ? 'translate-x-6 bg-white dark:bg-black'
                    : 'translate-x-0 bg-white dark:bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Who can see last seen */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-500 dark:text-neutral-400 block">
              Who can see my last seen timestamp:
            </label>
            {visibilityOptions.map((opt) => {
              const isSelected = lastSeenVisibility === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      privacy: { ...settings.privacy, lastSeenVisibility: opt.id },
                    })
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 text-zinc-600 dark:text-neutral-300'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  {isSelected && <Check className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

