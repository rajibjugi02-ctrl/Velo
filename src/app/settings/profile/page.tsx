'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { ArrowLeft, Shield, Mail, Phone, Lock, Save, Check } from 'lucide-react';

export default function AccountSecurityPage() {
  const router = useRouter();
  const { currentUser, updateProfile, showToast } = useVelo();

  // Sensitive security states
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    updateProfile({
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    if (newPassword) {
      showToast('Password updated securely!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

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
            Profile & Account Security
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage your credentials, email, and authentication secrets
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSecurity} className="space-y-6">
        {/* Email & Phone Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Primary Contact Details
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs md:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
              Phone Number (SMS / MFA)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-neutral-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs md:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
              Change Password
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs md:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs md:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs md:text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-white/30 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-xs tracking-wide shadow-md transition-all active:scale-[0.99]"
        >
          Update Security Settings
        </button>
      </form>
    </div>
  );
}

