'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { QuickPostComposer } from '@/components/feed/QuickPostComposer';
import { PostCard } from '@/components/feed/PostCard';
import { Users, PlusSquare } from 'lucide-react';

export default function FeedPage() {
  const { posts, allUsers, currentUser } = useVelo();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'for_you' | 'following'>('for_you');

  // Filter non-archived posts
  const activePosts = posts.filter((p) => !p.isArchived);

  // Filter posts for "Following" tab
  const followingUserIds = allUsers
    .filter((u) => u.isFollowing)
    .map((u) => u.id);

  const displayedPosts =
    activeTab === 'for_you'
      ? activePosts
      : activePosts.filter(
          (p) => followingUserIds.includes(p.authorId) || p.authorId === currentUser?.id
        );

  return (
    <div className="w-full border-x border-zinc-200/80 dark:border-white/[0.08] min-h-screen">
      {/* Top Header with For You & Following Tabs */}
      <header className="sticky top-0 z-20 flex border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-black/75 backdrop-blur-2xl select-none">
        <button
          onClick={() => setActiveTab('for_you')}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'for_you'
              ? 'text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <span>{t('for_you')}</span>
          {activeTab === 'for_you' && (
            <span className="absolute bottom-0 left-1/3 right-1/3 h-[2.5px] bg-zinc-900 dark:bg-white rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold transition-all relative ${
            activeTab === 'following'
              ? 'text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <span>{t('following')}</span>
          {activeTab === 'following' && (
            <span className="absolute bottom-0 left-1/3 right-1/3 h-[2.5px] bg-zinc-900 dark:bg-white rounded-full" />
          )}
        </button>
      </header>

      {/* Stories Bar (At the top of feed) */}
      <StoriesBar />

      {/* Inline Quick Post Composer */}
      <QuickPostComposer />

      {/* Publications Feed */}
      <div className="divide-y divide-zinc-200/80 dark:divide-white/[0.08]">
        {displayedPosts.length === 0 ? (
          <div className="py-20 px-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <Users className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
            <p className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">
              No publications yet
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              {activeTab === 'following'
                ? "You aren't following anyone with active posts yet. Check the 'For You' tab to discover creators!"
                : 'Be the first creator to share your thoughts, soundtrack, or visual art on Velo.'}
            </p>
            <Link
              href="/post/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs tracking-wide transition-colors shadow-sm"
            >
              <PlusSquare className="w-4 h-4" />
              <span>{t('create_post')}</span>
            </Link>
          </div>
        ) : (
          displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

