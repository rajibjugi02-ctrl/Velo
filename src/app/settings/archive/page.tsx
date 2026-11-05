'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import {
  ArrowLeft,
  Archive,
  RefreshCw,
  Trash2,
  Heart,
  Repeat2,
  Eye,
  Film,
  Layers,
} from 'lucide-react';

function ArchiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'stories' ? 'stories' : 'posts';
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>(initialTab);

  const {
    archivedPosts,
    restoreArchivedPost,
    deletePostPermanently,
    archivedStories,
    restoreArchivedStory,
    deleteArchivedStoryPermanently,
    showToast,
  } = useVelo();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'stories' || tabParam === 'posts') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'posts' | 'stories') => {
    setActiveTab(tab);
    router.replace(`/settings/archive?tab=${tab}`);
  };

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="p-2.5 rounded-full border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
            Archive Vault
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Unified archive for hidden feed posts and expired 24-hour visual stories
          </p>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] mb-6">
        <button
          type="button"
          onClick={() => handleTabChange('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'posts'
              ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-white/10'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Posts Archive</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
            {archivedPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('stories')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'stories'
              ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-white/10'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Stories Archive</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
            {archivedStories.length}
          </span>
        </button>
      </div>

      {/* Posts Archive Section */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {archivedPosts.length === 0 ? (
            <div className="py-20 text-center text-xs text-zinc-500 dark:text-zinc-400 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-8 bg-zinc-50/50 dark:bg-transparent">
              <Archive className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                No archived posts
              </p>
              <p className="mt-1 max-w-sm mx-auto">
                Posts you choose to archive from your profile feed will appear here safely.
              </p>
            </div>
          ) : (
            archivedPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  <span>Archived • {formatTimeAgo(post.createdAt)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] text-[10px] font-bold">
                    Archived Post
                  </span>
                </div>

                <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-3 whitespace-pre-line">
                  {post.content}
                </p>

                {post.media && post.media.length > 0 && (
                  <div className="rounded-2xl overflow-hidden max-h-56 mb-3 border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.media[0].url}
                      alt="Archived media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Bottom stats and action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/[0.05]">
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {formatNumber(post.likesCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3.5 h-3.5" />
                      {formatNumber(post.repostsCount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        restoreArchivedPost(post.id);
                        showToast('Post restored to public feed', 'success');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restore to Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deletePostPermanently(post.id);
                        showToast('Post deleted permanently', 'info');
                      }}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stories Archive Section */}
      {activeTab === 'stories' && (
        <div>
          {archivedStories.length === 0 ? (
            <div className="py-20 text-center text-xs text-zinc-500 dark:text-zinc-400 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-8 bg-zinc-50/50 dark:bg-transparent">
              <Archive className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                No archived stories
              </p>
              <p className="mt-1 max-w-sm mx-auto">
                Stories that expire after 24 hours or that you archive will safely remain in this vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {archivedStories.map((story) => (
                <div
                  key={story.id}
                  className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-zinc-900 shadow-sm flex flex-col justify-between p-3 group"
                >
                  {/* Background image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.mediaUrl}
                    alt="Archived story"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                  {/* Top: Viewers info */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] text-white">
                    <span className="flex items-center gap-1 font-semibold">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      {story.viewers.length} views
                    </span>
                    <span className="text-[10px] text-white/70">
                      {formatTimeAgo(story.createdAt)}
                    </span>
                  </div>

                  {/* Text overlay preview */}
                  {story.textOverlay && (
                    <div className="relative z-10 px-2 py-1 rounded-xl bg-black/60 text-white text-[11px] text-center font-medium line-clamp-2">
                      {story.textOverlay.text}
                    </div>
                  )}

                  {/* Bottom: Action buttons (Restore or Delete) */}
                  <div className="relative z-10 flex items-center justify-between gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        restoreArchivedStory(story.id);
                        showToast('Story restored to active status', 'success');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold backdrop-blur-md transition-colors"
                      title="Restore to Active Stories"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deleteArchivedStoryPermanently(story.id);
                        showToast('Story deleted permanently', 'info');
                      }}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white text-[11px] backdrop-blur-md transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center text-xs text-zinc-500">
          Loading archive vault...
        </div>
      }
    >
      <ArchiveContent />
    </Suspense>
  );
}

