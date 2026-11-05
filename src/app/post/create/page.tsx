'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { Song, User } from '@/types/velo';
import { compressImage, saveMediaBlob } from '@/lib/mediaStorage';
import { AudioBadge } from '@/components/common/AudioBadge';
import { MusicSelector } from '@/components/common/MusicSelector';
import { TagSelector } from '@/components/common/TagSelector';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import {
  ArrowLeft,
  Image as ImageIcon,
  Music,
  Tag,
  Type,
  X,
  Send,
} from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { currentUser, addPost, showToast } = useVelo();

  // Form states
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<{
    url: string;
    type: 'image' | 'video';
    name?: string;
  } | null>(null);
  const [mediaOverlayText, setMediaOverlayText] = useState('');
  const [showOverlayInput, setShowOverlayInput] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | undefined>(undefined);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);

  // Modals
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isVideo = file.type.startsWith('video');

      if (isVideo) {
        const blobUrl = URL.createObjectURL(file);
        const storageKey = `vid_post_${Date.now()}`;
        saveMediaBlob(storageKey, file);

        setMediaFile({
          url: blobUrl,
          type: 'video',
          name: file.name,
        });
        showToast('Video attached successfully', 'success');
      } else {
        const compressed = await compressImage(file, 1600, 1600, 0.85);
        setMediaFile({
          url: compressed,
          type: 'image',
          name: file.name,
        });
      }
    } catch {
      showToast('Failed to load media file. Please try another.', 'error');
    }
  };

  const handleToggleTagUser = (user: User) => {
    setTaggedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) {
      showToast('Please add text or media to your post', 'error');
      return;
    }

    setIsPublishing(true);
    const mediaArray = mediaFile
      ? [
          {
            url: mediaFile.url,
            type: mediaFile.type,
            textOverlay: mediaOverlayText.trim() ? mediaOverlayText.trim() : undefined,
          },
        ]
      : undefined;

    const newPost = addPost({
      content: content.trim(),
      media: mediaArray,
      song: selectedSong,
      taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
    });

    showToast('Post published successfully', 'success');
    setIsPublishing(false);
    router.push(`/post/${newPost.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2.5 rounded-full border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              Create New Post
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Share thoughts, visual media, and soundtracks
            </p>
          </div>
        </div>

        {/* Publish Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!content.trim() && !mediaFile) || isPublishing}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs tracking-wide transition-all shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
        </button>
      </div>

      {/* Main Creation Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-zinc-950/40 backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
        {/* Author Bio Pill */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser?.avatar}
            alt={currentUser?.username}
            className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
          />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              {currentUser?.fullName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">@{currentUser?.username}</p>
          </div>
        </div>

        {/* Content Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening? Share thoughts, news, or ideas with your followers..."
          rows={4}
          className="w-full bg-transparent border-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm md:text-base resize-none focus:outline-none"
        />

        {/* Media Preview Area with Optional Text Overlay */}
        {mediaFile && (
          <div className="relative mt-2 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-zinc-950 flex items-center justify-center max-h-[520px] shadow-sm">
            {mediaFile.type === 'video' ? (
              <VideoPlayer src={mediaFile.url} className="w-full h-auto max-h-[520px] object-contain" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaFile.url}
                alt="Upload preview"
                className="w-full h-auto max-h-[520px] object-contain"
              />
            )}

            {/* Rendered Text Overlay */}
            {mediaOverlayText && (
              <div className="absolute bottom-4 left-4 right-4 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white font-semibold text-sm text-center shadow-lg animate-in fade-in">
                {mediaOverlayText}
              </div>
            )}

            {/* Remove Media Button */}
            <button
              type="button"
              onClick={() => {
                setMediaFile(null);
                setMediaOverlayText('');
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all"
              aria-label="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Overlay Input Field for Media */}
        {mediaFile && showOverlayInput && (
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex items-center gap-2">
            <Type className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <input
              type="text"
              value={mediaOverlayText}
              onChange={(e) => setMediaOverlayText(e.target.value)}
              placeholder="Type caption overlay to show across the media..."
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            {mediaOverlayText && (
              <button
                type="button"
                onClick={() => setMediaOverlayText('')}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Attached Song Badge Preview */}
        {selectedSong && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08]">
            <AudioBadge song={selectedSong} />
            <button
              type="button"
              onClick={() => setSelectedSong(undefined)}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              aria-label="Remove soundtrack"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tagged Accounts Badges */}
        {taggedUsers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-zinc-500 dark:text-zinc-400" /> Tagged:
            </span>
            {taggedUsers.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08]"
              >
                @{u.username}
                <button
                  type="button"
                  onClick={() => handleToggleTagUser(u)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Toolbar of Attachments */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Real File Upload (Photo / Video) */}
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors">
              <ImageIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Media</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
            </label>

            {/* Media Text Overlay Toggle */}
            {mediaFile && (
              <button
                type="button"
                onClick={() => setShowOverlayInput(!showOverlayInput)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                  showOverlayInput || mediaOverlayText
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white'
                    : 'bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Overlay</span>
              </button>
            )}

            {/* Attach Music Button */}
            <button
              type="button"
              onClick={() => setMusicModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                selectedSong
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white'
                  : 'bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>{selectedSong ? 'Change Song' : 'Add Music'}</span>
            </button>

            {/* Tag Friends Button */}
            <button
              type="button"
              onClick={() => setTagModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                taggedUsers.length > 0
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 dark:border-white'
                  : 'bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-zinc-200/80 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>
                {taggedUsers.length > 0 ? `Tagged (${taggedUsers.length})` : 'Tag People'}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {content.length}/500
          </span>
        </div>
      </div>

      {/* Music Selector Modal */}
      <MusicSelector
        isOpen={musicModalOpen}
        onClose={() => setMusicModalOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        currentSong={selectedSong}
      />

      {/* Tag Selector Modal */}
      <TagSelector
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        selectedUsers={taggedUsers}
        onToggleUser={handleToggleTagUser}
      />
    </div>
  );
}
