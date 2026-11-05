'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatTimeAgo } from '@/lib/utils';
import {
  Heart,
  Repeat2,
  MessageCircle,
  Tag,
  UserPlus,
  UserCheck,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function ActivityPage() {
  const router = useRouter();
  const {
    activities,
    allUsers,
    currentUser,
    toggleFollowUser,
    isProcessingFollow,
    markActivityAsRead,
    markAllActivitiesAsRead,
    followersIds,
    followingIds,
  } = useVelo();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'interactions' | 'connections'>('interactions');

  // Automatically mark all activities as read when visiting the activity center
  useEffect(() => {
    markAllActivitiesAsRead();
  }, [markAllActivitiesAsRead]);

  // Tab 1: Clean Interactions only (Likes, Reposts, Comments, Replies, Tags - NO follow spam)
  const interactionActivities = activities.filter((a) => a.type !== 'follow');

  // Tab 2: Follows & Connections - strictly genuine creators who follow the active user
  const followersList = React.useMemo(() => {
    const list: typeof allUsers = [];
    const seen = new Set<string>();

    // 1. From confirmed followersIds
    (followersIds || []).forEach((fId) => {
      const found = allUsers.find((u) => u.id === fId);
      if (found && !seen.has(found.id)) {
        seen.add(found.id);
        list.push(found);
      }
    });

    // 2. Guarantee inclusion of actors from incoming follow notifications
    activities.forEach((act) => {
      if (act.type === 'follow' && act.recipientId === currentUser?.id && act.actor) {
        if (!seen.has(act.actor.id)) {
          seen.add(act.actor.id);
          const fromAll = allUsers.find((u) => u.id === act.actor.id);
          list.push(fromAll || act.actor);
        }
      }
    });

    return list;
  }, [allUsers, followersIds, activities, currentUser?.id]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />;
      case 'repost':
        return <Repeat2 className="w-4 h-4 text-emerald-400" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-sky-400" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-purple-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-sky-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-sky-400" />;
    }
  };

  const getActivityDescription = (activity: typeof activities[0]) => {
    switch (activity.type) {
      case 'like':
        return 'liked your post';
      case 'repost':
        return 'reposted your publication';
      case 'comment':
        return `commented: "${activity.commentText || ''}"`;
      case 'reply':
        return `replied to your comment: "${activity.commentText || ''}"`;
      case 'tag':
        return 'tagged you in a publication or story';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with your content';
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Page Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-white/80 dark:bg-black/70 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/10 transition-colors">
        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-3">
          {t('activity')}
        </h1>

        {/* 2 Main Tabs: Interactions vs Follows & Connections */}
        <div className="flex p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 transition-colors">
          <button
            onClick={() => setActiveTab('interactions')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'interactions'
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
          >
            {t('interactions')} ({interactionActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'connections'
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
          >
            {t('follows_connections')} {followersList.length > 0 ? `(${followersList.length})` : ''}
          </button>
        </div>
      </div>

      {/* Tab 1: Combined Interactions Feed */}
      {activeTab === 'interactions' && (
        <div className="divide-y divide-zinc-200 dark:divide-white/10">
          {interactionActivities.length === 0 ? (
            <div className="py-24 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                No activity yet
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                When people interact with your posts, replies, or tag you, it will show up here.
              </p>
            </div>
          ) : (
            interactionActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  markActivityAsRead(act.id);
                  if (act.targetPostId) {
                    router.push(`/post/${act.targetPostId}`);
                  } else if (act.type === 'follow') {
                    router.push(`/profile/${act.actor.username}`);
                  }
                }}
                className={`p-4 md:px-6 md:py-4 flex items-start gap-3.5 cursor-pointer transition-colors ${!act.isRead
                    ? 'bg-sky-500/[0.04] hover:bg-sky-500/[0.08]'
                    : 'hover:bg-white/[0.02]'
                  }`}
              >
                {/* Activity icon bubble */}
                <div className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  {getActivityIcon(act.type)}
                </div>

                {/* Actor Avatar */}
                <Link
                  href={`/profile/${act.actor.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={act.actor.avatar}
                    alt={act.actor.username}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                </Link>

                {/* Content description */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-zinc-600 dark:text-neutral-300 leading-snug">
                    <Link
                      href={`/profile/${act.actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-zinc-900 dark:text-white hover:underline mr-1"
                    >
                      {act.actor.fullName}
                    </Link>
                    <span>{getActivityDescription(act)}</span>
                  </div>

                  <span className="text-[11px] text-zinc-400 dark:text-neutral-500 mt-1 inline-block">
                    {formatTimeAgo(act.createdAt)}
                  </span>
                </div>

                {/* Mutual Chat Action Button if connected */}
                {((followingIds.includes(act.actor.id) && followersIds.includes(act.actor.id)) || act.actor.isMutual) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/messages?user=${act.actor.id}`);
                    }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500/25 border border-sky-400/30 text-xs font-semibold shrink-0 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('chat_btn')}</span>
                  </button>
                )}

                {!act.isRead && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Follows & Connections (with Follow Back & Mutual Chat Shortcut) */}
      {activeTab === 'connections' && (
        <div className="divide-y divide-zinc-200 dark:divide-white/10">
          <div className="p-4 bg-sky-500/5 border-b border-sky-400/10 text-xs text-sky-500 dark:text-sky-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Mutual connections enable instant, high-speed direct messaging in Velo.
            </span>
          </div>

          {followersList.length === 0 ? (
            <div className="py-24 px-4 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center mx-auto mb-3.5 text-zinc-400 dark:text-zinc-500 shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                No followers yet
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
                When other creators follow your profile, their accounts and mutual connection shortcuts will appear here in real time.
              </p>
              <button
                type="button"
                onClick={() => router.push('/explore')}
                className="px-5 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all"
              >
                Find Creators to Follow
              </button>
            </div>
          ) : (
            followersList.map((user) => {
              const isFollowingUser = followingIds.includes(user.id) || !!user.isFollowing;
              const isFollowerOfUser = followersIds.includes(user.id);
              const isMutual = (isFollowingUser && isFollowerOfUser) || !!user.isMutual;

              return (
                <div
                  key={user.id}
                  className="p-4 md:px-6 md:py-4 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 min-w-0 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-white/10 group-hover:border-sky-400 transition-colors shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate leading-tight">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400 truncate">
                        @{user.username}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-neutral-500 truncate max-w-xs mt-0.5">
                        {user.bio}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mutual Follow Chat Shortcut button (as specified in prompt) */}
                    {isMutual && (
                      <button
                        onClick={() => router.push(`/messages?user=${user.id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-semibold shadow-sm transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('chat_btn')}</span>
                      </button>
                    )}

                    {/* Follow Back / Following Button with In-Flight Lock */}
                    <button
                      disabled={isProcessingFollow(user.id)}
                      onClick={() => toggleFollowUser(user.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                        isProcessingFollow(user.id) ? 'opacity-60 cursor-not-allowed' : ''
                      } ${isFollowingUser
                          ? 'bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-neutral-300 hover:bg-rose-500/20 hover:text-rose-500 border border-transparent dark:border-white/10'
                          : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm'
                        }`}
                    >
                      {isFollowingUser ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                          <span>{t('following_btn')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{t('follow_back')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

