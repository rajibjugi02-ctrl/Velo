'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useVelo } from '@/context/VeloContext';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onWaiting?: () => void;
  onPlaying?: () => void;
  onCanPlay?: () => void;
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: () => void;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      poster,
      className = '',
      autoPlay = true,
      loop = true,
      muted = true,
      controls = false,
      preload = 'auto',
      onWaiting,
      onPlaying,
      onCanPlay,
      onTimeUpdate,
      onEnded,
      onLoadedMetadata,
    },
    ref
  ) => {
    const { settings } = useVelo();
    const internalRef = useRef<HTMLVideoElement | null>(null);
    const [isBuffering, setIsBuffering] = useState(false);

    useImperativeHandle(ref, () => internalRef.current as HTMLVideoElement);

    useEffect(() => {
      const video = internalRef.current;
      if (!video) return;

      const autoplayPolicy = settings.dataSaver?.videoAutoplay || 'always';
      if (autoplayPolicy === 'never') {
        video.pause();
        return;
      }

      if (autoPlay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    }, [src, autoPlay, settings.dataSaver?.videoAutoplay]);

    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <video
          ref={internalRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          preload={preload}
          controls={controls}
          onWaiting={() => {
            setIsBuffering(true);
            onWaiting?.();
          }}
          onCanPlay={() => {
            setIsBuffering(false);
            onCanPlay?.();
          }}
          onPlaying={() => {
            setIsBuffering(false);
            onPlaying?.();
          }}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          onLoadedMetadata={onLoadedMetadata}
          className={`object-cover ${className}`}
        />

        {/* Subtle sleek buffer loader overlay */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200">
            <div className="p-3 rounded-full bg-black/60 border border-white/10 text-white/90 shadow-xl">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

