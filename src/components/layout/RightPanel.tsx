'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { Search, TrendingUp, UserCheck, UserPlus } from 'lucide-react';

export const RightPanel: React.FC = () => {
  const router = useRouter();
  const { allUsers, currentUser, toggleFollowUser } = useVelo();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const trendingTopics = [
    { tag: 'VeloLaunch', posts: '42.8K' },
    { tag: 'NoirMinimalism', posts: '28.4K' },
    { tag: 'SpatialAudio', posts: '15.2K' },
    { tag: 'Tokyo35mm', posts: '9.6K' },
    { tag: 'NextJS15', posts: '34.1K' },
  ];

  const suggestedUsers = allUsers
    .filter((u) => u.id !== currentUser?.id)
    .slice(0, 3);

  return (
    <aside className="hidden lg:flex flex-col gap-5 w-80 xl:w-96 2xl:w-[420px] h-full overflow-y-auto shrink-0 px-4 py-6 border-l border-zinc-200 dark:border-white/[0.08] bg-white/75 dark:bg-black/75 backdrop-blur-2xl select-none transition-colors duration-300">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-transparent focus:border-zinc-300 dark:focus:border-white/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-xs focus:outline-none transition-all"
        />
      </form>

      {/* Trending Hashtags Card */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3 px-1">
          <TrendingUp className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {t('trending')}
          </h3>
        </div>
        <div className="flex flex-col gap-1">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.tag}
              href={`/explore?q=${encodeURIComponent('#' + topic.tag)}`}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  #{topic.tag}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {topic.posts} posts
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Who to Follow Card */}
      {suggestedUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 px-1">
            {t('who_to_follow')}
          </h3>
          <div className="flex flex-col gap-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2 p-1">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2.5 min-w-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => toggleFollowUser(user.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 ${
                    user.isFollowing
                      ? 'border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t('following_btn')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{t('follow')}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-2 text-[11px] text-zinc-400 dark:text-zinc-600 flex flex-wrap gap-x-3 gap-y-1">
        <span>Terms</span>
        <span>Privacy</span>
        <span>Cookies</span>
        <span>© 2026 Velo Inc.</span>
      </div>
    </aside>
  );
};
