'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/common/Logo';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  MessageCircle,
  User,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-b border-zinc-200 dark:border-white/[0.08] select-none transition-colors duration-300">
      <Link href="/feed" className="flex items-center">
        <Logo size={32} showText={true} />
      </Link>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link
          href="/settings"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { conversations, activities } = useVelo();

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadActivitiesCount = activities.filter((a) => !a.isRead).length;

  const items = [
    { href: '/feed', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/post/create', icon: PlusSquare, label: 'Create' },
    {
      href: '/activity',
      label: 'Activity',
      icon: Heart,
      badge: unreadActivitiesCount > 0 ? unreadActivitiesCount : undefined,
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageCircle,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const activeIndex = items.findIndex((item) =>
    item.href === '/feed'
      ? pathname === '/feed'
      : pathname.startsWith(item.href)
  );

  return (
    <nav className="md:hidden fixed bottom-3 left-4 right-4 z-50 select-none pb-safe pointer-events-none">
      <div className="relative pointer-events-auto grid grid-cols-6 max-w-md mx-auto p-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        {/* Hardware-accelerated sliding indicator for silky smooth 60fps translation */}
        <div
          style={{
            transform: `translate3d(${Math.max(0, activeIndex) * 100}%, 0, 0)`,
            transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
            opacity: activeIndex !== -1 ? 1 : 0,
          }}
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/6)] rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_16px_rgba(0,0,0,0.15)] dark:shadow-[0_0_18px_rgba(255,255,255,0.28)] pointer-events-none"
        />

        {items.map((item, idx) => {
          const Icon = item.icon;
          const isActive = idx === activeIndex;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative z-10 flex items-center justify-center py-2.5 rounded-full transition-colors duration-200 active:scale-90 ${
                isActive
                  ? 'text-white dark:text-black font-bold'
                  : 'text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              {item.badge && !isActive && (
                <span className="absolute top-1.5 right-2 z-20 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
