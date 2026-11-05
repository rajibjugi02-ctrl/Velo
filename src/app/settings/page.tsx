'use client';

import React from 'react';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  ShieldCheck,
  Palette,
  Globe,
  Users2,
  Lock,
  Archive,
  UserX,
  Bell,
  Wifi,
  Smartphone,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export default function SettingsHubPage() {
  const { savedAccounts, logout } = useVelo();
  const { t } = useLanguage();

  const settingsSections = [
    {
      group: 'Account & Identity',
      items: [
        {
          href: '/settings/profile',
          label: 'Profile & Account Security',
          desc: 'Email, phone number, and password credentials',
          icon: ShieldCheck,
        },
        {
          href: '/settings/accounts',
          label: 'Switch Account',
          desc: `Manage up to 3 multi-account profiles (${savedAccounts.length}/3 active)`,
          icon: Users2,
        },
      ],
    },
    {
      group: 'Interface & Localization',
      items: [
        {
          href: '/settings/appearance',
          label: 'Appearance & Chat Customization',
          desc: 'iOS Glass dark/light theme & custom bubble palettes',
          icon: Palette,
        },
        {
          href: '/settings/language',
          label: 'Language (Internationalization)',
          desc: 'English default, Indonesia, Japanese, Korean & more',
          icon: Globe,
        },
      ],
    },
    {
      group: 'Safety & Archives',
      items: [
        {
          href: '/settings/privacy',
          label: 'Privacy & Online Status',
          desc: 'Bio visibility, last seen status, and activity presence',
          icon: Lock,
        },
        {
          href: '/settings/archive',
          label: 'Archive',
          desc: 'Segmented vault for archived posts & expired stories',
          icon: Archive,
        },
        {
          href: '/settings/blocked',
          label: 'Blocked & Muted Accounts',
          desc: 'Review filtered users and interactions',
          icon: UserX,
        },
      ],
    },
    {
      group: 'System & Storage',
      items: [
        {
          href: '/settings/notifications',
          label: 'Notification Preferences',
          desc: 'Alert tones, push notices for likes, replies and tags',
          icon: Bell,
        },
        {
          href: '/settings/data-saver',
          label: 'Media & Data Saver',
          desc: 'Video banner autoplay controls for low mobile data',
          icon: Wifi,
        },
        {
          href: '/settings/sessions',
          label: 'Active Sessions & Clear Cache',
          desc: 'Manage logged devices and wipe local storage',
          icon: Smartphone,
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
          {t('settings')}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Control your Velo experience, spatial aesthetics, and security
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {settingsSections.map((sec) => (
          <div key={sec.group} className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
              {sec.group}
            </h2>

            <div className="rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl overflow-hidden divide-y divide-zinc-100 dark:divide-white/[0.04] shadow-sm">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] shrink-0 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Log Out button */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
