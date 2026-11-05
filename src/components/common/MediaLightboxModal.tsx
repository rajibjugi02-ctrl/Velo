'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayer } from './VideoPlayer';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';

export interface LightboxMediaItem {
  url: string;
  type: 'image' | 'video';
  textOverlay?: string;
}

interface MediaLightboxModalProps {
  media: LightboxMediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  media,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && currentIndex < media.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, media.length, onClose]);

  if (!isOpen || media.length === 0) return null;

  const currentItem = media[currentIndex] || media[0];
  const hasMultiple = media.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < media.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-2 sm:p-6 select-none animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Top Controls Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-auto"
        >
          {/* Index Counter */}
          {hasMultiple ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-xl border border-white/15">
              {currentIndex + 1} / {media.length}
            </span>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <a
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full resolution in new tab"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Close viewer (Esc)"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-colors hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Previous Button */}
        {hasMultiple && currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-4 sm:left-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-transform hover:scale-110 active:scale-95 pointer-events-auto"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Preview Box */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center pointer-events-auto"
        >
          {currentItem.type === 'video' ? (
            <div className="w-full max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black">
              <VideoPlayer
                src={currentItem.url}
                className="max-h-[85vh] w-auto max-w-full rounded-2xl"
                controls
                muted={false}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentItem.url}
              alt="Full resolution media"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
            />
          )}

          {/* Text Overlay if present */}
          {currentItem.textOverlay && (
            <div className="absolute bottom-4 inset-x-4 max-w-lg mx-auto p-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold text-center shadow-lg">
              {currentItem.textOverlay}
            </div>
          )}
        </motion.div>

        {/* Next Button */}
        {hasMultiple && currentIndex < media.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-4 sm:right-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-transform hover:scale-110 active:scale-95 pointer-events-auto"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </AnimatePresence>
  );
};

