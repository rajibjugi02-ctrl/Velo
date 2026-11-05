'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useVelo } from '@/context/VeloContext';
import { ChatBubblePalette } from '@/types/velo';
import { getBubbleThemeClasses } from '@/lib/utils';
import { ArrowLeft, Moon, Sun, Check } from 'lucide-react';

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, showToast } = useVelo();

  const chatPalettes: Array<{
    id: ChatBubblePalette;
    name: string;
    swatchColor: string;
    description: string;
  }> = [
    {
      id: 'zinc-dark',
      name: 'Zinc Minimalist',
      swatchColor: 'bg-[#27272a]',
      description: 'Solid matte zinc with subtle border',
    },
    {
      id: 'charcoal-noir',
      name: 'Charcoal Noir',
      swatchColor: 'bg-[#171717]',
      description: 'Deep matte black for true stealth elegance',
    },
    {
      id: 'ocean-slate',
      name: 'Ocean Slate',
      swatchColor: 'bg-[#1e2e3d]',
      description: 'Understated matte navy slate tone',
    },
    {
      id: 'sage-green',
      name: 'Sage Forest',
      swatchColor: 'bg-[#1f382b]',
      description: 'Subdued botanical matte sage',
    },
    {
      id: 'muted-indigo',
      name: 'Muted Indigo',
      swatchColor: 'bg-[#2b354f]',
      description: 'Sophisticated matte midnight violet',
    },
    {
      id: 'clean-mono',
      name: 'Contrast Monochrome',
      swatchColor: 'bg-zinc-900 dark:bg-white',
      description: 'High contrast solid monochrome pill',
    },
  ];

  const currentBubbleColor = settings.chatBubbleColor || 'zinc-dark';
  const previewTheme = getBubbleThemeClasses(currentBubbleColor, true);

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-full border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
            Appearance & Chat Aesthetics
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tailor theme modes and matte non-gradient chat bubbles
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dual Theme Selector (iOS Dark Glass vs Clean Light) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Base Theme Mode
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                showToast('Switched to iOS Dark Glass', 'info');
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-white/20 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.06] text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon className="w-5 h-5 text-zinc-300" />
                {theme === 'dark' && <Check className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white">iOS Dark Glass</p>
                <p className="text-[10px] text-zinc-400">Obsidian & translucent glass</p>
              </div>
            </button>

            {/* Light Mode */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                showToast('Switched to Clean Light', 'info');
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all ${
                theme === 'light'
                  ? 'bg-white border-zinc-900 text-zinc-900 shadow-sm ring-1 ring-zinc-900/10'
                  : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.06] text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun className="w-5 h-5 text-amber-500" />
                {theme === 'light' && <Check className="w-4 h-4 text-zinc-900" />}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">Clean Light</p>
                <p className="text-[10px] text-zinc-500">Airy, crisp, and high contrast</p>
              </div>
            </button>
          </div>
        </div>

        {/* Live Chat Bubble Preview */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Live Bubble Preview
            </h2>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Matte Solid Preview
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-black/60 border border-zinc-200/80 dark:border-white/[0.08] space-y-2.5">
            {/* Incoming message */}
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-white text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-100 border border-zinc-200/80 dark:border-white/[0.08] text-xs max-w-xs shadow-sm">
                Hey! How do the new matte chat bubbles feel in your chat?
              </div>
            </div>

            {/* Outgoing preview message with selected palette */}
            <div className="flex justify-end">
              <div
                className={`p-3 rounded-2xl text-xs max-w-xs ${previewTheme.bubbleClass}`}
              >
                Zero AI-slop gradients. Clean, matte, and comfortable to read.
              </div>
            </div>
          </div>
        </div>

        {/* Chat Bubble Palette Selection */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Chat Bubble Color Palette (Matte Minimalist)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chatPalettes.map((palette) => {
              const isSelected = currentBubbleColor === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => {
                    updateSettings({ chatBubbleColor: palette.id });
                    showToast(`Palette changed to ${palette.name}`, 'info');
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-400 dark:border-white/30 shadow-sm'
                      : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/80 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/10'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${palette.swatchColor} shrink-0 shadow-sm flex items-center justify-center border border-white/10`}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white dark:text-zinc-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {palette.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {palette.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
