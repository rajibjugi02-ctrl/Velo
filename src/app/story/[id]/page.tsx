'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { formatTimeAgo } from '@/lib/utils';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { Story, User } from '@/types/velo';
import {
  X,
  Volume2,
  VolumeX,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  UserPlus,
  Tag,
  Music,
  Archive,
} from 'lucide-react';

interface UserStoryGroup {
  authorId: string;
  author: User;
  stories: Story[];
}

export default function StoryViewerPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const {
    stories,
    currentUser,
    viewStory,
    deleteStory,
    archiveStory,
    toggleFollowUser,
  } = useVelo();

  const activeStories = stories.filter((s) => !s.isArchived);

  // Group active stories by author so each user has their own distinct story cluster
  const userStoryGroups: UserStoryGroup[] = useMemo(() => {
    const groups: UserStoryGroup[] = [];
    activeStories.forEach((st) => {
      let g = groups.find((item) => item.authorId === st.authorId);
      if (!g) {
        g = {
          authorId: st.authorId,
          author: st.author,
          stories: [],
        };
        groups.push(g);
      }
      g.stories.push(st);
    });
    return groups;
  }, [activeStories]);

  // Initial group and story index based on current URL storyId
  const initialIndices = useMemo(() => {
    for (let gIdx = 0; gIdx < userStoryGroups.length; gIdx++) {
      const sIdx = userStoryGroups[gIdx].stories.findIndex((s) => s.id === storyId);
      if (sIdx !== -1) {
        return { groupIndex: gIdx, storyIndex: sIdx };
      }
    }
    return { groupIndex: 0, storyIndex: 0 };
  }, [userStoryGroups, storyId]);

  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialIndices.groupIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(initialIndices.storyIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewersDrawerOpen, setViewersDrawerOpen] = useState(false);
  const [viewerSearch, setViewerSearch] = useState('');
  const [isCurrentMediaLandscape, setIsCurrentMediaLandscape] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state if URL param or story list changes
  useEffect(() => {
    for (let gIdx = 0; gIdx < userStoryGroups.length; gIdx++) {
      const sIdx = userStoryGroups[gIdx].stories.findIndex((s) => s.id === storyId);
      if (sIdx !== -1) {
        setCurrentGroupIdx(gIdx);
        setCurrentStoryIdx(sIdx);
        setProgress(0);
        break;
      }
    }
  }, [storyId, userStoryGroups]);

  const currentGroup = userStoryGroups[currentGroupIdx];
  const currentStory = currentGroup?.stories[currentStoryIdx];

  // Detect media dimensions for landscape vs portrait display
  useEffect(() => {
    if (!currentStory?.mediaUrl || typeof window === 'undefined') return;

    if (currentStory.mediaType === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = currentStory.mediaUrl;
      v.onloadedmetadata = () => {
        setIsCurrentMediaLandscape(v.videoWidth > v.videoHeight);
      };
    } else {
      const img = new (window as any).Image();
      img.onload = () => {
        setIsCurrentMediaLandscape(img.naturalWidth > img.naturalHeight);
      };
      img.src = currentStory.mediaUrl;
    }
  }, [currentStory?.mediaUrl, currentStory?.mediaType]);

  // Record view on story (Rule 7: Author must never view their own story)
  useEffect(() => {
    if (currentStory && currentUser && currentStory.authorId !== currentUser.id) {
      viewStory(currentStory.id);
    }
  }, [currentStory?.id, currentUser?.id]);

  // Audio preview playback with starting offset
  useEffect(() => {
    if (currentStory?.song?.previewUrl) {
      const audio = new Audio(currentStory.song.previewUrl);
      const songStart = currentStory.song.startTime || 0;
      audio.currentTime = songStart;
      audio.loop = false;
      audio.muted = isMuted;
      audioRef.current = audio;

      // Lock: Never play audio if paused OR if viewers panel is open
      if (!isPaused && !viewersDrawerOpen) {
        audio.play().catch(() => {});
      }

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [currentGroupIdx, currentStoryIdx, currentStory?.song?.previewUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPaused || viewersDrawerOpen) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, viewersDrawerOpen]);

  // Story Navigation logic
  const handleNextStory = () => {
    // Lock: Disable slide if viewers drawer is active
    if (viewersDrawerOpen) return;

    if (!currentGroup) {
      router.push('/feed');
      return;
    }

    if (currentStoryIdx < currentGroup.stories.length - 1) {
      // Advance to next story in current user group
      setProgress(0);
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentGroupIdx < userStoryGroups.length - 1) {
      // Transition to next user group
      setProgress(0);
      setCurrentStoryIdx(0);
      setCurrentGroupIdx((prev) => prev + 1);
    } else {
      // Finished all story groups
      router.push('/feed');
    }
  };

  const handlePrevStory = () => {
    // Lock: Disable slide if viewers drawer is active
    if (viewersDrawerOpen) return;

    if (currentStoryIdx > 0) {
      // Go to previous story in current user group
      setProgress(0);
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentGroupIdx > 0) {
      // Go back to previous user group's last story
      const prevGroup = userStoryGroups[currentGroupIdx - 1];
      setProgress(0);
      setCurrentStoryIdx(prevGroup.stories.length - 1);
      setCurrentGroupIdx((prev) => prev - 1);
    }
  };

  // Rule 3: Dynamic progress bar (Photo 10s, Song duration for music, Video duration for video)
  useEffect(() => {
    if (isPaused || viewersDrawerOpen || !currentStory) return;

    let targetDuration = 10000; // Standard 10 seconds for plain photo
    if (currentStory.song) {
      targetDuration = (currentStory.song.duration || 15) * 1000;
    } else if (currentStory.mediaType === 'video') {
      targetDuration = 15000;
    }

    const songStart = currentStory.song?.startTime || 0;
    const INTERVAL = 40;

    const timer = setInterval(() => {
      setProgress((prev) => {
        // If audio track is playing, sync progress bar with audio currentTime
        if (audioRef.current && !audioRef.current.paused && audioRef.current.duration) {
          const elapsed = Math.max(0, audioRef.current.currentTime - songStart);
          const p = Math.min(100, (elapsed / (currentStory.song?.duration || 15)) * 100);
          if (p >= 100 || elapsed >= (currentStory.song?.duration || 15)) {
            handleNextStory();
            return 0;
          }
          return p;
        }

        // Standard smooth clock progression
        const next = prev + (INTERVAL / targetDuration) * 100;
        if (next >= 100) {
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [currentGroupIdx, currentStoryIdx, isPaused, viewersDrawerOpen, currentStory]);

  if (!currentStory || !currentGroup) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <p className="text-sm mb-4">No active stories available</p>
        <button
          onClick={() => router.push('/feed')}
          className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isOwner = currentUser?.id === currentStory.authorId;
  const textOverlay = currentStory.textOverlay;

  // Rule 7: Exclude the story author themselves from viewers list
  const genuineViewers = currentStory.viewers.filter(
    (v) => v.user.id !== currentStory.authorId
  );

  const filteredViewers = genuineViewers.filter(
    (v) =>
      v.user.fullName.toLowerCase().includes(viewerSearch.toLowerCase()) ||
      v.user.username.toLowerCase().includes(viewerSearch.toLowerCase())
  );

  const hasPrevious = currentStoryIdx > 0 || currentGroupIdx > 0;
  const hasNext =
    currentStoryIdx < currentGroup.stories.length - 1 ||
    currentGroupIdx < userStoryGroups.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 md:bg-black/90 backdrop-blur-2xl flex items-center justify-center select-none overflow-hidden">
      {/* Desktop Previous Button */}
      {hasPrevious && !viewersDrawerOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevStory();
          }}
          className="hidden md:flex absolute left-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-transform hover:scale-110 active:scale-95"
          title="Previous Story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Story Container: Responsive full screen on mobile (100dvh) and centered card on desktop */}
      <div className="relative w-full h-[100dvh] md:max-w-md md:h-[92vh] md:rounded-[36px] overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border-0 md:border md:border-white/10 transition-all duration-300">
        {/* Ambient Blurred Backdrop for Landscape Media */}
        {isCurrentMediaLandscape && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 blur-2xl scale-125">
            {currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Media Layer (fits landscape without cropping, covers portrait) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentStory.mediaType === 'video' ? (
            <VideoPlayer
              src={currentStory.mediaUrl}
              className={`w-full ${
                isCurrentMediaLandscape
                  ? 'h-auto max-h-[85%] object-contain rounded-2xl shadow-2xl'
                  : 'h-full object-cover'
              }`}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentStory.mediaUrl}
              alt="Story media"
              className={`w-full ${
                isCurrentMediaLandscape
                  ? 'h-auto max-h-[85%] object-contain rounded-2xl shadow-2xl'
                  : 'h-full object-cover'
              }`}
            />
          )}
        </div>

        {/* Ambient Top & Bottom Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 pointer-events-none" />

        {/* Top Header & Progress Bars */}
        <div className="relative z-20 p-4 pt-safe sm:p-5 flex flex-col gap-3">
          {/* Progress Bars: Strictly scoped to current author's stories only */}
          <div className="flex items-center gap-1.5 w-full">
            {currentGroup.stories.map((story, idx) => {
              const isPast = idx < currentStoryIdx;
              const isCurrent = idx === currentStoryIdx;
              return (
                <div
                  key={story.id}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    style={{
                      width: isPast ? '100%' : isCurrent ? `${progress}%` : '0%',
                    }}
                    className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                  />
                </div>
              );
            })}
          </div>

          {/* User Bio Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href={`/profile/${currentStory.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentStory.author.avatar}
                  alt={currentStory.author.username}
                  className="w-9 h-9 rounded-full object-cover border border-white/30"
                />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight truncate drop-shadow">
                    {currentStory.author.fullName}
                  </span>
                  <span className="text-[10px] text-white/60">
                    {formatTimeAgo(currentStory.createdAt)}
                  </span>
                </div>

                {/* Minimalist Music Row positioned right below username */}
                {currentStory.song && (
                  <div className="flex items-center gap-1.5 mt-0.5 max-w-[200px]">
                    <Music className="w-3 h-3 text-sky-400 shrink-0" />
                    <div className="text-[11px] text-white/80 font-medium truncate">
                      {currentStory.song.title} • {currentStory.song.artist}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      archiveStory(currentStory.id);
                      handleNextStory();
                    }}
                    title="Archive story"
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteStory(currentStory.id);
                      handleNextStory();
                    }}
                    title="Delete story"
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-rose-400 backdrop-blur-md border border-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => router.push('/feed')}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Left & Right Tap Navigation Zones (Disabled when viewersDrawerOpen is active) */}
        {!viewersDrawerOpen && (
          <>
            <div
              onClick={handlePrevStory}
              className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
            />
            <div
              onClick={handleNextStory}
              className="absolute right-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
            />
          </>
        )}

        {/* Text Overlay Layer */}
        {textOverlay && (
          <div
            style={{
              top: `${textOverlay.positionY}%`,
              left: `${textOverlay.positionX ?? 50}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-20 max-w-[85%] pointer-events-none text-center"
          >
            <div
              style={{
                color: textOverlay.color,
                fontSize: `${textOverlay.fontSize || 18}px`,
                backgroundColor:
                  textOverlay.bgStyle === 'solid'
                    ? textOverlay.bgColor || '#000000'
                    : textOverlay.bgStyle === 'transparent'
                    ? 'transparent'
                    : 'rgba(0, 0, 0, 0.55)',
              }}
              className={`px-4 py-2 rounded-2xl ${
                textOverlay.bgStyle !== 'transparent' ? 'backdrop-blur-md shadow-xl' : ''
              } font-semibold leading-relaxed break-words`}
            >
              {textOverlay.text}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="relative z-20 p-4">
          {currentStory.taggedUsers && currentStory.taggedUsers.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Tag className="w-3.5 h-3.5 text-white/70" />
              {currentStory.taggedUsers.map((u) => (
                <span
                  key={u.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/15"
                >
                  @{u.username}
                </span>
              ))}
            </div>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewersDrawerOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/15 text-white transition-all shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold">
                  {genuineViewers.length} Viewers
                </span>
              </div>
              <span className="text-[11px] text-zinc-300">
                View viewers list
              </span>
            </button>
          )}
        </div>

        {/* Slide-up Viewers Sheet (locks duration and disables slide when open) */}
        {viewersDrawerOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-zinc-950/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] p-4 flex flex-col z-30 shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">
                  Story Viewers ({genuineViewers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewersDrawerOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-2.5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={viewerSearch}
                onChange={(e) => setViewerSearch(e.target.value)}
                placeholder="Search viewers..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 text-xs focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1">
              {filteredViewers.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  {currentStory.viewers.length === 0
                    ? 'No one has viewed this story yet'
                    : 'No viewers matching your search'}
                </div>
              ) : (
                filteredViewers.map(({ user, viewedAt }) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate leading-tight">
                          {user.fullName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          @{user.username} • {formatTimeAgo(viewedAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFollowUser(user.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        user.isFollowing
                          ? 'bg-white/10 text-zinc-300 hover:bg-white/20'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow Back</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Next Button */}
      {hasNext && !viewersDrawerOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextStory();
          }}
          className="hidden md:flex absolute right-8 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/15 transition-transform hover:scale-110 active:scale-95"
          title="Next Story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
