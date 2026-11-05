'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Song } from '@/types/velo';
import { searchSongs, TRENDING_CATALOG_SONGS } from '@/lib/itunesApi';
import { AudioTrimmerModal } from './AudioTrimmerModal';
import {
  Music,
  Search,
  Upload,
  Play,
  Pause,
  Scissors,
  Check,
  X,
  Volume2,
} from 'lucide-react';

interface MusicSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: Song) => void;
  currentSong?: Song;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({
  isOpen,
  onClose,
  onSelectSong,
  currentSong,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload'>('catalog');
  const [query, setQuery] = useState('');
  const [catalogSongs, setCatalogSongs] = useState<Song[]>(TRENDING_CATALOG_SONGS);
  const [searching, setSearching] = useState(false);
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [trimmingSong, setTrimmingSong] = useState<Song | null>(null);

  // Custom MP3 trimmer states
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('My Custom Track');
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimDuration, setTrimDuration] = useState<number>(20); // 15-30s
  const [isTrimmingPlaying, setIsTrimmingPlaying] = useState<boolean>(false);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  // Search iTunes API
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (activeTab === 'catalog') {
        setSearching(true);
        const results = await searchSongs(query);
        setCatalogSongs(results);
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Clean audio on close
  useEffect(() => {
    if (!isOpen) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (customAudioRef.current) {
        customAudioRef.current.pause();
        customAudioRef.current = null;
      }
      setPreviewingSongId(null);
      setIsTrimmingPlaying(false);
    }
  }, [isOpen]);

  const handleTogglePreview = (song: Song) => {
    if (previewingSongId === song.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        setPreviewingSongId(null);
      }
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    if (song.previewUrl) {
      const audio = new Audio(song.previewUrl);
      previewAudioRef.current = audio;
      audio.play().then(() => setPreviewingSongId(song.id)).catch(() => setPreviewingSongId(null));
      audio.onended = () => setPreviewingSongId(null);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCustomAudioUrl(objectUrl);
    setCustomAudioName(file.name.replace(/\.[^/.]+$/, ''));

    // Probe duration and launch trimmer
    const tempAudio = new Audio(objectUrl);
    tempAudio.onloadedmetadata = () => {
      const dur = Math.max(15, Math.round(tempAudio.duration) || 30);
      setCustomDuration(dur);
      setTrimStart(0);

      const customSong: Song = {
        id: `custom_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Custom Upload',
        previewUrl: objectUrl,
        isCustom: true,
        duration: 15,
        fullDuration: dur,
        startTime: 0,
        endTime: 15,
      };
      setTrimmingSong(customSong);
    };
  };

  const toggleCustomPlay = () => {
    if (!customAudioUrl) return;

    if (isTrimmingPlaying) {
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
      setIsTrimmingPlaying(false);
      return;
    }

    if (customAudioRef.current) {
      customAudioRef.current.pause();
    }

    const audio = new Audio(customAudioUrl);
    customAudioRef.current = audio;
    audio.currentTime = trimStart;

    audio.play().then(() => {
      setIsTrimmingPlaying(true);

      // Auto-stop after trimDuration
      const timer = setTimeout(() => {
        if (customAudioRef.current === audio) {
          audio.pause();
          setIsTrimmingPlaying(false);
        }
      }, trimDuration * 1000);

      audio.onended = () => {
        clearTimeout(timer);
        setIsTrimmingPlaying(false);
      };
    });
  };

  const confirmCustomSong = () => {
    if (!customAudioUrl) return;

    const newSong: Song = {
      id: `custom_${Date.now()}`,
      title: customAudioName,
      artist: 'Custom Upload',
      previewUrl: customAudioUrl,
      isCustom: true,
      startTime: trimStart,
      endTime: trimStart + trimDuration,
      duration: trimDuration,
      fullDuration: customDuration,
    };

    setTrimmingSong(newSong);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[560px] max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Soundtrack & Audio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Switcher */}
        <div className="flex p-2 gap-2 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'catalog'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              }`}
          >
            Song Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'upload'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              }`}
          >
            Upload & Trim MP3
          </button>
        </div>

        {/* Catalog Tab Content */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            {/* Search Box */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs or artists in iTunes catalog..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
            </div>

            {/* Song Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  Searching soundtrack catalog...
                </div>
              ) : catalogSongs.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  No songs found. Try a different artist or keyword.
                </div>
              ) : (
                catalogSongs.map((song) => {
                  const isPreviewing = previewingSongId === song.id;
                  const isSelected = currentSong?.id === song.id;

                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${isSelected
                        ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-300 dark:border-white/20'
                        : 'bg-zinc-50/50 dark:bg-white/[0.02] border-zinc-200/80 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePreview(song)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPreviewing
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                            : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-white hover:bg-zinc-300 dark:hover:bg-white/20'
                            }`}
                        >
                          {isPreviewing ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        {/* Song Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      {/* Select Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setTrimmingSong(song);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${isSelected
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                          : 'bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-200'
                          }`}
                      >
                        {isSelected ? 'Selected' : 'Use Song'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Upload & Trim MP3 Tab Content */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            {!customAudioUrl ? (
              <label className="flex-1 border-2 border-dashed border-zinc-200 dark:border-white/15 hover:border-zinc-400 dark:hover:border-white/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 text-zinc-600 dark:text-zinc-300 mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Upload MP3 (Full Song)
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                  Select an audio file from your device to trim
                </p>
                <input
                  type="file"
                  accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a"
                  onChange={handleCustomFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Music className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {customAudioName}
                    </span>
                  </div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer shrink-0">
                    Change File
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Trimmer UI ("Pilih Part" 15-30s) */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      Trim Part ({trimDuration}s Segment)
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Start: {trimStart}s / {customDuration}s
                    </span>
                  </div>

                  {/* Start time slider */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Audio Start Position:
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, customDuration - trimDuration)}
                      value={trimStart}
                      onChange={(e) => setTrimStart(Number(e.target.value))}
                      className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
                    />
                  </div>

                  {/* Duration toggle (15s vs 20s vs 30s) */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Duration:</span>
                    {[15, 20, 30].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setTrimDuration(dur)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${trimDuration === dur
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                          : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/20'
                          }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>

                  {/* Audition Play button */}
                  <button
                    type="button"
                    onClick={toggleCustomPlay}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-900 dark:text-white text-xs font-semibold transition-colors mt-2"
                  >
                    {isTrimmingPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Stop Segment Preview</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Preview Trimmed Audio</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={confirmCustomSong}
                  className="w-full py-3 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs tracking-wide transition-all shadow-sm"
                >
                  Confirm & Use Soundtrack
                </button>
              </div>
            )}
          </div>
        )}
        {/* Trimmer Modal */}
        {trimmingSong && (
          <AudioTrimmerModal
            isOpen={Boolean(trimmingSong)}
            song={trimmingSong}
            onClose={() => setTrimmingSong(null)}
            onConfirm={(finalTrimmed) => {
              onSelectSong(finalTrimmed);
              setTrimmingSong(null);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
