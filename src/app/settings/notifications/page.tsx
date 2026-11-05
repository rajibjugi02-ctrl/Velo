'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { ArrowLeft, Bell, Volume2, MessageSquare, Heart, Repeat2, Tag } from 'lucide-react';

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { settings, updateSettings } = useVelo();

  const notifications = settings.notifications || {
    messages: true,
    likes: true,
    reposts: true,
    tags: true,
    soundEnabled: true,
  };

  const toggleItem = (key: keyof typeof notifications) => {
    updateSettings({
      notifications: {
        ...notifications,
        [key]: !notifications[key],
      },
    });
  };

  const notificationItems = [
    {
      key: 'messages' as const,
      label: 'Direct Messages',
      desc: 'Instant notifications when contacts send you a chat',
      icon: MessageSquare,
      color: 'text-sky-400',
    },
    {
      key: 'likes' as const,
      label: 'Post Likes & Reactions',
      desc: 'Notices when community members like your feed posts',
      icon: Heart,
      color: 'text-rose-400',
    },
    {
      key: 'reposts' as const,
      label: 'Reposts & Quotes',
      desc: 'Notices when users amplify your content to their followers',
      icon: Repeat2,
      color: 'text-emerald-400',
    },
    {
      key: 'tags' as const,
      label: 'Mentions & Tags',
      desc: 'Notices when someone tags your account in a post or story',
      icon: Tag,
      color: 'text-purple-400',
    },
    {
      key: 'soundEnabled' as const,
      label: 'Sound Alerts',
      desc: 'Subtle audio feedback on incoming chats and interactions',
      icon: Volume2,
      color: 'text-amber-400',
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
            Notification Preferences
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control which push notifications and sounds reach your device
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm divide-y divide-zinc-200 dark:divide-white/5 overflow-hidden transition-colors">
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = notifications[item.key];

          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {item.label}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleItem(item.key)}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                  isEnabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                    isEnabled
                      ? 'translate-x-6 bg-white dark:bg-black'
                      : 'translate-x-0 bg-white dark:bg-zinc-400'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

