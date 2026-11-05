import { Song } from '@/types/velo';

type AudioListener = (activePostId: string | null, isPlaying: boolean) => void;

class GlobalAudioManager {
  private singletonAudio: HTMLAudioElement | null = null;
  private currentPostId: string | null = null;
  private currentSong: Song | null = null;
  private listeners: Set<AudioListener> = new Set();
  private isUserMuted: boolean = false;
  private userPausedPosts: Set<string> = new Set();
  private timeUpdateHandler: (() => void) | null = null;
  private endedHandler: (() => void) | null = null;

  // Lazy-load a single global <audio> element only when explicitly requested
  private getAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.singletonAudio) {
      try {
        this.singletonAudio = new Audio();
        this.singletonAudio.preload = 'none';
      } catch {
        return null;
      }
    }
    return this.singletonAudio;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    const audio = this.getAudio();
    const isPlaying = Boolean(audio && !audio.paused);
    listener(this.currentPostId, isPlaying);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const audio = this.getAudio();
    const isPlaying = Boolean(audio && !audio.paused);
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
    if (muted) {
      this.pause();
    }
  }

  public play(postId: string, song: Song, isAutoScroll = false): void {
    if (this.isUserMuted || !song.previewUrl) return;

    if (isAutoScroll && this.userPausedPosts.has(postId)) {
      return;
    }

    const audio = this.getAudio();
    if (!audio) return;

    // If the same post is already loaded, resume without reloading media
    if (this.currentPostId === postId && audio.src.includes(song.previewUrl)) {
      if (!audio.paused) return;
      audio
        .play()
        .then(() => this.notify())
        .catch(() => {});
      return;
    }

    // Clean up previous listeners
    if (this.timeUpdateHandler) {
      audio.removeEventListener('timeupdate', this.timeUpdateHandler);
      this.timeUpdateHandler = null;
    }
    if (this.endedHandler) {
      audio.removeEventListener('ended', this.endedHandler);
      this.endedHandler = null;
    }

    this.currentPostId = postId;
    this.currentSong = song;

    const start = Math.max(0, song.startTime || 0);
    const clipDuration = Math.max(15, song.duration || 15);
    const end = Math.max(start + clipDuration, song.endTime || start + clipDuration);

    try {
      audio.src = song.previewUrl;
      audio.currentTime = start;
    } catch {}

    let isSeeking = false;
    this.timeUpdateHandler = () => {
      if (isSeeking) return;
      if (audio.currentTime >= end) {
        isSeeking = true;
        audio.currentTime = start;
        setTimeout(() => {
          isSeeking = false;
        }, 300);
      }
    };

    this.endedHandler = () => {
      try {
        audio.currentTime = start;
        audio.play().catch(() => {});
      } catch {}
    };

    audio.addEventListener('timeupdate', this.timeUpdateHandler);
    audio.addEventListener('ended', this.endedHandler);

    audio
      .play()
      .then(() => this.notify())
      .catch(() => this.notify());
  }

  public pause(postId?: string): void {
    if (postId && this.currentPostId !== postId) return;

    const audio = this.getAudio();
    if (audio && !audio.paused) {
      try {
        audio.pause();
      } catch {}
      this.notify();
    }
  }

  public toggle(postId: string, song: Song): void {
    const audio = this.getAudio();
    if (this.currentPostId === postId && audio && !audio.paused) {
      this.userPausedPosts.add(postId);
      this.pause(postId);
    } else {
      this.userPausedPosts.delete(postId);
      this.isUserMuted = false;
      this.play(postId, song, false);
    }
  }

  public stopCurrent() {
    const audio = this.getAudio();
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
      } catch {}
    }
    if (this.timeUpdateHandler && audio) {
      audio.removeEventListener('timeupdate', this.timeUpdateHandler);
      this.timeUpdateHandler = null;
    }
    if (this.endedHandler && audio) {
      audio.removeEventListener('ended', this.endedHandler);
      this.endedHandler = null;
    }
    this.currentPostId = null;
    this.currentSong = null;
    this.notify();
  }
}

export const globalAudio = new GlobalAudioManager();
