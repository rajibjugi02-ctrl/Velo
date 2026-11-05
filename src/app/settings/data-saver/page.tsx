'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { ArrowLeft, Wifi, Check, Sparkles } from 'lucide-react';

export default function MediaDataSaverPage() {
  const router = useRouter();
  const { settings, updateSettings } = useVelo();

  const currentAutoplay = settings.dataSaver?.videoAutoplay || 'always';
  const highQualityMedia = settings.dataSaver?.highQualityMedia ?? true;

  const autoplayOptions: Array<{
    id: 'always' | 'wifi' | 'never';
    label: string;
    description: string;
  }> = [
    {
      id: 'always',
      label: 'Always Autoplay (Recommended)',
      description: 'Smooth video banners and stories play automatically on both mobile data and Wi-Fi',
    },
    {
      id: 'wifi',
      label: 'Only on Wi-Fi',
      description: 'Preserve mobile carrier cellular data by pausing videos when on 4G/5G',
    },
    {
      id: 'never',
      label: 'Never Autoplay (Data Saver)',
      description: 'Videos require tap to play. Optimizes battery life and strictly saves bandwidth',
    },
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
            Media & Data Saver
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Configure video banner autoplay and cellular data consumption
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Autoplay Policies */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Video Autoplay Policy
            </h2>
          </div>

          <div className="space-y-2">
            {autoplayOptions.map((opt) => {
              const isSelected = currentAutoplay === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    updateSettings({
                      dataSaver: { ...settings.dataSaver, videoAutoplay: opt.id },
                    })
                  }
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 text-zinc-600 dark:text-neutral-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold">{opt.label}</p>
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

        {/* High Quality Uploads */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm flex items-center justify-between transition-colors">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
              Upload at Highest Quality
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
              Always publish high-res photos and 1080p video banners even if upload takes longer
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                dataSaver: { ...settings.dataSaver, highQualityMedia: !highQualityMedia },
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              highQualityMedia ? 'bg-sky-500' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                highQualityMedia ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

