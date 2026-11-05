'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, Conversation } from '@/types/velo';
import { useVelo } from '@/context/VeloContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { AudioBadge } from '@/components/common/AudioBadge';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { MediaLightboxModal } from '@/components/common/MediaLightboxModal';
import {
  Heart,
  Repeat2,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Archive,
  Check,
  Tag,
  ShieldAlert,
  Copy,
  MessageSquare,
  ExternalLink,
  Send,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  isDetailView?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, isDetailView = false }) => {
  const router = useRouter();
  const {
    currentUser,
    conversations,
    sendMessage,
    toggleLikePost,
    toggleRepostPost,
    toggleBookmarkPost,
    archivePost,
    blockUser,
    showToast,
  } = useVelo();

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [showVeloChatPicker, setShowVeloChatPicker] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const shareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
        setShowVeloChatPicker(false);
      }
    };
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shareMenuOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('video') ||
      target.closest('input')
    ) {
      return;
    }
    if (!isDetailView) {
      router.push(`/post/${post.id}`);
    }
  };

  const getPostUrl = () => {
    return typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : '';
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getPostUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Post link copied to clipboard', 'success');
    }
    setShareMenuOpen(false);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getPostUrl();
    const message = `Check out this post by @${post.author.username} on Velo:\n"${post.content.slice(0, 80)}..."\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    setShareMenuOpen(false);
  };

  const handleInstagramShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getPostUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    showToast('Post link copied! Opening Instagram to share in DM or Story', 'info');
    window.open('https://www.instagram.com', '_blank');
    setShareMenuOpen(false);
  };

  const handleSendInVeloChat = (conv: Conversation) => {
    const url = getPostUrl();
    sendMessage(conv.id, {
      text: `Shared post by @${post.author.username}:\n"${post.content.slice(0, 100)}..."\n${url}`,
      linkPreview: {
        url,
        title: `${post.author.fullName} on Velo`,
        description: post.content.slice(0, 120) || 'Check out this post on Velo',
        image: post.media?.[0]?.url,
      },
    });
    showToast(`Shared post with ${conv.customNickname || conv.participant.fullName}`, 'success');
    setShareMenuOpen(false);
    setShowVeloChatPicker(false);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archivePost(post.id);
    setMenuOpen(false);
  };

  const isOwnPost = currentUser?.id === post.author.id;

  return (
    <article
      onClick={handleCardClick}
      className={`relative px-4 py-4 md:px-6 md:py-5 border-b border-zinc-200 dark:border-white/[0.08] transition-colors ${!isDetailView ? 'cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-white/[0.02]' : ''
        }`}
    >
      <div className="flex gap-3.5">
        {/* Author Avatar */}
        <Link
          href={`/profile/${post.author.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.author.avatar}
            alt={post.author.username}
            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
          />
        </Link>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <Link
                href={`/profile/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:underline truncate"
              >
                {post.author.fullName}
              </Link>
              {post.author.isVerified && (
                <span className="w-3.5 h-3.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black inline-flex items-center justify-center text-[9px] font-bold shrink-0">
                  ✓
                </span>
              )}
              <span className="text-xs text-zinc-500 truncate">
                @{post.author.username}
              </span>
              <span className="text-zinc-400 text-xs">•</span>
              <span className="text-xs text-zinc-400">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-44 p-1.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 shadow-xl z-40 animate-in fade-in"
                >
                  <button
                    onClick={(e) => {
                      handleCopyLink(e);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Post Link</span>
                  </button>

                  {isOwnPost && (
                    <button
                      onClick={handleArchive}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-500" />
                      <span>Archive Post</span>
                    </button>
                  )}

                  {!isOwnPost && (
                    <button
                      onClick={() => {
                        blockUser(post.author.id);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Block @{post.author.username}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Minimalist Audio Badge */}
          {post.song && (
            <div className="mt-2 mb-1.5">
              <AudioBadge song={post.song} />
            </div>
          )}

          {/* Post Text */}
          <p className="mt-1.5 text-sm md:text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line break-words">
            {post.content}
          </p>

          {/* Tagged Accounts */}
          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Tag className="w-3 h-3 text-zinc-400" />
              {post.taggedUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:underline"
                >
                  @{u.username}
                </Link>
              ))}
            </div>
          )}

          {/* Attached Media with Fullscreen Lightbox on click */}
          {post.media && post.media.length > 0 && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-black">
              {post.media.map((item, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="relative w-full max-h-[560px] flex items-center justify-center overflow-hidden cursor-zoom-in group bg-black/40"
                >
                  {item.type === 'video' ? (
                    <VideoPlayer
                      src={item.url}
                      className="w-full h-auto max-h-[560px] object-contain pointer-events-none"
                      controls={false}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt="Post media"
                      className="w-full h-auto max-h-[560px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  )}

                  {item.textOverlay && (
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium text-center">
                      {item.textOverlay}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fullscreen Lightbox Modal */}
          {post.media && post.media.length > 0 && (
            <MediaLightboxModal
              media={post.media}
              initialIndex={lightboxIndex}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3.5 pt-2 max-w-md text-zinc-500 dark:text-zinc-400 select-none">
            {/* Comment */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/post/${post.id}`);
              }}
              className="flex items-center gap-1.5 group p-1 -m-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <div className="p-1 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-white/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">
                {post.commentsCount > 0 ? formatNumber(post.commentsCount) : ''}
              </span>
            </button>

            {/* Repost */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleRepostPost(post.id);
              }}
              className={`flex items-center gap-1.5 group p-1 -m-1 transition-colors ${post.isReposted ? 'text-emerald-500 font-semibold' : 'hover:text-emerald-500'
                }`}
            >
              <div className="p-1 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                <Repeat2
                  className={`w-4 h-4 transition-transform ${post.isReposted ? 'rotate-180 scale-105' : ''
                    }`}
                />
              </div>
              <span className="text-xs font-medium">
                {post.repostsCount > 0 ? formatNumber(post.repostsCount) : ''}
              </span>
            </button>

            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLikePost(post.id);
              }}
              className={`flex items-center gap-1.5 group p-1 -m-1 transition-colors ${post.isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                }`}
            >
              <div className="p-1 rounded-full group-hover:bg-rose-500/10 transition-colors">
                <Heart
                  className={`w-4 h-4 transition-all ${post.isLiked ? 'fill-rose-500 scale-105' : ''
                    }`}
                />
              </div>
              <span className="text-xs font-medium">
                {post.likesCount > 0 ? formatNumber(post.likesCount) : ''}
              </span>
            </button>

            {/* Bookmark */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmarkPost(post.id);
              }}
              className={`flex items-center gap-1.5 group p-1 -m-1 transition-colors ${post.isBookmarked ? 'text-zinc-900 dark:text-white' : 'hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              <div className="p-1 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-white/10 transition-colors">
                <Bookmark
                  className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''
                    }`}
                />
              </div>
            </button>

            {/* Share Button & Smart Dropdown */}
            <div className="relative" ref={shareRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareMenuOpen((prev) => !prev);
                  setShowVeloChatPicker(false);
                }}
                className={`flex items-center gap-1.5 group p-1 -m-1 transition-colors ${
                  shareMenuOpen
                    ? 'text-zinc-900 dark:text-white'
                    : 'hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Share options"
              >
                <div className="p-1 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-white/10 transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
              </button>

              {/* Floating Smart Share Menu */}
              {shareMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-2 w-64 p-2 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {!showVeloChatPicker ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-zinc-400">
                        Share Post
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-zinc-500" />
                        <span>Copy Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                        <span>Share via WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInstagramShare}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-pink-500" />
                        <span>Share to Instagram</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowVeloChatPicker(true)}
                        className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors border-t border-zinc-100 dark:border-white/[0.06] mt-1 pt-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <Send className="w-4 h-4 text-zinc-900 dark:text-white" />
                          <span className="font-medium">Send in Velo Chat</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">Direct</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-200/60 dark:border-white/[0.08] mb-1">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          Send to contact
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowVeloChatPicker(false)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                        >
                          Back
                        </button>
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-0.5">
                        {conversations.length === 0 ? (
                          <p className="p-3 text-center text-xs text-zinc-400">No chats found</p>
                        ) : (
                          conversations.map((conv) => (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => handleSendInVeloChat(conv)}
                              className="flex items-center gap-2.5 w-full p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={conv.participant.avatar}
                                alt={conv.participant.username}
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {conv.customNickname || conv.participant.fullName}
                                </p>
                                <p className="text-[10px] text-zinc-400 truncate">
                                  @{conv.participant.username}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
