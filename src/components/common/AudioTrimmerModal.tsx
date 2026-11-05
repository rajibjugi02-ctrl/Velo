'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song } from '@/types/velo';
import { ArrowLeft, Sliders, Play, Pause, Check } from 'lucide-react';

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
  const [duration, setDuration] = useState<15 | 30>(
    song.duration === 30 ? 30 : 15
  );
  const totalTrackDuration = Math.max(30, Math.round(song.duration || 30));
  const maxStart = Math.max(0, totalTrackDuration - duration);

  const [startTime, setStartTime] = useState<number>(song.startTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(song.startTime || 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate realistic decorative waveform heights
  const waveformBars = useMemo(() => {
    const bars: number[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      // Natural music visual pattern with undulating dynamics
      const sinVal = Math.sin((i / count) * Math.PI * 3);
      const cosVal = Math.cos((i / count) * Math.PI * 5);
      const height = Math.max(22, Math.round(40 + sinVal * 28 + cosVal * 18));
      bars.push(height);
    }
    return bars;
  }, []);

  // Initialize audio preview
  useEffect(() => {
    if (!isOpen || !song.previewUrl) return;

    const audio = new Audio(song.previewUrl);
    audioRef.current = audio;
    audio.currentTime = startTime;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Auto-loop when reaching selected trimmed window end
      if (audio.currentTime >= startTime + duration) {
        audio.currentTime = startTime;
        audio.play().catch(() => {});
      }
    };

    const handleEnded = () => {
      audio.currentTime = startTime;
      audio.play().catch(() => {});
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [isOpen, song.previewUrl, startTime, duration]);

  // Adjust clamped start when switching 15s <-> 30s
  const handleDurationToggle = (newDur: 15 | 30) => {
    setDuration(newDur);
    const newMaxStart = Math.max(0, totalTrackDuration - newDur);
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
      duration,
      endTime: startTime + duration,
    });
  };

  if (!isOpen) return null;

  const startPercent = (startTime / totalTrackDuration) * 100;
  const windowPercent = (duration / totalTrackDuration) * 100;
  const endPercent = Math.min(100, startPercent + windowPercent);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 text-white border border-white/10 rounded-[36px] shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight text-white">
              Pilih Bagian Lagu (IG Style)
            </h3>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs tracking-wide shadow-[0_0_16px_rgba(52,211,153,0.35)] transition-all active:scale-95"
          >
            Selesai
          </button>
        </div>

        {/* Center: Vinyl Disc with Album Art */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* Outer vinyl ring */}
            <div
              className={`w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden ${
                isPlaying ? 'animate-[spin_7s_linear_infinite]' : ''
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
                {/* Center spindle hole */}
                <div className="absolute w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800" />
              </div>
            </div>
          </div>

          {/* Song Info */}
          <h4 className="text-base sm:text-lg font-bold text-white mt-4 text-center line-clamp-1">
            {song.title}
          </h4>
          <p className="text-xs text-zinc-400 text-center line-clamp-1 mt-0.5">
            {song.artist}
          </p>

          {/* Duration Selector Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full bg-zinc-900/90 border border-white/10 mt-4 px-3 py-1">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">
              Durasi Cerita:
            </span>
            <button
              type="button"
              onClick={() => handleDurationToggle(15)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                duration === 15
                  ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              15 Detik
            </button>
            <button
              type="button"
              onClick={() => handleDurationToggle(30)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                duration === 30
                  ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Detik
            </button>
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
                  className={`flex-1 rounded-full transition-colors duration-150 ${
                    isInWindow
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : 'bg-zinc-700/60'
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
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
            />
          </div>

          {/* Timestamp Indicators */}
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <span className="text-emerald-400 font-semibold">
              Mulai: {formatSec(startTime)}
            </span>
            <span className="text-zinc-400">
              Selesai: {formatSec(startTime + duration)}
            </span>
            <span className="text-zinc-500">
              Total: {formatSec(totalTrackDuration)}
            </span>
          </div>
        </div>

        {/* Big Glowing Circular Play / Pause Button */}
        <div className="flex justify-center mt-3 mb-1">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-emerald-400 hover:bg-emerald-300 text-black flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.45)] hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
