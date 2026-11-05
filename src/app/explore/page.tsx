'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { PostCard } from '@/components/feed/PostCard';
import { User } from '@/types/velo';
import { Search, TrendingUp, UserCheck, UserPlus, X, Hash } from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { allUsers, posts, currentUser, toggleFollowUser } = useVelo();
  const { t } = useLanguage();

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'top' | 'people' | 'posts' | 'tags'>('top');
  const [serverUsers, setServerUsers] = useState<User[]>([]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const cleanQuery = query.toLowerCase().replace('#', '').trim();

  // Query server database in real-time for cross-device discovery
  useEffect(() => {
    if (!cleanQuery) {
      setServerUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/users?q=${encodeURIComponent(cleanQuery)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.users && Array.isArray(json.users)) {
            setServerUsers(json.users);
          }
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [cleanQuery]);

  // Combine local and remote server users seamlessly
  const combinedUsers = useMemo(() => {
    const map = new Map<string, User>();
    allUsers.forEach((u) => map.set(u.id, u));
    serverUsers.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [allUsers, serverUsers]);

  const matchedUsers = combinedUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(cleanQuery) ||
      u.username.toLowerCase().includes(cleanQuery) ||
      u.bio.toLowerCase().includes(cleanQuery)
  );

  const matchedPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(cleanQuery) ||
      p.author.fullName.toLowerCase().includes(cleanQuery) ||
      p.author.username.toLowerCase().includes(cleanQuery)
  );

  const trendingTags = [
    { tag: 'VeloLaunch', count: '42.8K' },
    { tag: 'iOSGlassmorphism', count: '28.4K' },
    { tag: 'SpatialAudio', count: '15.2K' },
    { tag: 'Tokyo35mm', count: '9.6K' },
    { tag: 'WebDev2026', count: '34.1K' },
    { tag: 'ModularSynth', count: '12.3K' },
  ];

  return (
    <div className="w-full min-h-screen">
      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-white/80 dark:bg-black/75 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/[0.08]">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, creators, or #hashtags..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex p-1 bg-zinc-100 dark:bg-white/[0.04] rounded-full border border-zinc-200 dark:border-white/[0.08]">
          {(['top', 'people', 'posts', 'tags'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-white/10'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!query && (
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Trending Topics on Velo</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {trendingTags.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => setQuery('#' + item.tag)}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-zinc-200/80 dark:border-white/[0.05] text-left transition-colors"
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    #{item.tag}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {item.count} publications
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'top' || activeTab === 'people') && matchedUsers.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 px-1">
              People
            </h3>
            <div className="rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] divide-y divide-zinc-100 dark:divide-white/[0.04] overflow-hidden shadow-sm">
              {matchedUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </Link>

                  {user.id !== currentUser?.id && (
                    <button
                      onClick={() => toggleFollowUser(user.id)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        user.isFollowing
                          ? 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500'
                          : 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                      }`}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'top' || activeTab === 'posts') && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 px-1">
              Publications
            </h3>
            {matchedPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                No publications matched your search query.
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-200 dark:border-white/[0.08] divide-y divide-zinc-200 dark:divide-white/[0.08] overflow-hidden bg-white dark:bg-zinc-950/40 shadow-sm">
                {matchedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading explore feed...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
