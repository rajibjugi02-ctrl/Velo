'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Song } from '@/types/velo';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioBadgeProps {
  song: Song;
  autoPlay?: boolean;
  className?: string;
  variant?: 'floating' | 'inline';
}

export const AudioBadge: React.FC<AudioBadgeProps> = ({
  song,
  autoPlay = false,
  className = '',
  variant = 'inline',
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (song.previewUrl) {
      const audio = new Audio(song.previewUrl);
      audio.loop = true;
      audioRef.current = audio;

      if (autoPlay) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [song.previewUrl, autoPlay]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioRef.current && song.previewUrl) {
      audioRef.current = new Audio(song.previewUrl);
      audioRef.current.loop = true;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const isFloating = variant === 'floating';

  return (
    <button
      onClick={togglePlay}
      type="button"
      className={`group flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-xl border transition-all duration-200 text-left select-none ${isFloating
          ? 'bg-black/60 border-white/15 text-white hover:bg-black/80'
          : 'bg-zinc-100 dark:bg-white/[0.06] border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/[0.1]'
        } ${className}`}
      title={`${song.title} - ${song.artist}`}
    >
      {/* Equalizer animation bars */}
      <div className="flex items-end gap-[2px] h-3.5 w-3.5 shrink-0">
        <span
          className={`w-[2.5px] rounded-full bg-zinc-900 dark:bg-white ${isPlaying ? 'h-full animate-wave-bar-1' : 'h-1.5'
            }`}
        />
        <span
          className={`w-[2.5px] rounded-full bg-zinc-900 dark:bg-white ${isPlaying ? 'h-full animate-wave-bar-2' : 'h-3'
            }`}
        />
        <span
          className={`w-[2.5px] rounded-full bg-zinc-900 dark:bg-white ${isPlaying ? 'h-full animate-wave-bar-3' : 'h-2'
            }`}
        />
      </div>

      <div className="flex items-center gap-1.5 min-w-0 max-w-[200px] sm:max-w-[240px]">
        <Music className="w-3 h-3 text-zinc-500 shrink-0" />
        <span className="text-xs font-semibold truncate leading-tight">
          {song.title}
        </span>
        <span className="text-[11px] opacity-60 truncate font-normal">
          • {song.artist}
        </span>
      </div>

      <div className="shrink-0 text-zinc-400 pl-0.5">
        {isPlaying ? (
          <Volume2 className="w-3 h-3 text-zinc-900 dark:text-white" />
        ) : (
          <VolumeX className="w-3 h-3 opacity-60" />
        )}
      </div>
    </button>
  );
};
