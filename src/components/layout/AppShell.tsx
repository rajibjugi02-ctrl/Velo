'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { MobileHeader, MobileBottomNav } from './MobileNavigation';
import { ToastContainer } from '@/components/common/Toast';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isHydrated } = useVelo();

  const isAuthPage = pathname.startsWith('/auth');
  const isStoryViewer = pathname.startsWith('/story/') && !pathname.includes('create');
  const isMessagesPage = pathname.startsWith('/messages');
  const isFullWidthPage =
    isMessagesPage ||
    pathname.startsWith('/post/create') ||
    pathname.startsWith('/story/create') ||
    pathname.startsWith('/settings');

  // Proteksi rute: jika belum login dan bukan di halaman auth, arahkan langsung ke halaman login
  useEffect(() => {
    if (!isHydrated) return;
    if (!currentUser && !isAuthPage) {
      router.replace('/auth/login');
    }
  }, [currentUser, isHydrated, isAuthPage, router]);

  // Tampilkan splash minimal saat menunggu hidrasi autentikasi
  if (!isHydrated) {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
      </main>
    );
  }

  // Jika belum login dan sedang diarahkan ke login, tahan render agar tidak bocor
  if (!currentUser && !isAuthPage) {
    return (
      <main className="w-full h-full min-h-screen flex items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
      </main>
    );
  }

  if (isAuthPage || isStoryViewer) {
    return (
      <main className="w-full h-full min-h-screen overflow-y-auto bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        {children}
        <ToastContainer />
      </main>
    );
  }

  return (
    <div className="w-full h-[100dvh] md:h-screen overflow-hidden bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <div className="flex w-full h-full overflow-hidden">
        {/* Desktop Left Navigation (Locked Viewport) */}
        <LeftSidebar />

        {/* Center Main Content Area (Independent Internal Scroll) */}
        <div
          className={`flex-1 min-w-0 flex flex-col h-full border-r border-zinc-200 dark:border-white/[0.08] ${
            isMessagesPage ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {/* Only render generic mobile header on pages other than Messages */}
          {!isMessagesPage && <MobileHeader />}

          {/* Main content viewport: messages page uses zero bottom padding to pin input bar */}
          <main
            className={`flex-1 min-w-0 ${
              isMessagesPage ? 'h-full overflow-hidden pb-0' : 'pb-24 md:pb-8'
            }`}
          >
            {children}
          </main>
        </div>

        {/* Desktop Right Panel (Locked Viewport) */}
        {!isFullWidthPage && <RightPanel />}
      </div>

      {/* Mobile Floating Bottom Bar - hidden on Messages page to avoid blocking chat input */}
      {!isMessagesPage && <MobileBottomNav />}

      {/* Floating Glass Toast Container */}
      <ToastContainer />
    </div>
  );
};
