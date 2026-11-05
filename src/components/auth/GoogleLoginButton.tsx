'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { generateInitialsAvatar } from '@/lib/utils';
import { User } from '@/types/velo';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

interface GoogleLoginButtonProps {
  isSwitch?: boolean;
}

// Google Official SVG Icon
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
  );
}

function RealGoogleButton({ isSwitch }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { login, addAccount, showToast } = useVelo();
  const [isVerifying, setIsVerifying] = useState(false);

  // Safety timeout to guarantee the UI never gets stuck in verifying state
  useEffect(() => {
    if (!isVerifying) return;
    const timeout = setTimeout(() => {
      setIsVerifying(false);
      showToast('Login verification timed out. Please try again.', 'error');
    }, 14000);
    return () => clearTimeout(timeout);
  }, [isVerifying, showToast]);

  const handleOAuthSuccess = async (tokenResponse: any) => {
    try {
      setIsVerifying(true);
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve Google userinfo');
      }

      const profile = await res.json();
      const rawPrefix = profile.email?.split('@')[0] || 'google_user';
      const cleanUsername = rawPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'velo_user';

      const googleUser: User = {
        id: `usr_g_${profile.sub}`,
        username: cleanUsername,
        fullName: profile.name || 'Google User',
        email: profile.email || `${cleanUsername}@gmail.com`,
        avatar: profile.picture || generateInitialsAvatar(profile.name || 'Google User'),
        banner: '',
        bannerType: 'image',
        bio: 'Verified Creator on Velo',
        links: [],
        followersCount: 0,
        followingCount: 0,
        onlineStatus: 'online',
        createdAt: new Date().toISOString(),
      };

      // Persist to central server database immediately
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleUser),
        });
      } catch {}

      if (isSwitch) {
        addAccount(googleUser);
      } else {
        login(googleUser);
      }

      showToast(`Welcome, ${googleUser.fullName}!`, 'success');
      setIsVerifying(false);

      // Safe navigation to home or profile
      router.replace('/');
    } catch {
      setIsVerifying(false);
      showToast('Gagal memproses data akun Google', 'error');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleOAuthSuccess,
    onError: (error) => {
      console.error('Google Sign-In Error:', error);
      setIsVerifying(false);
      showToast('Google Sign-In dibatalkan atau diblokir pop-up', 'error');
    },
    flow: 'implicit',
  });

  const handleStartGoogleLogin = () => {
    if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
      showToast('Mengalihkan ke localhost:3000 untuk Google OAuth...', 'info');
      window.location.href = window.location.href.replace('127.0.0.1', 'localhost');
      return;
    }
    setIsVerifying(true);
    loginWithGoogle();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleStartGoogleLogin}
        disabled={isVerifying}
        className="w-full max-w-full h-12 px-4 py-3 rounded-xl flex items-center justify-center gap-3 text-sm sm:text-base font-medium transition-all active:scale-[0.98] bg-white hover:bg-zinc-50 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm disabled:opacity-60 mb-4 select-none cursor-pointer"
      >
        <GoogleIcon />
        <span className="whitespace-nowrap truncate font-semibold">
          {isVerifying ? 'Connecting to Google...' : 'Continue with Google'}
        </span>
      </button>

      {/* Dark Spatial Loading Overlay to prevent blank white screens */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in select-none">
          <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl max-w-xs text-center">
            <Logo size={48} />
            <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying Google Account...</span>
            </div>
            <p className="text-xs text-zinc-500">
              Please wait while we hydrate your Velo session
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function FallbackGoogleButton({ isSwitch }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { login, addAccount, showToast } = useVelo();

  const handleDemoGoogle = () => {
    const googleUser: User = {
      id: 'usr_g_demo',
      username: 'google_creator',
      fullName: 'Google Creator',
      email: 'creator@gmail.com',
      avatar: generateInitialsAvatar('Google Creator'),
      banner: '',
      bannerType: 'image',
      bio: 'Verified Google Profile',
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
    showToast('Masuk dengan Akun Google Demo. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID untuk OAuth asli.', 'info');
    router.replace('/');
  };

  return (
    <button
      type="button"
      onClick={handleDemoGoogle}
      className="w-full max-w-full h-12 px-4 py-3 rounded-xl flex items-center justify-center gap-3 text-sm sm:text-base font-medium transition-all active:scale-[0.98] bg-white hover:bg-zinc-50 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm mb-4 select-none cursor-pointer"
    >
      <GoogleIcon />
      <span className="whitespace-nowrap truncate font-semibold">
        Continue with Google
      </span>
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
