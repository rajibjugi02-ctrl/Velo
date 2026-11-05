'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { ArrowLeft, UserX, VolumeX, Shield, Check } from 'lucide-react';

export default function BlockedAndMutedPage() {
  const router = useRouter();
  const { allUsers, settings, unblockUser, unmuteUser } = useVelo();

  const blockedList = allUsers.filter((u) => settings.blockedUsers?.includes(u.id));
  const mutedList = allUsers.filter((u) => settings.mutedUsers?.includes(u.id));

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
            Blocked & Muted Accounts
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage filtered users and interaction restrictions
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Blocked Accounts Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Blocked Accounts ({blockedList.length})
            </h2>
          </div>

          {blockedList.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-neutral-500 py-3">
              You haven&apos;t blocked any accounts yet.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-neutral-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => unblockUser(user.id)}
                    className="px-3 py-1 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muted Accounts Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <VolumeX className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Muted Accounts ({mutedList.length})
            </h2>
          </div>

          {mutedList.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-neutral-500 py-3">
              You haven&apos;t muted any accounts yet.
            </p>
          ) : (
            <div className="space-y-2">
              {mutedList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-neutral-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => unmuteUser(user.id)}
                    className="px-3 py-1 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold transition-colors"
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

