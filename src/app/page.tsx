'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';

export default function RootPage() {
  const router = useRouter();
  const { currentUser, isHydrated } = useVelo();

  useEffect(() => {
    if (!isHydrated) return;

    if (currentUser) {
      // Jika akun sudah dibuat & login, langsung arahkan ke halaman profil akun pengguna tersebut
      router.replace(`/profile/${currentUser.username}`);
    } else {
      // Jika belum login / pertama kali membuka website, langsung arahkan ke tampilan login
      router.replace('/auth/login');
    }
  }, [currentUser, isHydrated, router]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white select-none">
      <div className="w-7 h-7 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
    </div>
  );
}
