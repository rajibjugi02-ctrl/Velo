import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatBubblePalette } from '@/types/velo';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function formatJoinedDate(dateStr?: string): string {
  if (!dateStr) return 'Joined November 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Joined November 2026';
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `Joined ${month} ${year}`;
  } catch {
    return 'Joined November 2026';
  }
}

/**
 * Clean neutral SVG initials avatar for new users (zero dummy photo)
 */
export function generateInitialsAvatar(name: string): string {
  const cleanName = (name || 'Velo User').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = (
    parts.length >= 2 ? parts[0][0] + parts[1][0] : cleanName.slice(0, 2)
  ).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="#27272a"/>
    <text x="50%" y="54%" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="36" fill="#f4f4f5" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * In-browser synthetic voice note generator (produces authentic PCM WAV Blob URL)
 */
export function createSyntheticVoiceNote(durationSeconds: number = 5): string {
  if (typeof window === 'undefined') return '';
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pleasant melodic vocal synth modulation
    const freq = 260 + Math.sin(t * 4) * 35 + Math.sin(t * 8) * 15;
    const env = Math.min(1, Math.sin((t / durationSeconds) * Math.PI));
    const sample = (Math.sin(2 * Math.PI * freq * t) * 0.28 + Math.sin(4 * Math.PI * freq * t) * 0.12) * env;
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Minimalist, matte, solid non-gradient bubble styling
 */
export function getBubbleThemeClasses(palette: ChatBubblePalette, isSender: boolean): {
  bubbleClass: string;
} {
  if (!isSender) {
    return {
      bubbleClass: 'bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-white/[0.08]',
    };
  }

  switch (palette) {
    case 'muted-indigo':
      return {
        bubbleClass: 'bg-[#2b354f] text-white border border-indigo-400/20 shadow-sm',
      };
    case 'sage-green':
      return {
        bubbleClass: 'bg-[#1f382b] text-white border border-emerald-400/20 shadow-sm',
      };
    case 'ocean-slate':
      return {
        bubbleClass: 'bg-[#1e2e3d] text-white border border-sky-400/20 shadow-sm',
      };
    case 'charcoal-noir':
      return {
        bubbleClass: 'bg-[#171717] text-white border border-white/10 shadow-sm',
      };
    case 'clean-mono':
      return {
        bubbleClass: 'bg-zinc-900 text-white dark:bg-white dark:text-black border border-zinc-700 dark:border-white/20 shadow-sm',
      };
    case 'zinc-dark':
    default:
      return {
        bubbleClass: 'bg-[#27272a] text-white border border-zinc-600/30 shadow-sm',
      };
  }
}
