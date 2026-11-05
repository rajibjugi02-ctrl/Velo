'use client';

import React, { useRef, useEffect } from 'react';
import { useVelo } from '@/context/VeloContext';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
}) => {
  const { settings } = useVelo();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check Data Saver settings
    const autoplayPolicy = settings.dataSaver?.videoAutoplay || 'always';
    if (autoplayPolicy === 'never') {
      video.pause();
      return;
    }

    if (autoPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented by browser policy
        });
      }
    }
  }, [autoPlay, settings.dataSaver?.videoAutoplay]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload="metadata"
      controls={controls}
      className={`object-cover ${className}`}
    />
  );
};

