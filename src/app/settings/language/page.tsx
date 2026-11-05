'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/types/velo';
import { ArrowLeft, Globe, Check } from 'lucide-react';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const languages: Array<{
    code: LanguageCode;
    nativeName: string;
    englishName: string;
    flag: string;
  }> = [
    { code: 'en', nativeName: 'English (US)', englishName: 'Default Primary Language', flag: '🇺🇸' },
    { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', flag: '🇮🇩' },
    { code: 'ja', nativeName: '日本語', englishName: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', nativeName: '한국어', englishName: 'Korean', flag: '🇰🇷' },
    { code: 'es', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', nativeName: 'Français', englishName: 'French', flag: '🇫🇷' },
    { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', flag: '🇸🇦' },
    { code: 'zh', nativeName: '简体中文', englishName: 'Simplified Chinese', flag: '🇨🇳' },
    { code: 'de', nativeName: 'Deutsch', englishName: 'German', flag: '🇩🇪' },
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
            Language Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Choose your preferred display language for Velo interface
          </p>
        </div>
      </div>

      {/* Language List */}
      <div className="rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm divide-y divide-zinc-200 dark:divide-white/5 overflow-hidden transition-colors">
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white'
                  : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    {lang.englishName}
                  </p>
                </div>
              </div>

              {isSelected && <Check className="w-5 h-5 text-zinc-900 dark:text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

