'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { PostCard } from '@/components/feed/PostCard';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { Comment } from '@/types/velo';
import { ArrowLeft, Send, Heart, Reply, X } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { posts, comments, addComment, toggleLikeComment, currentUser } = useVelo();

  // Root reply states
  const [rootReplyText, setRootReplyText] = useState('');

  // Nested inline reply state: stores which comment id is currently being replied to
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [activeReplyUsername, setActiveReplyUsername] = useState<string>('');
  const [nestedReplyText, setNestedReplyText] = useState('');

  const post = posts.find((p) => p.id === postId);
  const postComments = comments[postId] || [];

  if (!post) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Post Not Found</h2>
        <p className="text-sm text-zinc-500 mb-6">
          This post might have been removed or archived.
        </p>
        <button
          onClick={() => router.push('/feed')}
          className="px-5 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs"
        >
          Return to Home Feed
        </button>
      </div>
    );
  }

  const handleSendRootReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootReplyText.trim()) return;

    addComment(post.id, rootReplyText.trim());
    setRootReplyText('');
  };

  const handleSendNestedReply = (parentId: string, targetUsername: string) => {
    if (!nestedReplyText.trim()) return;

    addComment(post.id, nestedReplyText.trim(), parentId, targetUsername);
    setNestedReplyText('');
    setActiveReplyCommentId(null);
  };

  const renderCommentTree = (comment: Comment, isNested = false) => {
    const isReplyingToThis = activeReplyCommentId === comment.id;

    return (
      <div
        key={comment.id}
        className={`${isNested ? 'border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 sm:ml-5 pl-3 sm:pl-4 mt-3' : 'py-4'}`}
      >
        <div className="flex gap-3">
          <Link href={`/profile/${comment.author.username}`} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.author.avatar}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${comment.author.username}`}
                className="font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                {comment.author.fullName}
              </Link>
              <span className="text-[11px] text-zinc-400">
                @{comment.author.username}
              </span>
              <span className="text-zinc-400 text-[11px]">•</span>
              <span className="text-[11px] text-zinc-400">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Replying tag if nested */}
            {comment.replyToUsername && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Replying to <span className="font-semibold text-zinc-700 dark:text-zinc-300">@{comment.replyToUsername}</span>
              </p>
            )}

            <p className="mt-1 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
              {comment.content}
            </p>

            {/* Action Bar */}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => toggleLikeComment(post.id, comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${comment.isLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-rose-500' : ''}`} />
                <span>{comment.likesCount > 0 ? formatNumber(comment.likesCount) : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isReplyingToThis) {
                    setActiveReplyCommentId(null);
                  } else {
                    setActiveReplyCommentId(comment.id);
                    setActiveReplyUsername(comment.author.username);
                    setNestedReplyText(`@${comment.author.username} `);
                  }
                }}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>

            {/* Inline Nested Reply Form */}
            {isReplyingToThis && (
              <div className="mt-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                  <span>Replying to @{activeReplyUsername}</span>
                  <button
                    type="button"
                    onClick={() => setActiveReplyCommentId(null)}
                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nestedReplyText}
                    onChange={(e) => setNestedReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSendNestedReply(comment.id, activeReplyUsername)}
                    disabled={!nestedReplyText.trim()}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Render Nested Children Replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-1">
                {comment.replies.map((reply) => renderCommentTree(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Detail Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.08]">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Post Details
        </h1>
      </div>

      {/* Main Post Card */}
      <PostCard post={post} isDetailView={true} />

      {/* Reply Input Box for Top-Level Reply */}
      <div className="px-4 py-4 md:px-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser?.avatar}
            alt={currentUser?.username}
            className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
          />

          <form onSubmit={handleSendRootReply} className="flex-1 min-w-0">
            <textarea
              value={rootReplyText}
              onChange={(e) => setRootReplyText(e.target.value)}
              placeholder="Post your reply..."
              rows={2}
              className="w-full bg-transparent border-0 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none"
            />

            <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-white/5">
              <button
                type="submit"
                disabled={!rootReplyText.trim()}
                className="px-4 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Reply</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Utas Komentar Bersarang (Nested Comment Threads) */}
      <div className="px-4 md:px-6 divide-y divide-zinc-200 dark:divide-white/[0.08]">
        {postComments.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs">
            No replies yet. Be the first to join the conversation.
          </div>
        ) : (
          postComments.map((comment) => renderCommentTree(comment, false))
        )}
      </div>
    </div>
  );
}
