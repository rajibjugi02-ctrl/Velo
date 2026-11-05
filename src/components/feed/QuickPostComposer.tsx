'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { Image as ImageIcon, Smile, X, Loader2 } from 'lucide-react';

const COMMON_EMOJIS = [
  '✨', '🔥', '🖤', '🎧', '☕', '🚀', '💫', '🌙',
  '⚡', '🌊', '📸', '👾', '👏', '🤍', '😊', '🎉',
  '💡', '💎', '🎨', '🪐', '👀', '🌿', '🔮', '🎙️'
];

export const QuickPostComposer: React.FC = () => {
  const { currentUser, addPost, showToast } = useVelo();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!currentUser) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-adjust height up to max
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const removePhoto = () => {
    setImagePreview(null);
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed && !imagePreview) return;

    setIsPosting(true);
    try {
      addPost({
        content: trimmed,
        media: imagePreview
          ? [{ url: imagePreview, type: 'image' }]
          : undefined,
      });

      setContent('');
      setImagePreview(null);
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      showToast('Post published successfully!', 'success');
    } catch {
      showToast('Failed to publish post', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = (content.trim().length > 0 || imagePreview !== null) && !isPosting;

  return (
    <div className="w-full px-4 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-transparent select-none">
      <div className="flex gap-3.5">
        {/* User Avatar */}
        <Link
          href={`/profile/${currentUser.username}`}
          className="shrink-0 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              currentUser.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
            }
            alt={currentUser.username}
            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10 group-hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Input & Action Area */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="What's happening in Velo?"
            rows={1}
            className="w-full bg-transparent resize-none border-0 text-sm sm:text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 px-0 py-1 transition-all"
          />

          {/* Uploaded Photo Preview */}
          {imagePreview && (
            <div className="relative mt-2 mb-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 max-h-72 w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-72 w-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                aria-label="Remove photo"
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-black text-white shadow-md transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Popover */}
          {showEmojiPicker && (
            <div className="relative mb-3 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-xl max-w-xs animate-in fade-in">
              <div className="grid grid-cols-8 gap-1.5 text-lg">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Toolbar & Action Button */}
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add photo"
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors active:scale-95"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add emoji"
                className={`p-2 rounded-xl transition-colors active:scale-95 ${
                  showEmojiPicker
                    ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Post Capsule Button */}
            <button
              type="button"
              onClick={handlePost}
              disabled={!canPost}
              className={`px-5 py-1.5 rounded-full font-semibold text-xs sm:text-sm tracking-wide transition-all active:scale-95 ${
                canPost
                  ? 'bg-zinc-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-sm cursor-pointer'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-white/10 dark:text-zinc-600 cursor-not-allowed opacity-60'
              }`}
            >
              {isPosting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </div>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

