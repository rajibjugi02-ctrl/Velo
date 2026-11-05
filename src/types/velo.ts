export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatar: string;
  banner: string;
  bannerType: 'image' | 'video';
  bio: string;
  links: Array<{
    id: string;
    label: string;
    url: string;
  }>;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isMutual?: boolean;
  isVerified?: boolean;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen?: string;
  createdAt?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  isCustom?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    textOverlay?: string;
  }>;
  song?: Song;
  taggedUsers?: User[];
  likesCount: number;
  isLiked: boolean;
  repostsCount: number;
  isReposted: boolean;
  commentsCount: number;
  bookmarksCount: number;
  isBookmarked: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string; // id of comment being replied to
  replyToUsername?: string; // username being replied to
  author: User;
  content: string;
  mediaUrl?: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface StoryViewerInfo {
  user: User;
  viewedAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  author: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  textOverlay?: {
    text: string;
    color: string;
    bgColor?: string;
    bgStyle?: 'transparent' | 'semi' | 'solid';
    positionX?: number; // 0-100 percentage
    positionY: number; // 0-100 percentage
    fontSize?: number; // in px
    fontStyle?: 'modern' | 'serif' | 'neon' | 'bold';
  };
  song?: Song;
  taggedUsers?: User[];
  createdAt: string;
  expiresAt: string;
  isArchived: boolean;
  viewers: StoryViewerInfo[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  photos?: string[];
  document?: {
    name: string;
    size: string;
    url: string;
    type: string;
  };
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image?: string;
  };
  voiceNote?: {
    url: string;
    duration: number;
    waveform?: number[];
  };
  reactions?: Record<string, string>; // userId -> emoji
  isEdited?: boolean;
  deletedFor?: string[]; // userIds who deleted for themselves
  isDeletedForEveryone?: boolean;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  customNickname?: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Activity {
  id: string;
  type: 'like' | 'repost' | 'comment' | 'tag' | 'follow';
  actor: User;
  targetPostId?: string;
  targetStoryId?: string;
  commentText?: string;
  createdAt: string;
  isRead: boolean;
}

export type ChatBubblePalette =
  | 'zinc-dark'
  | 'muted-indigo'
  | 'sage-green'
  | 'ocean-slate'
  | 'charcoal-noir'
  | 'clean-mono';

export type LanguageCode =
  | 'en'
  | 'id'
  | 'ja'
  | 'ko'
  | 'es'
  | 'fr'
  | 'ar'
  | 'zh'
  | 'de';

export interface VeloSettings {
  theme: 'dark' | 'light';
  chatBubbleColor: ChatBubblePalette;
  language: LanguageCode;
  privacy: {
    bioVisibility: 'everyone' | 'friends' | 'only_me';
    lastSeenVisibility: 'everyone' | 'friends' | 'only_me';
    showOnlineStatus: boolean;
  };
  notifications: {
    messages: boolean;
    likes: boolean;
    reposts: boolean;
    tags: boolean;
    soundEnabled: boolean;
  };
  dataSaver: {
    videoAutoplay: 'always' | 'wifi' | 'never';
    highQualityMedia: boolean;
  };
  blockedUsers: string[];
  mutedUsers: string[];
}
