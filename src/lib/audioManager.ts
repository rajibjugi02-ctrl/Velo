import { Song } from '@/types/velo';

type AudioListener = (activePostId: string | null) => void;

class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPostId: string | null = null;
  private currentSong: Song | null = null;
  private listeners: Set<AudioListener> = new Set();
  private isUserMuted: boolean = false;

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    // Notify immediately with current state
    listener(this.currentPostId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentPostId));
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

  public play(postId: string, song: Song): void {
    if (this.isUserMuted || !song.previewUrl) return;

    // If same post is already playing, do nothing
    if (this.currentPostId === postId && this.currentAudio && !this.currentAudio.paused) {
      return;
    }

    // Stop currently active track before starting new one
    this.stopCurrent();

    const audio = new Audio(song.previewUrl);
    this.currentAudio = audio;
    this.currentPostId = postId;
    this.currentSong = song;

    const start = song.startTime || 0;
    const clipDuration = song.duration || 15;
    const end = song.endTime || start + clipDuration;

    audio.currentTime = start;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= end) {
        audio.currentTime = start;
        audio.play().catch(() => {});
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
        // Autoplay may be restricted by browser until user gesture
        this.currentPostId = null;
        this.notify();
      });
  }

  public pause(postId?: string): void {
    // If specific post passed, only pause if it matches
    if (postId && this.currentPostId !== postId) {
      return;
    }

    this.stopCurrent();
    this.currentPostId = null;
    this.currentSong = null;
    this.notify();
  }

  public toggle(postId: string, song: Song): void {
    if (this.currentPostId === postId) {
      this.pause(postId);
    } else {
      this.isUserMuted = false;
      this.play(postId, song);
    }
  }

  private stopCurrent() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }
  }
}

export const globalAudio = new GlobalAudioManager();
