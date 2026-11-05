'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { useLanguage } from '@/context/LanguageContext';
import { User } from '@/types/velo';
import { PostCard } from '@/components/feed/PostCard';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { formatJoinedDate, generateInitialsAvatar } from '@/lib/utils';
import { getMediaBlob } from '@/lib/mediaStorage';
import {
  ArrowLeft,
  Link as LinkIcon,
  UserCheck,
  UserPlus,
  Send,
  Edit3,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const {
    allUsers,
    currentUser,
    savedAccounts,
    posts,
    comments,
    toggleFollowUser,
    isProcessingFollow,
    followingIds,
    followersIds,
    isHydrated,
  } = useVelo();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'links'>('posts');
  const [resolvedVideoBanner, setResolvedVideoBanner] = useState<string | null>(null);
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const decodedUsername = (username ? decodeURIComponent(username) : '').toLowerCase();

  // Prefer current session for own profile for instant real-time count updates
  let profileUser = (currentUser && currentUser.username.toLowerCase() === decodedUsername)
    ? currentUser
    : allUsers.find((u) => u.username.toLowerCase() === decodedUsername);

  if (!profileUser && savedAccounts) {
    profileUser = savedAccounts.find((u) => u.username.toLowerCase() === decodedUsername);
  }

  if (!profileUser && typeof window !== 'undefined') {
    try {
      const pending = JSON.parse(localStorage.getItem('velo_pending_users') || '[]');
      const foundPending = pending.find((u: any) => u.username?.toLowerCase() === decodedUsername);
      if (foundPending) profileUser = foundPending;
    } catch { }
    if (!profileUser) {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('velo_all_users') || '[]');
        const foundStored = storedUsers.find((u: any) => u.username?.toLowerCase() === decodedUsername);
        if (foundStored) profileUser = foundStored;
      } catch { }
    }
  }

  // Cross-Device Server Lookup: Query central backend API if user not yet in local cache
  useEffect(() => {
    if (profileUser || serverUser || !decodedUsername) return;

    let isMounted = true;
    setIsSearchingServer(true);

    fetch(`/api/users?q=${encodeURIComponent(decodedUsername)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success && json.users && Array.isArray(json.users)) {
          const match = json.users.find(
            (u: any) => u.username?.toLowerCase() === decodedUsername
          );
          if (match) {
            setServerUser(match);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsSearchingServer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [decodedUsername, profileUser, serverUser]);

  const activeProfile = profileUser || serverUser;

  // Rule 6: Rehydrate video banner from IndexedDB Blob across page reloads
  useEffect(() => {
    let activeBlobUrl = '';
    if (activeProfile?.bannerType === 'video' && activeProfile?.banner) {
      if (activeProfile.banner.startsWith('http') || activeProfile.banner.startsWith('data:')) {
        setResolvedVideoBanner(activeProfile.banner);
      } else {
        const idbKey = activeProfile.banner.startsWith('idb:')
          ? activeProfile.banner.replace('idb:', '')
          : `user_banner_video_${activeProfile.id}`;

        getMediaBlob(idbKey).then((blob) => {
          if (blob && blob instanceof Blob) {
            activeBlobUrl = URL.createObjectURL(blob);
            setResolvedVideoBanner(activeBlobUrl);
          } else if (typeof blob === 'string') {
            setResolvedVideoBanner(blob);
          }
        });
      }
    }

    return () => {
      if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
    };
  }, [activeProfile?.id, activeProfile?.banner, activeProfile?.bannerType]);

  if (!isHydrated || isSearchingServer) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-xs text-zinc-500 gap-3 select-none">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
        <span className="text-zinc-400 font-medium">Loading @{username}...</span>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="w-full px-4 py-16 text-center select-none">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Account Not Found</h2>
        <p className="text-sm text-zinc-500 mb-6">
          The user @{username} does not exist or has been modified.
        </p>
        <button
          onClick={() => router.push('/feed')}
          className="px-5 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs transition-transform active:scale-95"
        >
          Return Home
        </button>
      </div>
    );
  }

  profileUser = activeProfile;

  const isOwnProfile = currentUser?.id === profileUser.id;

  const userPosts = posts.filter((p) => p.authorId === profileUser.id && !p.isArchived);
  const userMediaPosts = userPosts.filter((p) => p.media && p.media.length > 0);

  const userReplies: Array<{ comment: any; post: any }> = [];
  Object.entries(comments).forEach(([postId, postComments]) => {
    const parentPost = posts.find((p) => p.id === postId);
    postComments.forEach((c) => {
      if (c.author.id === profileUser.id && parentPost) {
        userReplies.push({ comment: c, post: parentPost });
      }
    });
  });

  return (
    <div className="w-full min-h-screen">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.08]">
        {/* Back button only appears when stalking / viewing other users' profiles */}
        {!isOwnProfile && (
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
            {profileUser.fullName}
          </h1>
          <p className="text-xs text-zinc-500">{userPosts.length} posts</p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 bg-zinc-900 dark:bg-zinc-950 overflow-hidden">
        {profileUser.banner ? (
          profileUser.bannerType === 'video' ? (
            <VideoPlayer
              src={resolvedVideoBanner || profileUser.banner}
              className="w-full h-full object-cover"
              autoPlay={true}
              loop={true}
              muted={true}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileUser.banner}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-zinc-900 dark:bg-black border-b border-zinc-200 dark:border-white/[0.08]" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 pb-4 border-b border-zinc-200 dark:border-white/[0.08]">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileUser.avatar || generateInitialsAvatar(profileUser.fullName)}
              alt={profileUser.username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-black shadow-lg bg-zinc-100 dark:bg-zinc-900"
            />
            {profileUser.onlineStatus === 'online' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-100 font-semibold text-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t('edit_profile')}</span>
              </Link>
            ) : (
              <>
                {((followingIds.includes(profileUser.id) && followersIds.includes(profileUser.id)) || profileUser.isMutual) ? (
                  <button
                    onClick={() => router.push(`/messages?user=${profileUser.id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('chat_btn')}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/messages?user=${profileUser.id}`)}
                    className="p-2 rounded-full border border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-zinc-100 transition-colors active:scale-95"
                    title="Direct Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  disabled={isProcessingFollow(profileUser.id)}
                  onClick={() => toggleFollowUser(profileUser.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    isProcessingFollow(profileUser.id) ? 'opacity-60 cursor-not-allowed' : ''
                  } ${profileUser.isFollowing || followingIds.includes(profileUser.id)
                      ? 'border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                    }`}
                >
                  {profileUser.isFollowing || followingIds.includes(profileUser.id) ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t('following_btn')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{followersIds.includes(profileUser.id) ? t('follow_back') : t('follow')}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name & Username */}
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {profileUser.fullName}
            </h2>
            {profileUser.isVerified && (
              <span className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black inline-flex items-center justify-center text-[10px] font-bold">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">@{profileUser.username}</p>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">
            {profileUser.bio}
          </p>
        )}

        {/* Dynamic Joined Date */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formatJoinedDate(profileUser.createdAt)}</span>
        </div>

        {/* Links */}
        {profileUser.links && profileUser.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profileUser.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:underline"
              >
                <LinkIcon className="w-3 h-3 text-zinc-500" />
                <span>{link.label || link.url}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        )}

        {/* Follow Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>
            <b className="text-zinc-900 dark:text-zinc-100 font-bold mr-1">
              {profileUser.followingCount}
            </b>
            Following
          </span>
          <span>
            <b className="text-zinc-900 dark:text-zinc-100 font-bold mr-1">
              {profileUser.followersCount}
            </b>
            Followers
          </span>
        </div>
      </div>

      {/* 4 Tabs: Posts, Replies, Media, Links */}
      <div className="flex border-b border-zinc-200 dark:border-white/[0.08]">
        {(['posts', 'replies', 'media', 'links'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold capitalize transition-all relative ${activeTab === tab
                ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-zinc-900 dark:bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'posts' && (
          <div>
            {userPosts.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No publications yet
              </div>
            ) : (
              userPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {activeTab === 'replies' && (
          <div className="divide-y divide-zinc-200 dark:divide-white/[0.08]">
            {userReplies.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No replies or comments yet
              </div>
            ) : (
              userReplies.map(({ comment, post }, idx) => (
                <div key={idx} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="text-xs text-zinc-400 mb-1">
                    Replied to a post by <b className="text-zinc-800 dark:text-zinc-200">@{post.author.username}</b>
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-4">
            {userMediaPosts.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No photos or videos posted yet
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userMediaPosts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/post/${p.id}`}
                    className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-black relative group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.media![0].url}
                      alt="Media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="p-4 space-y-2.5">
            {(!profileUser.links || profileUser.links.length === 0) ? (
              <div className="py-16 text-center text-xs text-zinc-400">
                No external links configured
              </div>
            ) : (
              profileUser.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {link.label || 'Website'}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {link.url}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0" />
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
