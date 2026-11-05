


'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Post,
  Story,
  Comment,
  Conversation,
  Message,
  Activity,
  VeloSettings,
  Song,
} from '@/types/velo';
import {
  CURRENT_USER,
  SAMPLE_USERS,
  INITIAL_POSTS,
  INITIAL_ARCHIVED_POSTS,
  INITIAL_STORIES,
  INITIAL_ARCHIVED_STORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_ACTIVITIES,
  DEFAULT_SETTINGS,
} from '@/lib/initialData';
import { generateId } from '@/lib/utils';
import { safeLocalStorageSet } from '@/lib/mediaStorage';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface VeloContextType {
  currentUser: User | null;
  isHydrated: boolean;
  savedAccounts: User[];
  allUsers: User[];
  followingIds: string[];
  followersIds: string[];
  posts: Post[];
  archivedPosts: Post[];
  stories: Story[];
  archivedStories: Story[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  comments: Record<string, Comment[]>;
  activities: Activity[];
  settings: VeloSettings;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;

  // Auth & Account
  login: (user: User) => void;
  registerUser: (user: User) => void;
  logout: () => void;
  switchAccount: (userId: string) => void;
  addAccount: (user: User) => boolean;
  removeAccount: (userId: string) => void;
  updateProfile: (updated: Partial<User>) => void;

  // Posts
  addPost: (data: {
    content: string;
    media?: Array<{ url: string; type: 'image' | 'video'; textOverlay?: string }>;
    song?: Song;
    taggedUsers?: User[];
  }) => Post;
  toggleLikePost: (postId: string) => void;
  toggleRepostPost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  archivePost: (postId: string) => void;
  restoreArchivedPost: (postId: string) => void;
  deletePostPermanently: (postId: string) => void;

  // Comments & Nested Replies
  addComment: (
    postId: string,
    content: string,
    parentId?: string,
    replyToUsername?: string,
    mediaUrl?: string
  ) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;

  // Stories
  addStory: (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    textOverlay?: Story['textOverlay'];
    song?: Song;
    taggedUsers?: User[];
  }) => Story;
  viewStory: (storyId: string) => void;
  deleteStory: (storyId: string) => void;
  archiveStory: (storyId: string) => void;
  restoreArchivedStory: (storyId: string) => void;
  deleteArchivedStoryPermanently: (storyId: string) => void;

  // Users & Follow
  toggleFollowUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;

  // Messages & Chat Interactions
  sendMessage: (
    conversationId: string,
    messageData: {
      text: string;
      replyTo?: Message['replyTo'];
      photos?: string[];
      document?: Message['document'];
      linkPreview?: Message['linkPreview'];
      voiceNote?: Message['voiceNote'];
    }
  ) => void;
  toggleMessageReaction: (conversationId: string, messageId: string, emoji: string) => void;
  editMessage: (conversationId: string, messageId: string, newText: string) => void;
  deleteMessageForMe: (conversationId: string, messageId: string) => void;
  deleteMessageForEveryone: (conversationId: string, messageId: string) => void;
  setContactNickname: (conversationId: string, nickname: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearConversationMessages: (conversationId: string) => void;

  // Activity
  markActivityAsRead: (activityId: string) => void;

  // Settings
  updateSettings: (updated: Partial<VeloSettings>) => void;
  clearAppCache: () => void;
}

const VeloContext = createContext<VeloContextType | null>(null);

const STORAGE_KEYS = {
  CURRENT_USER: 'velo_current_user',
  SAVED_ACCOUNTS: 'velo_saved_accounts',
  POSTS: 'velo_posts',
  ARCHIVED_POSTS: 'velo_archived_posts',
  STORIES: 'velo_stories',
  ARCHIVED_STORIES: 'velo_archived_stories',
  ALL_USERS: 'velo_all_users',
  CONVERSATIONS: 'velo_conversations',
  MESSAGES: 'velo_messages',
  COMMENTS: 'velo_comments',
  ACTIVITIES: 'velo_activities',
  SETTINGS: 'velo_settings',
};

export const VeloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (storedUser) {
          const u: User = JSON.parse(storedUser);
          const stored = localStorage.getItem(`velo_following_${u.id}`);
          if (stored) return JSON.parse(stored);
          if (u.id !== 'usr_me') return [];
        }
      } catch {}
    }
    return [];
  });

  const [followersIds, setFollowersIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (storedUser) {
          const u: User = JSON.parse(storedUser);
          const stored = localStorage.getItem(`velo_followers_${u.id}`);
          if (stored) return JSON.parse(stored);
          if (u.id !== 'usr_me') return [];
        }
      } catch {}
    }
    return [];
  });

  const [savedAccounts, setSavedAccounts] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Purge dummy sample users that weren't genuinely registered
          let cleaned = parsed.filter((u: any) => u.id !== 'usr_marcus' && u.id !== 'usr_elena');
          const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          if (storedUser) {
            const active = JSON.parse(storedUser);
            if (active.id !== 'usr_me') {
              cleaned = cleaned.filter((u: any) => u.id !== 'usr_me');
            }
          }
          if (cleaned.length > 0) return cleaned;
        }
      } catch {}
    }
    return [];
  });
  const [allUsers, setAllUsers] = useState<User[]>([CURRENT_USER, ...SAMPLE_USERS]);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>(INITIAL_ARCHIVED_POSTS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [archivedStories, setArchivedStories] = useState<Story[]>(INITIAL_ARCHIVED_STORIES);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    conv_elena: [
      {
        id: 'msg_e_1',
        conversationId: 'conv_elena',
        senderId: SAMPLE_USERS[0].id,
        text: 'Hey Alex, check out the new 35mm film stills from Shinjuku.',
        photos: [
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
      },
      {
        id: 'msg_e_2',
        conversationId: 'conv_elena',
        senderId: CURRENT_USER.id,
        text: 'These look very cinematic. Love the dark tones and subtle lighting.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
        read: true,
      },
    ],
    conv_marcus: [
      {
        id: 'msg_m_1',
        conversationId: 'conv_marcus',
        senderId: SAMPLE_USERS[1].id,
        text: 'Recorded a quick synth lead demo for the upcoming ambient set.',
        voiceNote: {
          url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a',
          duration: 18,
          waveform: [20, 50, 80, 40, 90, 60, 100, 75, 45, 85, 30, 95, 65, 40, 20],
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        read: true,
      },
    ],
  });
  const [comments, setComments] = useState<Record<string, Comment[]>>({
    pst_1: [
      {
        id: 'c_1',
        postId: 'pst_1',
        author: CURRENT_USER,
        content: 'The lighting in this scene is extraordinary Elena! That neon reflection in the rain puddles is magical.',
        likesCount: 14,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        replies: [
          {
            id: 'c_1_rep_1',
            postId: 'pst_1',
            parentId: 'c_1',
            replyToUsername: CURRENT_USER.username,
            author: SAMPLE_USERS[0],
            content: 'Thank you Alex! Shot on 500T with a diffusion filter.',
            likesCount: 4,
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
        ],
      },
      {
        id: 'c_2',
        postId: 'pst_1',
        author: SAMPLE_USERS[1],
        content: 'Midnight City was the perfect score choice for this clip.',
        likesCount: 8,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
    ],
  });
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [settings, setSettings] = useState<VeloSettings>({
    ...DEFAULT_SETTINGS,
    chatBubbleColor: 'zinc-dark',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      let activeUser: User | null = null;
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        activeUser = JSON.parse(storedUser);
        setCurrentUser(activeUser);
      } else {
        setCurrentUser(null);
      }

      if (activeUser) {
        const isCustomUser = activeUser.id !== 'usr_me';
        const storedFollowing = localStorage.getItem(`velo_following_${activeUser.id}`);
        if (storedFollowing) {
          setFollowingIds(JSON.parse(storedFollowing));
        } else if (isCustomUser) {
          setFollowingIds([]);
        }

        const storedFollowers = localStorage.getItem(`velo_followers_${activeUser.id}`);
        if (storedFollowers) {
          setFollowersIds(JSON.parse(storedFollowers));
        } else if (isCustomUser) {
          setFollowersIds([]);
        }
      }

      const storedAccounts = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS);
      if (storedAccounts) {
        try {
          const parsed: User[] = JSON.parse(storedAccounts);
          let cleaned = parsed.filter(
            (u) => u.id !== 'usr_marcus' && u.id !== 'usr_elena'
          );
          // If active user is a real custom account, purge dummy placeholder usr_me (Alex Chen)
          if (activeUser && activeUser.id !== 'usr_me') {
            cleaned = cleaned.filter((u) => u.id !== 'usr_me');
          }
          if (activeUser && !cleaned.some((u) => u.id === activeUser!.id)) {
            cleaned.push(activeUser);
          }
          if (cleaned.length > 0) {
            setSavedAccounts(cleaned);
            safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(cleaned));
          } else if (activeUser) {
            setSavedAccounts([activeUser]);
            safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify([activeUser]));
          }
        } catch {}
      }

      const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (storedPosts) setPosts(JSON.parse(storedPosts));

      const storedArchivedPosts = localStorage.getItem(STORAGE_KEYS.ARCHIVED_POSTS);
      if (storedArchivedPosts) setArchivedPosts(JSON.parse(storedArchivedPosts));

      const storedStories = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (storedStories) setStories(JSON.parse(storedStories));

      const storedArchivedStories = localStorage.getItem(STORAGE_KEYS.ARCHIVED_STORIES);
      if (storedArchivedStories) setArchivedStories(JSON.parse(storedArchivedStories));

      const storedUsers = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      if (storedUsers) setAllUsers(JSON.parse(storedUsers));

      const storedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (storedConvs) setConversations(JSON.parse(storedConvs));

      const storedMsgs = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (storedMsgs) setMessages(JSON.parse(storedMsgs));

      const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (storedComments) setComments(JSON.parse(storedComments));

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch {
      // Fallback
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = generateId('tst');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = (user: User) => {
    setCurrentUser(user);
    safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    // Load or reset following and followers for this specific user
    try {
      const isCustomUser = user.id !== 'usr_me';
      const storedFollowing = localStorage.getItem(`velo_following_${user.id}`);
      if (storedFollowing) {
        setFollowingIds(JSON.parse(storedFollowing));
      } else if (isCustomUser) {
        setFollowingIds([]);
      }

      const storedFollowers = localStorage.getItem(`velo_followers_${user.id}`);
      if (storedFollowers) {
        setFollowersIds(JSON.parse(storedFollowers));
      } else if (isCustomUser) {
        setFollowersIds([]);
      }
    } catch {}
    
    // Guarantee user is in allUsers state AND persistent storage
    setAllUsers((prev) => {
      const exists = prev.some(
        (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
      );
      if (exists) {
        return prev.map((u) =>
          u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
            ? { ...u, ...user }
            : u
        );
      }
      const updated = [...prev, user];
      safeLocalStorageSet(STORAGE_KEYS.ALL_USERS, JSON.stringify(updated));
      return updated;
    });

    const isRealAccount = user.id !== 'usr_me';
    setSavedAccounts((prev) => {
      // If logging into a real account, purge placeholder usr_me (Alex Chen)
      let base = isRealAccount ? prev.filter((acc) => acc.id !== 'usr_me') : prev;
      base = base.filter((acc) => acc.id !== 'usr_marcus' && acc.id !== 'usr_elena');
      const exists = base.some((acc) => acc.id === user.id);
      const updated = exists ? base : [user, ...base].slice(0, 3);
      safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });
    showToast(`Welcome back, @${user.username}`, 'success');
  };

  const registerUser = (user: User) => {
    setAllUsers((prev) => {
      const exists = prev.some(
        (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
      );
      if (exists) return prev;
      const updated = [...prev, user];
      safeLocalStorageSet(STORAGE_KEYS.ALL_USERS, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    if (savedAccounts.length > 1) {
      const remaining = savedAccounts.filter((acc) => acc.id !== currentUser?.id);
      setCurrentUser(remaining[0]);
      safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(remaining[0]));
      setSavedAccounts(remaining);
      safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(remaining));
      showToast(`Switched to @${remaining[0].username}`, 'info');
    } else {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setSavedAccounts([]);
      localStorage.removeItem(STORAGE_KEYS.SAVED_ACCOUNTS);
      showToast('Logged out of Velo', 'info');
    }
  };

  const switchAccount = (userId: string) => {
    const target = savedAccounts.find((acc) => acc.id === userId) || allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
      try {
        const isCustomUser = target.id !== 'usr_me';
        const storedFollowing = localStorage.getItem(`velo_following_${target.id}`);
        setFollowingIds(storedFollowing ? JSON.parse(storedFollowing) : isCustomUser ? [] : ['usr_elena', 'usr_marcus']);
        const storedFollowers = localStorage.getItem(`velo_followers_${target.id}`);
        setFollowersIds(storedFollowers ? JSON.parse(storedFollowers) : isCustomUser ? [] : ['usr_elena', 'usr_marcus']);
      } catch {}
      showToast(`Switched account to @${target.username}`, 'success');
    }
  };

  const addAccount = (user: User): boolean => {
    const isRealAccount = user.id !== 'usr_me';
    let base = isRealAccount ? savedAccounts.filter((acc) => acc.id !== 'usr_me') : savedAccounts;
    base = base.filter((acc) => acc.id !== 'usr_marcus' && acc.id !== 'usr_elena');

    const existingIdx = base.findIndex(
      (acc) => acc.id === user.id || acc.username.toLowerCase() === user.username.toLowerCase()
    );
    if (existingIdx !== -1) {
      setCurrentUser(base[existingIdx]);
      safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(base[existingIdx]));
      showToast(`Switched account to @${user.username}`, 'success');
      return true;
    }
    if (base.length >= 3) {
      showToast('Maximum of 3 accounts reached. Please remove one first.', 'error');
      return false;
    }
    const updated = [...base, user];
    setSavedAccounts(updated);
    setCurrentUser(user);
    safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(updated));
    safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    showToast(`Account @${user.username} added successfully`, 'success');
    return true;
  };

  const removeAccount = (userId: string) => {
    const updated = savedAccounts.filter((acc) => acc.id !== userId);
    setSavedAccounts(updated);
    localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(updated));
    if (currentUser?.id === userId) {
      const nextUser = updated[0] || null;
      setCurrentUser(nextUser);
      if (nextUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
    showToast('Account removed', 'info');
  };

  const updateProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);
    setAllUsers((prev) => prev.map((u) => (u.id === newProfile.id ? newProfile : u)));
    setSavedAccounts((prev) => prev.map((u) => (u.id === newProfile.id ? newProfile : u)));
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newProfile));
      const storedUsers = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        const updatedAll = parsed.map((u: any) => (u.id === newProfile.id ? newProfile : u));
        localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedAll));
      }
    } catch (e) {
      console.warn('Could not persist full profile to localStorage:', e);
    }
    showToast('Profile updated', 'success');
  };

  const addPost = (data: {
    content: string;
    media?: Array<{ url: string; type: 'image' | 'video'; textOverlay?: string }>;
    song?: Song;
    taggedUsers?: User[];
  }): Post => {
    const newPost: Post = {
      id: generateId('pst'),
      authorId: currentUser!.id,
      author: currentUser!,
      content: data.content,
      media: data.media,
      song: data.song,
      taggedUsers: data.taggedUsers,
      likesCount: 0,
      isLiked: false,
      repostsCount: 0,
      isReposted: false,
      commentsCount: 0,
      bookmarksCount: 0,
      isBookmarked: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    safeLocalStorageSet(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    showToast('Post published', 'success');
    return newPost;
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  const toggleRepostPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isReposted = !p.isReposted;
          return {
            ...p,
            isReposted,
            repostsCount: isReposted ? p.repostsCount + 1 : Math.max(0, p.repostsCount - 1),
          };
        }
        return p;
      })
    );
  };

  const toggleBookmarkPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isBookmarked = !p.isBookmarked;
          return {
            ...p,
            isBookmarked,
            bookmarksCount: isBookmarked ? p.bookmarksCount + 1 : Math.max(0, p.bookmarksCount - 1),
          };
        }
        return p;
      })
    );
  };

  const archivePost = (postId: string) => {
    const postToArchive = posts.find((p) => p.id === postId);
    if (!postToArchive) return;

    const remainingPosts = posts.filter((p) => p.id !== postId);
    const updatedArchived = [{ ...postToArchive, isArchived: true }, ...archivedPosts];

    setPosts(remainingPosts);
    setArchivedPosts(updatedArchived);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(remainingPosts));
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(updatedArchived));
    showToast('Post moved to Archive', 'info');
  };

  const restoreArchivedPost = (postId: string) => {
    const postToRestore = archivedPosts.find((p) => p.id === postId);
    if (!postToRestore) return;

    const remainingArchived = archivedPosts.filter((p) => p.id !== postId);
    const updatedPosts = [{ ...postToRestore, isArchived: false }, ...posts];

    setArchivedPosts(remainingArchived);
    setPosts(updatedPosts);
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(remainingArchived));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
    showToast('Post restored to profile', 'success');
  };

  const deletePostPermanently = (postId: string) => {
    const remainingArchived = archivedPosts.filter((p) => p.id !== postId);
    const remainingPosts = posts.filter((p) => p.id !== postId);
    setArchivedPosts(remainingArchived);
    setPosts(remainingPosts);
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(remainingArchived));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(remainingPosts));
    showToast('Post permanently deleted', 'info');
  };

  // Comments with Nested Replies support
  const addComment = (
    postId: string,
    content: string,
    parentId?: string,
    replyToUsername?: string,
    mediaUrl?: string
  ) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: generateId('c'),
      postId,
      parentId,
      replyToUsername,
      author: currentUser,
      content,
      mediaUrl,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments((prev) => {
      const postComments = prev[postId] || [];
      let updatedPostComments: Comment[];

      if (parentId) {
        // Find parent and append to its replies
        updatedPostComments = postComments.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            };
          }
          return c;
        });
      } else {
        updatedPostComments = [newComment, ...postComments];
      }

      const next = { ...prev, [postId]: updatedPostComments };
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(next));
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );
    showToast('Reply published', 'success');
  };

  const toggleLikeComment = (postId: string, commentId: string) => {
    setComments((prev) => {
      const postComments = prev[postId] || [];
      const updateList = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
            };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateList(c.replies) };
          }
          return c;
        });
      };

      const updated = { ...prev, [postId]: updateList(postComments) };
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
      return updated;
    });
  };

  // Stories
  const addStory = (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    textOverlay?: Story['textOverlay'];
    song?: Song;
    taggedUsers?: User[];
  }): Story => {
    const newStory: Story = {
      id: generateId('sty'),
      authorId: currentUser!.id,
      author: currentUser!,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      textOverlay: data.textOverlay,
      song: data.song,
      taggedUsers: data.taggedUsers,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      isArchived: false,
      viewers: [],
    };
    const updated = [newStory, ...stories];
    setStories(updated);
    safeLocalStorageSet(STORAGE_KEYS.STORIES, JSON.stringify(updated));
    showToast('Story published', 'success');
    return newStory;
  };

  const viewStory = (storyId: string) => {
    if (!currentUser) return;
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          const alreadyViewed = s.viewers.some((v) => v.user.id === currentUser.id);
          if (alreadyViewed) return s;
          return {
            ...s,
            viewers: [...s.viewers, { user: currentUser, viewedAt: new Date().toISOString() }],
          };
        }
        return s;
      })
    );
  };

  const deleteStory = (storyId: string) => {
    const updated = stories.filter((s) => s.id !== storyId);
    setStories(updated);
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(updated));
    showToast('Story deleted', 'info');
  };

  const archiveStory = (storyId: string) => {
    const storyToArchive = stories.find((s) => s.id === storyId);
    if (!storyToArchive) return;

    const remainingStories = stories.filter((s) => s.id !== storyId);
    const updatedArchived = [{ ...storyToArchive, isArchived: true }, ...archivedStories];

    setStories(remainingStories);
    setArchivedStories(updatedArchived);
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(remainingStories));
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(updatedArchived));
    showToast('Story archived', 'info');
  };

  const restoreArchivedStory = (storyId: string) => {
    const storyToRestore = archivedStories.find((s) => s.id === storyId);
    if (!storyToRestore) return;

    const remainingArchived = archivedStories.filter((s) => s.id !== storyId);
    const updatedStories = [{ ...storyToRestore, isArchived: false }, ...stories];

    setArchivedStories(remainingArchived);
    setStories(updatedStories);
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(remainingArchived));
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(updatedStories));
    showToast('Story restored', 'success');
  };

  const deleteArchivedStoryPermanently = (storyId: string) => {
    const updated = archivedStories.filter((s) => s.id !== storyId);
    setArchivedStories(updated);
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(updated));
    showToast('Archived story deleted', 'info');
  };

  // Follow & Users (Real-time and genuine tracking)
  const toggleFollowUser = (userId: string) => {
    if (!currentUser) return;
    const isCurrentlyFollowing = followingIds.includes(userId);
    const nextFollowing = isCurrentlyFollowing
      ? followingIds.filter((id) => id !== userId)
      : [...followingIds, userId];

    setFollowingIds(nextFollowing);
    safeLocalStorageSet(`velo_following_${currentUser.id}`, JSON.stringify(nextFollowing));

    const updatedCurrentUser: User = {
      ...currentUser,
      followingCount: nextFollowing.length,
    };
    setCurrentUser(updatedCurrentUser);
    safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedCurrentUser));

    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const isFollowing = !isCurrentlyFollowing;
          const isMutual = isFollowing && followersIds.includes(userId);
          return {
            ...u,
            isFollowing,
            isMutual,
            followersCount: isFollowing ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
          };
        }
        if (u.id === currentUser.id) {
          return updatedCurrentUser;
        }
        return u;
      })
    );

    showToast(isCurrentlyFollowing ? 'Unfollowed user' : 'Following creator', 'info');
  };

  const blockUser = (userId: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedUsers: [...prev.blockedUsers, userId],
    }));
    showToast('User blocked', 'info');
  };

  const unblockUser = (userId: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedUsers: prev.blockedUsers.filter((id) => id !== userId),
    }));
    showToast('User unblocked', 'info');
  };

  const muteUser = (userId: string) => {
    setSettings((prev) => ({
      ...prev,
      mutedUsers: [...prev.mutedUsers, userId],
    }));
    showToast('User muted', 'info');
  };

  const unmuteUser = (userId: string) => {
    setSettings((prev) => ({
      ...prev,
      mutedUsers: prev.mutedUsers.filter((id) => id !== userId),
    }));
    showToast('User unmuted', 'info');
  };

  // Messages & Reactions & Edit & Delete
  const sendMessage = (
    conversationId: string,
    messageData: {
      text: string;
      replyTo?: Message['replyTo'];
      photos?: string[];
      document?: Message['document'];
      linkPreview?: Message['linkPreview'];
      voiceNote?: Message['voiceNote'];
    }
  ) => {
    if (!currentUser) return;
    const newMsg: Message = {
      id: generateId('msg'),
      conversationId,
      senderId: currentUser.id,
      text: messageData.text,
      replyTo: messageData.replyTo,
      photos: messageData.photos,
      document: messageData.document,
      linkPreview: messageData.linkPreview,
      voiceNote: messageData.voiceNote,
      createdAt: new Date().toISOString(),
      read: true,
      reactions: {},
    };

    setMessages((prev) => {
      const next = {
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMsg],
      };
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(next));
      return next;
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: newMsg, unreadCount: 0 } : c
      )
    );
  };

  const toggleMessageReaction = (conversationId: string, messageId: string, emoji: string) => {
    if (!currentUser) return;
    setMessages((prev) => {
      const convMsgs = prev[conversationId] || [];
      const updated = convMsgs.map((m) => {
        if (m.id === messageId) {
          const currentReactions = { ...(m.reactions || {}) };
          if (currentReactions[currentUser.id] === emoji) {
            delete currentReactions[currentUser.id];
          } else {
            currentReactions[currentUser.id] = emoji;
          }
          return { ...m, reactions: currentReactions };
        }
        return m;
      });
      const next = { ...prev, [conversationId]: updated };
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(next));
      return next;
    });
  };

  const editMessage = (conversationId: string, messageId: string, newText: string) => {
    setMessages((prev) => {
      const convMsgs = prev[conversationId] || [];
      const updated = convMsgs.map((m) => {
        if (m.id === messageId) {
          return { ...m, text: newText, isEdited: true };
        }
        return m;
      });
      const next = { ...prev, [conversationId]: updated };
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(next));
      return next;
    });
    showToast('Message updated', 'info');
  };

  const deleteMessageForMe = (conversationId: string, messageId: string) => {
    if (!currentUser) return;
    setMessages((prev) => {
      const convMsgs = prev[conversationId] || [];
      const updated = convMsgs.map((m) => {
        if (m.id === messageId) {
          const deletedFor = [...(m.deletedFor || []), currentUser.id];
          return { ...m, deletedFor };
        }
        return m;
      });
      const next = { ...prev, [conversationId]: updated };
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(next));
      return next;
    });
    showToast('Deleted for you', 'info');
  };

  const deleteMessageForEveryone = (conversationId: string, messageId: string) => {
    setMessages((prev) => {
      const convMsgs = prev[conversationId] || [];
      const updated = convMsgs.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            text: 'This message was deleted',
            photos: undefined,
            document: undefined,
            voiceNote: undefined,
            linkPreview: undefined,
            isDeletedForEveryone: true,
          };
        }
        return m;
      });
      const next = { ...prev, [conversationId]: updated };
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(next));
      return next;
    });
    showToast('Deleted for everyone', 'info');
  };

  const setContactNickname = (conversationId: string, nickname: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, customNickname: nickname } : c))
    );
    showToast('Nickname updated', 'success');
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => {
      const copy = { ...prev };
      delete copy[conversationId];
      return copy;
    });
    showToast('Conversation deleted', 'info');
  };

  const clearConversationMessages = (conversationId: string) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [],
    }));
    showToast('Chat history cleared', 'info');
  };

  const markActivityAsRead = (activityId: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, isRead: true } : a))
    );
  };

  const updateSettings = (updated: Partial<VeloSettings>) => {
    setSettings((prev) => {
      const nextSettings = { ...prev, ...updated };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
      return nextSettings;
    });
    showToast('Settings saved', 'success');
  };

  const clearAppCache = () => {
    localStorage.clear();
    showToast('Local application cache cleared', 'success');
  };

  // User-scoped activities: only usr_me gets sample initial activities; new accounts have clean real activity (zero dummy notifications)
  const activeUserActivities =
    currentUser?.id === 'usr_me'
      ? activities
      : activities.filter((a) => (a as any).recipientId === currentUser?.id);

  // User-scoped conversations: only usr_me gets default demo chats; new accounts start with clean inbox (zero dummy unread badges)
  const activeUserConversations =
    currentUser?.id === 'usr_me'
      ? conversations
      : conversations.filter((c) => (c as any).ownerId === currentUser?.id);

  // Guarantee isFollowing and isMutual reflect real-time active user state
  const computedAllUsers = allUsers.map((u) => {
    const isFollowing = followingIds.includes(u.id);
    const isMutual = isFollowing && followersIds.includes(u.id);
    return {
      ...u,
      isFollowing,
      isMutual,
    };
  });

  return (
    <VeloContext.Provider
      value={{
        currentUser,
        isHydrated,
        savedAccounts,
        allUsers: computedAllUsers,
        followingIds,
        followersIds,
        posts,
        archivedPosts,
        stories,
        archivedStories,
        conversations: activeUserConversations,
        messages,
        comments,
        activities: activeUserActivities,
        settings,
        toasts,
        showToast,
        removeToast,
        login,
        registerUser,
        logout,
        switchAccount,
        addAccount,
        removeAccount,
        updateProfile,
        addPost,
        toggleLikePost,
        toggleRepostPost,
        toggleBookmarkPost,
        archivePost,
        restoreArchivedPost,
        deletePostPermanently,
        addComment,
        toggleLikeComment,
        addStory,
        viewStory,
        deleteStory,
        archiveStory,
        restoreArchivedStory,
        deleteArchivedStoryPermanently,
        toggleFollowUser,
        blockUser,
        unblockUser,
        muteUser,
        unmuteUser,
        sendMessage,
        toggleMessageReaction,
        editMessage,
        deleteMessageForMe,
        deleteMessageForEveryone,
        setContactNickname,
        deleteConversation,
        clearConversationMessages,
        markActivityAsRead,
        updateSettings,
        clearAppCache,
      }}
    >
      {children}
    </VeloContext.Provider>
  );
};

export const useVelo = () => {
  const context = useContext(VeloContext);
  if (!context) {
    throw new Error('useVelo must be used within a VeloProvider');
  }
  return context;
};
