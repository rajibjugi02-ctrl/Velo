'use client';

import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { generateInitialsAvatar } from '@/lib/utils';
import { User } from '@/types/velo';

interface GoogleLoginButtonProps {
  isSwitch?: boolean;
}

function RealGoogleButton({ isSwitch }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { login, addAccount, showToast } = useVelo();
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await res.json();

        // Ekstraksi data profil Google asli
        const cleanUsername = (profile.email?.split('@')[0] || 'google_user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');

        const googleUser: User = {
          id: `usr_g_${profile.sub}`,
          username: cleanUsername,
          fullName: profile.name || 'Google User',
          email: profile.email || `${cleanUsername}@gmail.com`,
          avatar: profile.picture || generateInitialsAvatar(profile.name || 'Google User'),
          banner: '',
          bannerType: 'image',
          bio: 'Verified Google Creator on Velo',
          links: [],
          followersCount: 0,
          followingCount: 0,
          onlineStatus: 'online',
          createdAt: new Date().toISOString(),
        };

        if (isSwitch) {
          addAccount(googleUser);
        } else {
          login(googleUser);
        }

        showToast(`Welcome, ${googleUser.fullName}!`, 'success');
        router.push(`/profile/${googleUser.username}`);
      } catch (err) {
        showToast('Gagal memuat data akun Google', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      showToast('Login Google dibatalkan atau terjadi kendala', 'error');
    },
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-white font-semibold text-xs sm:text-sm border border-zinc-200 dark:border-white/10 shadow-sm transition-all mb-4 disabled:opacity-50 active:scale-[0.99]"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{isLoading ? 'Menghubungkan ke Google...' : 'Continue with Google'}</span>
    </button>
  );
}

function FallbackGoogleButton({ isSwitch }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { login, addAccount, showToast } = useVelo();

  const handleDemoGoogle = () => {
    const googleUser: User = {
      id: 'usr_google_demo',
      username: 'jordan_google',
      fullName: 'Jordan Creator',
      email: 'jordan@gmail.com',
      avatar: generateInitialsAvatar('Jordan Creator'),
      banner: '',
      bannerType: 'image',
      bio: 'Demo Google Profile • Masukkan NEXT_PUBLIC_GOOGLE_CLIENT_ID untuk Google OAuth Asli',
      links: [],
      followersCount: 0,
      followingCount: 0,
      onlineStatus: 'online',
      createdAt: new Date().toISOString(),
    };

    if (isSwitch) {
      addAccount(googleUser);
    } else {
      login(googleUser);
    }
    showToast('Masuk dengan Demo Google. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID untuk OAuth asli.', 'info');
    router.push(`/profile/${googleUser.username}`);
  };

  return (
    <button
      type="button"
      onClick={handleDemoGoogle}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-white font-semibold text-xs sm:text-sm border border-zinc-200 dark:border-white/10 shadow-sm transition-all mb-4 active:scale-[0.99]"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ isSwitch = false }) => {
  const hasClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  if (hasClientId) {
    return <RealGoogleButton isSwitch={isSwitch} />;
  }

  return <FallbackGoogleButton isSwitch={isSwitch} />;
};

