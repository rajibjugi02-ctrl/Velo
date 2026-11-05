'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { PostCard } from '@/components/feed/PostCard';
import { ArrowLeft, Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  const router = useRouter();
  const { posts, isHydrated } = useVelo();

  // All active posts bookmarked by user
  const bookmarkedPosts = posts.filter((p) => p.isBookmarked && !p.isArchived);

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.08] transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
              Bookmarks
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {bookmarkedPosts.length} saved {bookmarkedPosts.length === 1 ? 'publication' : 'publications'}
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
          <Bookmark className="w-4 h-4 fill-current" />
        </div>
      </div>

      {/* Bookmarked Feed or Empty State */}
      {!isHydrated ? (
        <div className="py-24 text-center text-xs text-zinc-400">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin mx-auto mb-2" />
          Loading your bookmarks...
        </div>
      ) : bookmarkedPosts.length === 0 ? (
        <div className="py-28 px-4 text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center mx-auto mb-3.5 text-zinc-400 dark:text-zinc-500 shadow-sm">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            No bookmarks yet
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
            When you see something inspiring, insightful, or worth revisiting, tap the bookmark ribbon icon on any post to save it here.
          </p>
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="px-5 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all"
          >
            Explore Publications
          </button>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-white/[0.08]">
          {bookmarkedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

