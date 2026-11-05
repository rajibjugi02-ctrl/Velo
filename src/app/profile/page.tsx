'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';

export default function CurrentUserProfilePage() {
  const router = useRouter();
  const { currentUser, isHydrated } = useVelo();

  useEffect(() => {
    if (!isHydrated) return;
    if (currentUser) {
      router.replace(`/profile/${currentUser.username}`);
    } else {
      router.replace('/auth/login');
    }
  }, [currentUser, isHydrated, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-neutral-400 text-xs">
      Loading your profile...
    </div>
  );
}

