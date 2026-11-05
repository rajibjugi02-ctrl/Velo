'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { Logo } from '@/components/common/Logo';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { generateInitialsAvatar } from '@/lib/utils';
import { User, Lock, ArrowRight } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillUsername = searchParams.get('username') || '';
  const isSwitch = searchParams.get('switch') === 'true';

  const { currentUser, isHydrated, allUsers, login, addAccount, showToast } = useVelo();

  const [usernameOrEmail, setUsernameOrEmail] = useState(prefillUsername);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Jika sudah login dan bukan sedang switch account, langsung bawa ke profil akunnya
  useEffect(() => {
    if (isHydrated && currentUser && !isSwitch) {
      router.replace(`/profile/${currentUser.username}`);
    }
  }, [currentUser, isHydrated, isSwitch, router]);

  useEffect(() => {
    if (prefillUsername) {
      setUsernameOrEmail(prefillUsername);
    }
  }, [prefillUsername]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      showToast('Please enter your username or email', 'error');
      return;
    }

    setIsLoading(true);

    const cleanQuery = usernameOrEmail.trim().toLowerCase();
    let target = allUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanQuery ||
        u.email.toLowerCase() === cleanQuery
    );

    if (!target) {
      const pendingUsers = JSON.parse(localStorage.getItem('velo_pending_users') || '[]');
      target = pendingUsers.find(
        (u: any) =>
          u.username.toLowerCase() === cleanQuery ||
          u.email.toLowerCase() === cleanQuery
      );
    }

    if (!target) {
      const cleanName = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);
      target = {
        id: `usr_${Date.now()}`,
        username: cleanQuery.replace(/[^a-z0-9_]/g, '') || 'velo_user',
        fullName: cleanName,
        email: `${cleanQuery}@velo.app`,
        avatar: generateInitialsAvatar(cleanName),
        banner: '',
        bannerType: 'image' as const,
        bio: '',
        links: [],
        followersCount: 0,
        followingCount: 0,
        onlineStatus: 'online' as const,
        createdAt: new Date().toISOString(),
      };
    }

    if (isSwitch) {
      const added = addAccount(target);
      if (added) {
        router.push(`/profile/${target.username}`);
      }
    } else {
      login(target);
      router.push(`/profile/${target.username}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <Logo size={56} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          Welcome to Velo
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Sign in to continue to your spatial feed & chats
        </p>
      </div>

      <GoogleLoginButton isSwitch={isSwitch} />

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/10" />
        <span className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
          Or with credentials
        </span>
        <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/10" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Username or Email
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Username or email"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-2xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
        >
          <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center mt-5 pt-4 border-t border-zinc-200 dark:border-white/10">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account yet?{' '}
          <Link
            href={isSwitch ? '/auth/register?switch=true' : '/auth/register'}
            className="text-zinc-900 dark:text-white hover:underline font-semibold"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-black text-zinc-900 dark:text-zinc-100 relative overflow-hidden select-none transition-colors duration-300">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-zinc-200/60 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-zinc-300/40 dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-zinc-400 text-xs">Loading login...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
