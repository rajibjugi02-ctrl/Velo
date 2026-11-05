'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface MessagePhotoCarouselProps {
  photos: string[];
  onPhotoClick?: (index: number) => void;
}

export const MessagePhotoCarousel: React.FC<MessagePhotoCarouselProps> = ({
  photos,
  onPhotoClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  // Single photo view
  if (photos.length === 1) {
    return (
      <div
        onClick={() => onPhotoClick?.(0)}
        className="relative max-w-sm rounded-2xl overflow-hidden cursor-zoom-in group mb-2 shadow-sm border border-black/10 dark:border-white/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt="Chat attachment"
          className="w-full max-h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  // Multi-photo interactive in-bubble carousel
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      onClick={() => onPhotoClick?.(currentIndex)}
      className="relative w-full max-w-[320px] sm:max-w-sm rounded-2xl overflow-hidden bg-black/40 border border-black/10 dark:border-white/10 cursor-zoom-in select-none mb-2 shadow-md group"
    >
      {/* Active Photo Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60 flex items-center justify-center">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={currentIndex}
            src={photos[currentIndex]}
            alt={`Photo attachment ${currentIndex + 1}`}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Counter Badge (e.g. 1 / 4) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15">
        <Layers className="w-3 h-3 text-white/80" />
        <span>
          {currentIndex + 1} / {photos.length}
        </span>
      </div>

      {/* Navigation Arrow Controls */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-90"
        title="Previous photo"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-90"
        title="Next photo"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Bottom Dot Indicators */}
      <div className="absolute bottom-2 inset-x-0 z-20 flex items-center justify-center gap-1.5">
        {photos.map((_, idx) => (
          <span
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex
                ? 'w-4 bg-white shadow-sm'
                : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

