'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { Song, User } from '@/types/velo';
import { compressImage, saveMediaBlob } from '@/lib/mediaStorage';
import { MusicSelector } from '@/components/common/MusicSelector';
import { TagSelector } from '@/components/common/TagSelector';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import {
  ArrowLeft,
  Image,
  Music,
  Tag,
  Type,
  X,
  Send,
  Move,
} from 'lucide-react';

export default function CreateStoryPage() {
  const router = useRouter();
  const { currentUser, addStory, showToast } = useVelo();

  // Media file state
  const [mediaFile, setMediaFile] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>({
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    type: 'image',
  });
  const [isLandscape, setIsLandscape] = useState(false);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');

  // Interactive Text Overlay state (Instagram style)
  const [overlayText, setOverlayText] = useState('Golden Hour Reflections');
  const [overlayColor, setOverlayColor] = useState('#ffffff');
  const [overlayBgColor, setOverlayBgColor] = useState('#000000');
  const [overlayBgStyle, setOverlayBgStyle] = useState<'transparent' | 'semi' | 'solid'>('semi');
  const [overlayPosX, setOverlayPosX] = useState(50);
  const [overlayPosY, setOverlayPosY] = useState(45);
  const [overlayFontSize, setOverlayFontSize] = useState(18);
  const [overlayFont, setOverlayFont] = useState<'modern' | 'serif' | 'neon' | 'bold'>('modern');

  // Music & Tag states
  const [selectedSong, setSelectedSong] = useState<Song | undefined>(undefined);
  const [taggedUsers, setTaggedUsers] = useState<User[]>([]);

  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Dragging interaction state on canvas
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isVideo = file.type.startsWith('video');

      if (isVideo) {
        // Blob URL for zero overhead video playback
        const blobUrl = URL.createObjectURL(file);
        const storageKey = `vid_story_${Date.now()}`;
        saveMediaBlob(storageKey, file);

        // Detect video aspect ratio
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.src = blobUrl;
        v.onloadedmetadata = () => {
          const landscape = v.videoWidth > v.videoHeight;
          setIsLandscape(landscape);
          setFitMode(landscape ? 'fit' : 'fill');
        };

        setMediaFile({
          url: blobUrl,
          type: 'video',
        });
        showToast('Video attached successfully', 'success');
      } else {
        const compressed = await compressImage(file, 1440, 1440, 0.85);
        const img = new (window as any).Image();
        img.onload = () => {
          const landscape = img.naturalWidth > img.naturalHeight;
          setIsLandscape(landscape);
          setFitMode(landscape ? 'fit' : 'fill');
        };
        img.src = compressed;

        setMediaFile({
          url: compressed,
          type: 'image',
        });
      }
    } catch {
      showToast('Could not load media file', 'error');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(90, Math.max(10, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(90, Math.max(10, ((e.clientY - rect.top) / rect.height) * 100));
    setOverlayPosX(Math.round(x));
    setOverlayPosY(Math.round(y));
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(90, Math.max(10, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(90, Math.max(10, ((touch.clientY - rect.top) / rect.height) * 100));
    setOverlayPosX(Math.round(x));
    setOverlayPosY(Math.round(y));
  };

  const handleToggleTagUser = (user: User) => {
    setTaggedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handlePublish = () => {
    if (!mediaFile) {
      showToast('Please upload an image or video first', 'error');
      return;
    }

    const story = addStory({
      mediaUrl: mediaFile.url,
      mediaType: mediaFile.type,
      textOverlay: overlayText.trim()
        ? {
            text: overlayText.trim(),
            color: overlayColor,
            bgColor: overlayBgColor,
            bgStyle: overlayBgStyle,
            positionX: overlayPosX,
            positionY: overlayPosY,
            fontSize: overlayFontSize,
            fontStyle: overlayFont,
          }
        : undefined,
      song: selectedSong,
      taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
    });

    router.push(`/story/${story.id}`);
  };

  const colorOptions = ['#ffffff', '#000000', '#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#34d399'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Create Story
            </h1>
            <p className="text-xs text-zinc-500">
              Interactive 24-hour visual moment with drag & drop text
            </p>
          </div>
        </div>

        <button
          onClick={handlePublish}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish Story</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Drag-and-Drop Canvas */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={() => setIsDragging(false)}
            className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] rounded-[36px] overflow-hidden bg-black border-2 border-zinc-800 shadow-2xl flex flex-col justify-between select-none"
          >
            {/* Ambient Blurred Background for Landscape */}
            {mediaFile && isLandscape && fitMode === 'fit' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45 blur-2xl scale-125">
                {mediaFile.type === 'video' ? (
                  <video
                    src={mediaFile.url}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaFile.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            {/* Background Media */}
            {mediaFile ? (
              <div className="absolute inset-0 flex items-center justify-center p-2">
                {mediaFile.type === 'video' ? (
                  <VideoPlayer
                    src={mediaFile.url}
                    className={`w-full pointer-events-none ${
                      isLandscape && fitMode === 'fit'
                        ? 'h-auto max-h-[85%] object-contain rounded-2xl shadow-2xl'
                        : 'h-full object-cover'
                    }`}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaFile.url}
                    alt="Story preview"
                    className={`w-full pointer-events-none ${
                      isLandscape && fitMode === 'fit'
                        ? 'h-auto max-h-[85%] object-contain rounded-2xl shadow-2xl'
                        : 'h-full object-cover'
                    }`}
                  />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                Upload media
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

            {/* Top Bar Preview */}
            <div className="relative z-10 p-3.5 flex flex-col gap-2">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-white rounded-full" />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/30"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate drop-shadow">
                      {currentUser?.username}
                    </p>
                    {selectedSong && (
                      <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 truncate mt-1 max-w-[200px]">
                        <Music className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{selectedSong.title} • {selectedSong.artist}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSong(undefined);
                          }}
                          className="p-0.5 hover:bg-white/20 rounded-full text-zinc-300 hover:text-white transition-colors shrink-0"
                          title="Hapus lagu (gunakan audio asli video)"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Draggable Text Element */}
            {overlayText && (
              <div
                style={{
                  top: `${overlayPosY}%`,
                  left: `${overlayPosX}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                className={`absolute z-20 cursor-grab active:cursor-grabbing max-w-[85%] text-center transition-shadow ${
                  isDragging ? 'ring-2 ring-white/50 rounded-2xl' : ''
                }`}
              >
                <div
                  style={{
                    color: overlayColor,
                    fontSize: `${overlayFontSize}px`,
                    backgroundColor:
                      overlayBgStyle === 'solid'
                        ? overlayBgColor
                        : overlayBgStyle === 'transparent'
                        ? 'transparent'
                        : 'rgba(0, 0, 0, 0.6)',
                  }}
                  className={`px-3.5 py-1.5 rounded-2xl ${
                    overlayBgStyle !== 'transparent' ? 'backdrop-blur-md shadow-lg' : ''
                  } font-semibold break-words leading-tight`}
                >
                  {overlayText}
                </div>
              </div>
            )}

            {/* Bottom Tagged Accounts */}
            <div className="relative z-10 p-3 flex items-center justify-between">
              {taggedUsers.length > 0 && (
                <div className="flex items-center gap-1">
                  {taggedUsers.slice(0, 2).map((u) => (
                    <span
                      key={u.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md border border-white/20"
                    >
                      @{u.username}
                    </span>
                  ))}
                  {taggedUsers.length > 2 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/70 text-white">
                      +{taggedUsers.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
            <Move className="w-3 h-3" />
            Drag the text overlay to position it freely on the canvas
          </p>
        </div>

        {/* Right Column: Creative Controls */}
        <div className="md:col-span-6 flex flex-col gap-4">
          {/* Media File Picker */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08]">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Story Media
            </h3>
            <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
              <Image className="w-4 h-4" />
              <span>Choose Photo or Video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
            </label>

            {/* Landscape vs Fill toggle when landscape media is active */}
            {isLandscape && (
              <div className="flex items-center justify-between mt-3 p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Orientation</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFitMode('fit')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      fitMode === 'fit'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                        : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Landscape (Fit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitMode('fill')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      fitMode === 'fill'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                        : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Fill
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Text Overlay Editor */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Text & Typography
            </h3>

            <input
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Type your story message..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />

            {/* Background Style Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Backdrop:</span>
              {(['transparent', 'semi', 'solid'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setOverlayBgStyle(style)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    overlayBgStyle === style
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold'
                      : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Font Size Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Font Size</span>
                <span>{overlayFontSize}px</span>
              </div>
              <input
                type="range"
                min={14}
                max={36}
                value={overlayFontSize}
                onChange={(e) => setOverlayFontSize(Number(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
            </div>

            {/* Color Palette */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-zinc-500">Text Color:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setOverlayColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border border-black/20 ${
                      overlayColor === c ? 'ring-2 ring-zinc-400 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Soundtrack Row */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Soundtrack
              </h3>
              {selectedSong ? (
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedSong.title} • {selectedSong.artist}
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  {mediaFile?.type === 'video'
                    ? 'Audio asli video aktif (tanpa lagu latar)'
                    : 'Tidak ada musik dipilih'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedSong && (
                <button
                  type="button"
                  onClick={() => setSelectedSong(undefined)}
                  title="Hapus lagu & aktifkan audio video asli"
                  className="p-1.5 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMusicModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/15"
              >
                {selectedSong ? 'Ganti Lagu' : 'Tambah Musik'}
              </button>
            </div>
          </div>

          {/* Tag People Row */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Tagged Friends
              </h3>
              <p className="text-xs text-zinc-400">
                {taggedUsers.length > 0 ? `${taggedUsers.length} people tagged` : 'None tagged'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTagModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/15 shrink-0"
            >
              Tag People
            </button>
          </div>
        </div>
      </div>

      <MusicSelector
        isOpen={musicModalOpen}
        onClose={() => setMusicModalOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        currentSong={selectedSong}
      />

      <TagSelector
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        selectedUsers={taggedUsers}
        onToggleUser={handleToggleTagUser}
      />
    </div>
  );
}
