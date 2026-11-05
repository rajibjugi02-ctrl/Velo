'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { Logo } from '@/components/common/Logo';
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  User,
  Settings,
  Plus,
  LogOut,
  Check,
  ChevronDown,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const LeftSidebar: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isHydrated, savedAccounts, switchAccount, logout, conversations, activities } = useVelo();
  const { t } = useLanguage();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadActivitiesCount = activities.filter((a) => !a.isRead).length;

  // Filter out any dummy accounts (Alex, Elena, Marcus, etc.) from switcher
  const dummyIds = new Set(['usr_me', 'usr_marcus', 'usr_elena', 'usr_sarah', 'usr_kai', 'usr_jordan']);
  const dummyNames = new Set(['alex_chen', 'marcus_v', 'elena_rostova', 'sarah_k', 'kai_zen', 'jordan_google']);
  const displayedAccounts = savedAccounts.filter(
    (acc) => !dummyIds.has(acc.id) && !dummyNames.has(acc.username?.toLowerCase())
  );

  const navLinks = [
    { href: '/feed', label: t('home'), icon: Home },
    { href: '/explore', label: t('explore'), icon: Search },
    {
      href: '/activity',
      label: t('activity'),
      icon: Heart,
      badge: unreadActivitiesCount > 0 ? unreadActivitiesCount : undefined,
    },
    {
      href: '/messages',
      label: t('messages'),
      icon: MessageCircle,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/profile', label: t('profile'), icon: User },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 xl:w-72 2xl:w-80 h-full overflow-y-auto shrink-0 px-4 py-6 border-r border-zinc-200 dark:border-white/[0.08] bg-white/75 dark:bg-black/75 backdrop-blur-2xl z-30 select-none transition-colors duration-300">
      <div className="flex flex-col gap-6">
        {/* Official Transparent Brand Logo & Desktop Theme Toggle */}
        <div className="flex items-center justify-between px-3">
          <Link href="/feed" className="group">
            <Logo size={34} showText={true} />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/feed'
                ? pathname === '/feed'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-100 text-black dark:bg-white/[0.08] dark:text-white font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white dark:bg-white dark:text-black">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Primary Post Button (Clean Solid Monochromatic Pill) */}
        <Link
          href="/post/create"
          className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-sm shadow-sm active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('post')}</span>
        </Link>
      </div>

      {/* Loading Skeleton during hydration */}
      {!isHydrated && (
        <div className="flex items-center gap-2.5 w-full p-2 rounded-2xl bg-zinc-100/60 dark:bg-white/[0.04] animate-pulse">
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3 bg-zinc-200 dark:bg-white/10 rounded w-20" />
            <div className="h-2.5 bg-zinc-200 dark:bg-white/10 rounded w-14" />
          </div>
        </div>
      )}

      {/* User Switcher Card */}
      {isHydrated && currentUser && (
        <div className="relative" ref={menuRef}>
          {accountMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-3 p-1.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/[0.1] shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('switch_account')} ({savedAccounts.length}/3)
              </div>
              <div className="flex flex-col gap-0.5 my-1">
                {displayedAccounts.map((acc) => {
                  const isCurrent = acc.id === currentUser.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        switchAccount(acc.id);
                        setAccountMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full p-2 rounded-xl text-left transition-colors ${
                        isCurrent
                          ? 'bg-zinc-100 text-black dark:bg-white/[0.08] dark:text-white'
                          : 'hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={acc.avatar}
                          alt={acc.username}
                          className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {acc.fullName}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            @{acc.username}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-zinc-200 dark:border-white/10 my-1 pt-1">
                <Link
                  href="/auth/register"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2 w-full p-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another account</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setAccountMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full p-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex items-center justify-between w-full p-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08] transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser.fullName}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  @{currentUser.username}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      )}
    </aside>
  );
};
