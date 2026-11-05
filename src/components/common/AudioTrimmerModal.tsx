'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song } from '@/types/velo';
import { ArrowLeft, Sliders, Play, Pause } from 'lucide-react';

interface AudioTrimmerModalProps {
  isOpen: boolean;
  song: Song;
  onClose: () => void;
  onConfirm: (trimmedSong: Song) => void;
}

export const AudioTrimmerModal: React.FC<AudioTrimmerModalProps> = ({
  isOpen,
  song,
  onClose,
  onConfirm,
}) => {
  // Read real track duration or probe from file
  const [totalTrackDuration, setTotalTrackDuration] = useState<number>(() => {
    if (song.fullDuration && song.fullDuration > 0) {
      return Math.round(song.fullDuration);
    }
    return Math.max(30, Math.round(song.duration || 30));
  });

  useEffect(() => {
    if (song.fullDuration && song.fullDuration > 0) {
      setTotalTrackDuration(Math.round(song.fullDuration));
    }
  }, [song.fullDuration]);

  // Selected clip duration: minimum 15s, maximum 30s
  const [clipDuration, setClipDuration] = useState<number>(() => {
    if (song.duration && song.duration >= 15 && song.duration <= 30) {
      return song.duration;
    }
    return 15;
  });

  const maxStart = Math.max(0, totalTrackDuration - clipDuration);
  const [startTime, setStartTime] = useState<number>(() => {
    return Math.min(song.startTime || 0, maxStart);
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Decorative waveform dynamic visual
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      const sinVal = Math.sin((i / count) * Math.PI * 3);
      const cosVal = Math.cos((i / count) * Math.PI * 5);
      const height = Math.max(20, Math.round(42 + sinVal * 28 + cosVal * 18));
      bars.push(height);
    }
    return bars;
  }, []);

  // Probe audio metadata for custom or catalog tracks
  useEffect(() => {
    if (!isOpen || !song.previewUrl) return;

    const audio = new Audio(song.previewUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        const probed = Math.round(audio.duration);
        setTotalTrackDuration((prev) => Math.max(prev, probed));
      }
    };

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    const handleTimeUpdate = () => {
      // Loop seamlessly within selected trim window
      if (audio.currentTime >= startTime + clipDuration) {
        audio.currentTime = startTime;
        audio.play().catch(() => { });
      }
    };

    const handleEnded = () => {
      audio.currentTime = startTime;
      audio.play().catch(() => { });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [isOpen, song.previewUrl, startTime, clipDuration]);

  // Handle duration change (quick buttons or manual slider)
  const handleDurationChange = (newDur: number) => {
    const clamped = Math.min(30, Math.max(15, Math.min(newDur, totalTrackDuration)));
    setClipDuration(clamped);

    const newMaxStart = Math.max(0, totalTrackDuration - clamped);
    if (startTime > newMaxStart) {
      setStartTime(newMaxStart);
      if (audioRef.current) {
        audioRef.current.currentTime = newMaxStart;
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = startTime;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setStartTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleFinish = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onConfirm({
      ...song,
      startTime,
      duration: clipDuration,
      endTime: startTime + clipDuration,
    });
  };

  if (!isOpen) return null;

  const startPercent = (startTime / totalTrackDuration) * 100;
  const windowPercent = (clipDuration / totalTrackDuration) * 100;
  const endPercent = Math.min(100, startPercent + windowPercent);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 text-white border border-white/10 rounded-[32px] sm:rounded-[36px] shadow-2xl flex flex-col p-5 sm:p-6 my-auto max-h-[90dvh] overflow-y-auto pb-8 box-border">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Pilih Bagian Lagu (IG Style)
            </h3>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-1.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs tracking-wide shadow-sm hover:shadow transition-all active:scale-95"
          >
            Selesai
          </button>
        </div>

        {/* Center: Vinyl Disc with Album Art */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* Outer vinyl disc */}
            <div
              className={`w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-xl flex items-center justify-center overflow-hidden ${isPlaying ? 'animate-[spin_7s_linear_infinite]' : ''
                }`}
              style={{
                backgroundImage:
                  'radial-gradient(circle, #18181b 35%, #27272a 40%, #18181b 45%, #27272a 55%, #18181b 60%)',
              }}
            >
              {/* Inner album cover */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-zinc-700/80 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    song.albumArt ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800" />
              </div>
            </div>
          </div>

          {/* Song Info */}
          <h4 className="text-base sm:text-lg font-bold text-white mt-3 text-center line-clamp-1">
            {song.title}
          </h4>
          <p className="text-xs text-zinc-400 text-center line-clamp-1 mt-0.5">
            {song.artist}
          </p>

          {/* Duration Selector: Preset Toggle + Fine Manual Slider (15-30s) */}
          <div className="w-full mt-4 flex flex-col items-center gap-2.5">
            <div className="inline-flex items-center gap-2 p-1 rounded-full bg-zinc-900/90 border border-white/10 px-3 py-1">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">
                Durasi Cerita:
              </span>
              <button
                type="button"
                onClick={() => handleDurationChange(15)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${clipDuration === 15
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                15 Detik
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange(30)}
                disabled={totalTrackDuration < 30}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${clipDuration === 30
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white disabled:opacity-40'
                  }`}
              >
                30 Detik
              </button>
            </div>

            {/* Fine Duration Slider (15s to 30s) */}
            <div className="w-full max-w-[260px] flex items-center justify-between gap-2.5 px-2">
              <span className="text-[10px] text-zinc-400 font-mono">15s</span>
              <input
                type="range"
                min={15}
                max={Math.min(30, totalTrackDuration)}
                step={1}
                value={clipDuration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] text-white font-bold font-mono">
                {clipDuration}s
              </span>
            </div>
          </div>
        </div>

        {/* Waveform & Scrubber Card */}
        <div className="rounded-3xl bg-zinc-900/80 border border-white/[0.08] p-4 flex flex-col gap-3 my-2 shadow-inner">
          {/* Waveform Bars */}
          <div className="h-16 flex items-center justify-between gap-[3px] px-2">
            {waveformBars.map((height, idx) => {
              const barPercent = (idx / waveformBars.length) * 100;
              const isInWindow =
                barPercent >= startPercent && barPercent <= endPercent;

              return (
                <div
                  key={idx}
                  style={{ height: `${height}%` }}
                  className={`flex-1 rounded-full transition-colors duration-150 ${isInWindow
                      ? 'bg-white opacity-95'
                      : 'bg-zinc-700/50 opacity-40'
                    }`}
                />
              );
            })}
          </div>

          {/* Scrubber Range Input */}
          <div className="relative px-1">
            <input
              type="range"
              min={0}
              max={maxStart}
              step={1}
              value={startTime}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
            />
          </div>

          {/* Timestamp Indicators */}
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <span className="text-white font-semibold">
              Mulai: {formatSec(startTime)}
            </span>
            <span className="text-zinc-300">
              Selesai: {formatSec(startTime + clipDuration)}
            </span>
            <span className="text-zinc-400">
              Total: {formatSec(totalTrackDuration)}
            </span>
          </div>
        </div>

        {/* Circular Play / Pause Button with generous spacing */}
        <div className="flex justify-center mt-3 pt-1 pb-1 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
