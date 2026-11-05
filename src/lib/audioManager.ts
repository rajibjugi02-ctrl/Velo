import { Song } from '@/types/velo';

type AudioListener = (activePostId: string | null, isPlaying: boolean) => void;

class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPostId: string | null = null;
  private currentSong: Song | null = null;
  private listeners: Set<AudioListener> = new Set();
  private isUserMuted: boolean = false;
  private userPausedPosts: Set<string> = new Set();

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    const isPlaying = Boolean(this.currentAudio && !this.currentAudio.paused);
    listener(this.currentPostId, isPlaying);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const isPlaying = Boolean(this.currentAudio && !this.currentAudio.paused);
    this.listeners.forEach((listener) => listener(this.currentPostId, isPlaying));
  }

  public getCurrentPostId(): string | null {
    return this.currentPostId;
  }

  public isMuted(): boolean {
    return this.isUserMuted;
  }

  public setMuted(muted: boolean) {
    this.isUserMuted = muted;
    if (muted && this.currentAudio) {
      this.pause();
    }
  }

  public play(postId: string, song: Song, isAutoScroll = false): void {
    if (this.isUserMuted || !song.previewUrl) return;

    // If auto-scroll triggered this, but user manually paused this specific post, respect user choice
    if (isAutoScroll && this.userPausedPosts.has(postId)) {
      return;
    }

    // If the same post is already loaded
    if (this.currentPostId === postId && this.currentAudio) {
      if (!this.currentAudio.paused) {
        return; // Already playing smoothly
      }
      // If paused, resume playback without resetting timestamp
      this.currentAudio
        .play()
        .then(() => {
          this.notify();
        })
        .catch(() => {});
      return;
    }

    // Switching to a new post: stop previous track cleanly
    this.stopCurrent();

    const audio = new Audio(song.previewUrl);
    this.currentAudio = audio;
    this.currentPostId = postId;
    this.currentSong = song;

    const start = Math.max(0, song.startTime || 0);
    const clipDuration = Math.max(15, song.duration || 15);
    const end = Math.max(start + clipDuration, song.endTime || start + clipDuration);

    if (audio.readyState >= 1) {
      audio.currentTime = start;
    } else {
      audio.addEventListener(
        'loadedmetadata',
        () => {
          audio.currentTime = start;
        },
        { once: true }
      );
    }

    let isSeeking = false;
    const handleTimeUpdate = () => {
      if (isSeeking) return;
      if (audio.currentTime >= end) {
        isSeeking = true;
        audio.currentTime = start;
        setTimeout(() => {
          isSeeking = false;
        }, 400);
      }
    };

    const handleEnded = () => {
      audio.currentTime = start;
      audio.play().catch(() => {});
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    audio
      .play()
      .then(() => {
        this.notify();
      })
      .catch(() => {
        this.notify();
      });
  }

  public pause(postId?: string): void {
    if (postId && this.currentPostId !== postId) {
      return;
    }

    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.notify();
    }
  }

  public toggle(postId: string, song: Song): void {
    if (this.currentPostId === postId && this.currentAudio && !this.currentAudio.paused) {
      // User explicitly paused
      this.userPausedPosts.add(postId);
      this.pause(postId);
    } else {
      // User explicitly played
      this.userPausedPosts.delete(postId);
      this.isUserMuted = false;
      this.play(postId, song, false);
    }
  }

  public stopCurrent() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.removeAttribute('src');
        this.currentAudio.load();
      } catch {}
      this.currentAudio = null;
    }
    this.currentPostId = null;
    this.currentSong = null;
    this.notify();
  }
}

export const globalAudio = new GlobalAudioManager();
