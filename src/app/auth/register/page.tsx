'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { Logo } from '@/components/common/Logo';
import { generateInitialsAvatar } from '@/lib/utils';
import { Mail, User, Lock, ArrowRight } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSwitch = searchParams.get('switch') === 'true';

  const { registerUser, showToast } = useVelo();

  // Form states: Email, Username, Nama Lengkap, Password
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !username || !fullName || !password) {
      showToast('Please fill in all registration fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsSubmitting(true);

    const newUser = {
      id: `usr_${Date.now()}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: email.trim(),
      avatar: generateInitialsAvatar(fullName.trim()),
      banner: '',
      bannerType: 'image' as const,
      bio: '',
      links: [],
      followersCount: 0,
      followingCount: 0,
      onlineStatus: 'online' as const,
      createdAt: new Date().toISOString(),
    };

    const existingPending = JSON.parse(localStorage.getItem('velo_pending_users') || '[]');
    existingPending.push(newUser);
    localStorage.setItem('velo_pending_users', JSON.stringify(existingPending));

    // Clear following & followers for this new account
    localStorage.setItem(`velo_following_${newUser.id}`, JSON.stringify([]));
    localStorage.setItem(`velo_followers_${newUser.id}`, JSON.stringify([]));

    // Register user permanently into allUsers state and persistent storage
    registerUser(newUser);

    const existingAll = JSON.parse(localStorage.getItem('velo_all_users') || '[]');
    if (!existingAll.some((u: any) => u.username?.toLowerCase() === newUser.username)) {
      existingAll.push(newUser);
      localStorage.setItem('velo_all_users', JSON.stringify(existingAll));
    }

    setIsSubmitting(false);
    showToast('Registration successful! Please log in with your credentials.', 'success');

    // Rule: "Setelah berhasil daftar, arahkan (redirect) pengguna langsung ke Form Login (bukan langsung masuk beranda)"
    const nextUrl = isSwitch ? `/auth/login?switch=true&username=${encodeURIComponent(username.trim())}` : `/auth/login?username=${encodeURIComponent(username.trim())}`;
    router.push(nextUrl);
  };

  return (
    <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <Logo size={56} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          Join Velo
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Experience fluid, spatial social connection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Elena Rostova"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
          disabled={isSubmitting}
          className="w-full py-3 rounded-2xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
        >
          <span>Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-zinc-200 dark:border-white/10">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            href={isSwitch ? '/auth/login?switch=true' : '/auth/login'}
            className="text-zinc-900 dark:text-white hover:underline font-semibold ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] dark:bg-black text-zinc-900 dark:text-zinc-100 relative overflow-hidden select-none transition-colors duration-300">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-200/60 dark:bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-300/40 dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-zinc-400 text-xs">Loading registration...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
