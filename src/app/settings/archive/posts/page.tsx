'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyPostsArchiveRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/archive?tab=posts');
  }, [router]);

  return (
    <div className="py-20 text-center text-xs text-zinc-500">
      Redirecting to Archive Vault...
    </div>
  );
}
