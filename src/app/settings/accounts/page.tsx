'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Users2, Plus, Check, Trash2, LogIn } from 'lucide-react';

export default function SwitchAccountsPage() {
  const router = useRouter();
  const { currentUser, savedAccounts, switchAccount, removeAccount } = useVelo();
  const { t } = useLanguage();

  // Filter out any dummy mock accounts permanently
  const DUMMY_SET = new Set(['usr_me', 'usr_elena', 'usr_marcus', 'usr_sarah', 'usr_kai', 'usr_jordan']);
  const displayedAccounts = savedAccounts.filter((acc) => !DUMMY_SET.has(acc.id));

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
            Switch Account
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Fast switching between up to 3 logged-in accounts
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Saved Accounts List */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Active Stored Profiles ({displayedAccounts.length}/3)
            </h2>
            <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
              Max 3 accounts supported
            </span>
          </div>

          <div className="space-y-2">
            {displayedAccounts.map((account) => {
              const isActive = currentUser?.id === account.id;

              return (
                <div
                  key={account.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={account.avatar}
                      alt={account.username}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate">
                        {account.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-neutral-400 truncate">
                        @{account.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchAccount(account.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-semibold transition-colors"
                      >
                        Switch
                      </button>
                    )}

                    {savedAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(account.id)}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        title="Remove from device list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Account Actions */}
        {savedAccounts.length < 3 ? (
          <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Add Another Account
            </h2>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Register a new profile or sign in with an existing username & password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/auth/register?switch=true"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Account</span>
              </Link>

              <Link
                href="/auth/login?switch=true"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-semibold text-xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Existing Account</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            Account capacity reached (3 of 3). To connect another identity, remove one of the saved accounts above.
          </div>
        )}
      </div>
    </div>
  );
}

