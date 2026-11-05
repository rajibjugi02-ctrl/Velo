import { User, Post, Story, Conversation, Activity, VeloSettings } from '@/types/velo';

// Pure, clean initial datasets without fake/dummy profiles
export const CURRENT_USER: User | null = null;

export const SAMPLE_USERS: User[] = [];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_ARCHIVED_POSTS: Post[] = [];

export const INITIAL_ARCHIVED_STORIES: Story[] = [];

export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_ACTIVITIES: Activity[] = [];

export const DEFAULT_SETTINGS: VeloSettings = {
  theme: 'dark',
  chatBubbleColor: 'zinc-dark',
  language: 'en',
  privacy: {
    bioVisibility: 'everyone',
    lastSeenVisibility: 'everyone',
    showOnlineStatus: true,
  },
  notifications: {
    messages: true,
    likes: true,
    reposts: true,
    tags: true,
    soundEnabled: true,
  },
  dataSaver: {
    videoAutoplay: 'always',
    highQualityMedia: true,
  },
  blockedUsers: [],
  mutedUsers: [],
};
