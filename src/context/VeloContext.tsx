


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

// Permanent filter for old dummy mock data
const DUMMY_IDS = new Set([
  'usr_me',
  'usr_elena',
  'usr_marcus',
  'usr_sarah',
  'usr_kai',
  'usr_jordan',
  'pst_1',
  'pst_2',
  'pst_3',
  'pst_arch_1',
  'sty_1',
  'sty_2',
  'sty_3',
  'sty_arch_1',
  'conv_elena',
  'conv_marcus',
  'act_1',
  'act_2',
  'act_3',
  'act_4',
  'act_5',
  'act_6',
]);

async function syncToServer(action: string, payload: any) {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
  } catch {}
}

export const VeloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && !DUMMY_IDS.has(parsed.id)) return parsed;
        }
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
          return [];
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
          return [];
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
          const parsed: User[] = JSON.parse(stored);
          const cleaned = parsed.filter((u) => !DUMMY_IDS.has(u.id));
          return cleaned.slice(0, 3);
        }
      } catch {}
    }
    return [];
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [archivedPosts, setArchivedPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
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
        const parsed = JSON.parse(storedUser);
        if (parsed && !DUMMY_IDS.has(parsed.id)) {
          activeUser = parsed;
          setCurrentUser(activeUser);
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

      if (activeUser) {
        const storedFollowing = localStorage.getItem(`velo_following_${activeUser.id}`);
        if (storedFollowing) {
          setFollowingIds(JSON.parse(storedFollowing));
        } else {
          setFollowingIds([]);
        }

        const storedFollowers = localStorage.getItem(`velo_followers_${activeUser.id}`);
        if (storedFollowers) {
          setFollowersIds(JSON.parse(storedFollowers));
        } else {
          setFollowersIds([]);
        }
      }

      const storedAccounts = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS);
      if (storedAccounts) {
        try {
          const parsed: User[] = JSON.parse(storedAccounts);
          const cleaned = parsed.filter((u) => !DUMMY_IDS.has(u.id));
          if (activeUser && !cleaned.some((u) => u.id === activeUser!.id)) {
            cleaned.unshift(activeUser);
          }
          const finalAccounts = cleaned.slice(0, 3);
          setSavedAccounts(finalAccounts);
          safeLocalStorageSet(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(finalAccounts));
        } catch {}
      }

      // Purge and load real local data
      const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (storedPosts) {
        const parsed: Post[] = JSON.parse(storedPosts);
        const filtered = parsed.filter((p) => !DUMMY_IDS.has(p.id) && !DUMMY_IDS.has(p.authorId));
        setPosts(filtered);
        safeLocalStorageSet(STORAGE_KEYS.POSTS, JSON.stringify(filtered));
      }

      const storedArchivedPosts = localStorage.getItem(STORAGE_KEYS.ARCHIVED_POSTS);
      if (storedArchivedPosts) {
        try {
          const parsed: Post[] = JSON.parse(storedArchivedPosts);
          setArchivedPosts(parsed);
        } catch {}
      }

      const storedStories = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (storedStories) {
        const parsed: Story[] = JSON.parse(storedStories);
        const filtered = parsed.filter((s) => !DUMMY_IDS.has(s.id) && !DUMMY_IDS.has(s.authorId));
        setStories(filtered);
        safeLocalStorageSet(STORAGE_KEYS.STORIES, JSON.stringify(filtered));
      }

      const storedArchivedStories = localStorage.getItem(STORAGE_KEYS.ARCHIVED_STORIES);
      if (storedArchivedStories) {
        try {
          const parsed: Story[] = JSON.parse(storedArchivedStories);
          setArchivedStories(parsed);
        } catch {}
      }

      const storedUsers = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      if (storedUsers) {
        const parsed: User[] = JSON.parse(storedUsers);
        const filtered = parsed.filter((u) => !DUMMY_IDS.has(u.id));
        setAllUsers(filtered);
        safeLocalStorageSet(STORAGE_KEYS.ALL_USERS, JSON.stringify(filtered));
      }

      const storedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (storedConvs) {
        const parsed: Conversation[] = JSON.parse(storedConvs);
        const filtered = parsed.filter((c) => !DUMMY_IDS.has(c.id) && !DUMMY_IDS.has(c.participant?.id));
        setConversations(filtered);
        safeLocalStorageSet(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) setSettings(JSON.parse(storedSettings));

      const storedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (storedActivities) {
        try {
          setActivities(JSON.parse(storedActivities));
        } catch {}
      }

      // Fetch centralized database from server API (/api/data)
      const pullServerData = async () => {
        try {
          const res = await fetch('/api/data', { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json.success && json.data) {
            const server = json.data;
            if (server.users && Array.isArray(server.users)) {
              setAllUsers((prev) => {
                const map = new Map<string, User>();
                prev.filter((u) => !DUMMY_IDS.has(u.id)).forEach((u) => map.set(u.id, u));
                server.users.filter((u: User) => !DUMMY_IDS.has(u.id)).forEach((u: User) => map.set(u.id, u));
                const merged = Array.from(map.values());
                safeLocalStorageSet(STORAGE_KEYS.ALL_USERS, JSON.stringify(merged));
                return merged;
              });
            }

            const activeArchivedPostIds = new Set<string>();
            if (server.archivedPosts && Array.isArray(server.archivedPosts)) {
              setArchivedPosts(server.archivedPosts);
              safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(server.archivedPosts));
              server.archivedPosts.forEach((p: Post) => activeArchivedPostIds.add(p.id));
            } else {
              const localArchived = localStorage.getItem(STORAGE_KEYS.ARCHIVED_POSTS);
              if (localArchived) {
                try {
                  JSON.parse(localArchived).forEach((p: Post) => activeArchivedPostIds.add(p.id));
                } catch {}
              }
            }

            const activeArchivedStoryIds = new Set<string>();
            if (server.archivedStories && Array.isArray(server.archivedStories)) {
              setArchivedStories(server.archivedStories);
              safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(server.archivedStories));
              server.archivedStories.forEach((s: Story) => activeArchivedStoryIds.add(s.id));
            } else {
              const localArchivedS = localStorage.getItem(STORAGE_KEYS.ARCHIVED_STORIES);
              if (localArchivedS) {
                try {
                  JSON.parse(localArchivedS).forEach((s: Story) => activeArchivedStoryIds.add(s.id));
                } catch {}
              }
            }

            const userUid = activeUser?.id;
            const userLikedSet = new Set<string>();
            const userRepostedSet = new Set<string>();
            if (userUid) {
              if (server.likes) {
                Object.entries(server.likes).forEach(([postId, userIds]) => {
                  if (Array.isArray(userIds) && userIds.includes(userUid)) {
                    userLikedSet.add(postId);
                  }
                });
              }
              if (server.reposts) {
                Object.entries(server.reposts).forEach(([postId, userIds]) => {
                  if (Array.isArray(userIds) && userIds.includes(userUid)) {
                    userRepostedSet.add(postId);
                  }
                });
              }
              try {
                const localL = JSON.parse(localStorage.getItem(`velo_user_likes_${userUid}`) || '[]');
                if (Array.isArray(localL)) localL.forEach((id: string) => userLikedSet.add(id));
                const localR = JSON.parse(localStorage.getItem(`velo_user_reposts_${userUid}`) || '[]');
                if (Array.isArray(localR)) localR.forEach((id: string) => userRepostedSet.add(id));
              } catch {}
            }

            if (server.comments && typeof server.comments === 'object') {
              setComments(server.comments);
              safeLocalStorageSet(STORAGE_KEYS.COMMENTS, JSON.stringify(server.comments));
            }

            if (server.posts && Array.isArray(server.posts)) {
              const cleanPosts = (server.posts as Post[])
                .filter(
                  (p) => !DUMMY_IDS.has(p.id) && !DUMMY_IDS.has(p.authorId) && !p.isArchived && !activeArchivedPostIds.has(p.id)
                )
                .map((p) => {
                  const isLiked = userUid ? userLikedSet.has(p.id) : false;
                  const isReposted = userUid ? userRepostedSet.has(p.id) : false;
                  const likesCount = server.likes?.[p.id]?.length ?? p.likesCount;
                  const repostsCount = server.reposts?.[p.id]?.length ?? p.repostsCount;
                  let commentsCount = p.commentsCount;
                  if (server.comments?.[p.id] && Array.isArray(server.comments[p.id])) {
                    let total = 0;
                    server.comments[p.id].forEach((c: Comment) => {
                      total++;
                      if (c.replies) total += c.replies.length;
                    });
                    commentsCount = total;
                  }
                  return {
                    ...p,
                    isLiked,
                    isReposted,
                    likesCount,
                    repostsCount,
                    commentsCount,
                  };
                });
              setPosts(cleanPosts);
              safeLocalStorageSet(STORAGE_KEYS.POSTS, JSON.stringify(cleanPosts));
            }
            if (server.stories && Array.isArray(server.stories)) {
              const cleanStories = (server.stories as Story[]).filter(
                (s) => !DUMMY_IDS.has(s.id) && !DUMMY_IDS.has(s.authorId) && !s.isArchived && !activeArchivedStoryIds.has(s.id)
              );
              setStories(cleanStories);
              safeLocalStorageSet(STORAGE_KEYS.STORIES, JSON.stringify(cleanStories));
            }
            if (server.conversations && Array.isArray(server.conversations)) {
              const cleanConvs = (server.conversations as Conversation[]).filter(
                (c) => !DUMMY_IDS.has(c.id) && !DUMMY_IDS.has(c.participant?.id)
              );
              setConversations(cleanConvs);
            }
            if (server.messages) {
              setMessages(server.messages);
            }
            if (server.activities && Array.isArray(server.activities)) {
              setActivities(server.activities);
              safeLocalStorageSet(STORAGE_KEYS.ACTIVITIES, JSON.stringify(server.activities));
            }
            if (server.follows && activeUser) {
              const followers = server.follows[activeUser.id] || [];
              setFollowersIds(followers);
              safeLocalStorageSet(`velo_followers_${activeUser.id}`, JSON.stringify(followers));

              const followings: string[] = [];
              Object.entries(server.follows).forEach(([targetId, fList]) => {
                if (Array.isArray(fList) && fList.includes(activeUser.id)) {
                  followings.push(targetId);
                }
              });
              if (followings.length > 0) {
                setFollowingIds(followings);
                safeLocalStorageSet(`velo_following_${activeUser.id}`, JSON.stringify(followings));
              }
            }
          }
        } catch {}
      };

      pullServerData();
    } catch {
      // Fallback
    } finally {
      setIsHydrated(true);
    }

    // Real-time synchronization interval across devices (every 4.5s)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetch('/api/data', { cache: 'no-store' })
          .then((r) => r.json())
          .then((json) => {
            if (json.success && json.data) {
              const server = json.data;

              const activeArchivedPostIds = new Set<string>();
              if (server.archivedPosts && Array.isArray(server.archivedPosts)) {
                setArchivedPosts(server.archivedPosts);
                safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(server.archivedPosts));
                server.archivedPosts.forEach((p: Post) => activeArchivedPostIds.add(p.id));
              } else {
                const localArchived = localStorage.getItem(STORAGE_KEYS.ARCHIVED_POSTS);
                if (localArchived) {
                  try {
                    JSON.parse(localArchived).forEach((p: Post) => activeArchivedPostIds.add(p.id));
                  } catch {}
                }
              }

              const activeArchivedStoryIds = new Set<string>();
              if (server.archivedStories && Array.isArray(server.archivedStories)) {
                setArchivedStories(server.archivedStories);
                safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(server.archivedStories));
                server.archivedStories.forEach((s: Story) => activeArchivedStoryIds.add(s.id));
              } else {
                const localArchivedS = localStorage.getItem(STORAGE_KEYS.ARCHIVED_STORIES);
                if (localArchivedS) {
                  try {
                    JSON.parse(localArchivedS).forEach((s: Story) => activeArchivedStoryIds.add(s.id));
                  } catch {}
                }
              }

              if (server.users) {
                setAllUsers((prev) => {
                  const map = new Map<string, User>();
                  prev.filter((u) => !DUMMY_IDS.has(u.id)).forEach((u) => map.set(u.id, u));
                  server.users.filter((u: User) => !DUMMY_IDS.has(u.id)).forEach((u: User) => map.set(u.id, u));
                  return Array.from(map.values());
                });
              }
              const curUid = currentUser?.id;
              const curLikedSet = new Set<string>();
              const curRepostedSet = new Set<string>();
              if (curUid) {
                if (server.likes) {
                  Object.entries(server.likes).forEach(([postId, userIds]) => {
                    if (Array.isArray(userIds) && userIds.includes(curUid)) {
                      curLikedSet.add(postId);
                    }
                  });
                }
                if (server.reposts) {
                  Object.entries(server.reposts).forEach(([postId, userIds]) => {
                    if (Array.isArray(userIds) && userIds.includes(curUid)) {
                      curRepostedSet.add(postId);
                    }
                  });
                }
                try {
                  const localL = JSON.parse(localStorage.getItem(`velo_user_likes_${curUid}`) || '[]');
                  if (Array.isArray(localL)) localL.forEach((id: string) => curLikedSet.add(id));
                  const localR = JSON.parse(localStorage.getItem(`velo_user_reposts_${curUid}`) || '[]');
                  if (Array.isArray(localR)) localR.forEach((id: string) => curRepostedSet.add(id));
                } catch {}
              }

              if (server.comments && typeof server.comments === 'object') {
                setComments(server.comments);
              }

              if (server.posts) {
                const cleanPosts = (server.posts as Post[])
                  .filter(
                    (p) => !DUMMY_IDS.has(p.id) && !DUMMY_IDS.has(p.authorId) && !p.isArchived && !activeArchivedPostIds.has(p.id)
                  )
                  .map((p) => {
                    const isLiked = curUid ? curLikedSet.has(p.id) : false;
                    const isReposted = curUid ? curRepostedSet.has(p.id) : false;
                    const likesCount = server.likes?.[p.id]?.length ?? p.likesCount;
                    const repostsCount = server.reposts?.[p.id]?.length ?? p.repostsCount;
                    let commentsCount = p.commentsCount;
                    if (server.comments?.[p.id] && Array.isArray(server.comments[p.id])) {
                      let total = 0;
                      server.comments[p.id].forEach((c: Comment) => {
                        total++;
                        if (c.replies) total += c.replies.length;
                      });
                      commentsCount = total;
                    }
                    return {
                      ...p,
                      isLiked,
                      isReposted,
                      likesCount,
                      repostsCount,
                      commentsCount,
                    };
                  });
                setPosts((prev) => {
                  if (prev.length === cleanPosts.length) {
                    const isIdentical = prev.every(
                      (p, i) =>
                        p.id === cleanPosts[i].id &&
                        p.likesCount === cleanPosts[i].likesCount &&
                        p.isLiked === cleanPosts[i].isLiked &&
                        p.repostsCount === cleanPosts[i].repostsCount &&
                        p.commentsCount === cleanPosts[i].commentsCount
                    );
                    if (isIdentical) return prev;
                  }
                  return cleanPosts;
                });
              }
              if (server.stories) {
                const cleanStories = (server.stories as Story[]).filter(
                  (s) => !DUMMY_IDS.has(s.id) && !DUMMY_IDS.has(s.authorId) && !s.isArchived && !activeArchivedStoryIds.has(s.id)
                );
                setStories((prev) => {
                  if (prev.length === cleanStories.length) {
                    const isIdentical = prev.every((s, i) => s.id === cleanStories[i].id);
                    if (isIdentical) return prev;
                  }
                  return cleanStories;
                });
              }
              if (server.messages) {
                setMessages(server.messages);
              }
              if (server.activities && Array.isArray(server.activities)) {
                setActivities(server.activities);
                safeLocalStorageSet(STORAGE_KEYS.ACTIVITIES, JSON.stringify(server.activities));
              }
              if (server.follows && currentUser) {
                const followers = server.follows[currentUser.id] || [];
                setFollowersIds(followers);
                safeLocalStorageSet(`velo_followers_${currentUser.id}`, JSON.stringify(followers));

                const followings: string[] = [];
                Object.entries(server.follows).forEach(([targetId, fList]) => {
                  if (Array.isArray(fList) && fList.includes(currentUser.id)) {
                    followings.push(targetId);
                  }
                });
                if (followings.length > 0) {
                  setFollowingIds(followings);
                  safeLocalStorageSet(`velo_following_${currentUser.id}`, JSON.stringify(followings));
                }
              }
            }
          })
          .catch(() => {});
      }
    }, 4500);

    return () => clearInterval(interval);
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
    syncToServer('REGISTER_USER', { user });
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
    syncToServer('REGISTER_USER', { user });
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
    syncToServer('UPDATE_USER', { user: newProfile });
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
    syncToServer('ADD_POST', { post: newPost });
    showToast('Post published', 'success');
    return newPost;
  };

  const toggleLikePost = (postId: string) => {
    if (!currentUser) return;
    const localLikesKey = `velo_user_likes_${currentUser.id}`;
    let userLikes: string[] = [];
    try {
      userLikes = JSON.parse(localStorage.getItem(localLikesKey) || '[]');
    } catch {}

    let isNowLiked = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          isNowLiked = !p.isLiked;

          // Dispatch notification if newly liked and not author
          if (isNowLiked && p.authorId !== currentUser.id) {
            const newAct: Activity = {
              id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              type: 'like',
              actor: currentUser,
              recipientId: p.authorId,
              targetPostId: p.id,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
            setActivities((acts) => [newAct, ...acts]);
            syncToServer('ADD_ACTIVITY', { activity: newAct });
          }

          return {
            ...p,
            isLiked: isNowLiked,
            likesCount: isNowLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    if (userLikes.includes(postId)) {
      userLikes = userLikes.filter((id) => id !== postId);
    } else {
      userLikes.push(postId);
    }
    safeLocalStorageSet(localLikesKey, JSON.stringify(userLikes));
    syncToServer('TOGGLE_LIKE_POST', { postId, userId: currentUser.id });
  };

  const toggleRepostPost = (postId: string) => {
    if (!currentUser) return;
    const localRepostsKey = `velo_user_reposts_${currentUser.id}`;
    let userReposts: string[] = [];
    try {
      userReposts = JSON.parse(localStorage.getItem(localRepostsKey) || '[]');
    } catch {}

    let isNowReposted = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          isNowReposted = !p.isReposted;

          // Dispatch notification if newly reposted and not author
          if (isNowReposted && p.authorId !== currentUser.id) {
            const newAct: Activity = {
              id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              type: 'repost',
              actor: currentUser,
              recipientId: p.authorId,
              targetPostId: p.id,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
            setActivities((acts) => [newAct, ...acts]);
            syncToServer('ADD_ACTIVITY', { activity: newAct });
          }

          return {
            ...p,
            isReposted: isNowReposted,
            repostsCount: isNowReposted ? p.repostsCount + 1 : Math.max(0, p.repostsCount - 1),
          };
        }
        return p;
      })
    );

    if (userReposts.includes(postId)) {
      userReposts = userReposts.filter((id) => id !== postId);
    } else {
      userReposts.push(postId);
    }
    safeLocalStorageSet(localRepostsKey, JSON.stringify(userReposts));
    syncToServer('TOGGLE_REPOST_POST', { postId, userId: currentUser.id });
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
    const updatedArchived = [{ ...postToArchive, isArchived: true }, ...archivedPosts.filter((p) => p.id !== postId)];

    setPosts(remainingPosts);
    setArchivedPosts(updatedArchived);
    safeLocalStorageSet(STORAGE_KEYS.POSTS, JSON.stringify(remainingPosts));
    safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(updatedArchived));
    syncToServer('ARCHIVE_POST', { postId });
    showToast('Post moved to Archive', 'info');
  };

  const restoreArchivedPost = (postId: string) => {
    const postToRestore = archivedPosts.find((p) => p.id === postId);
    if (!postToRestore) return;

    const remainingArchived = archivedPosts.filter((p) => p.id !== postId);
    const updatedPosts = [{ ...postToRestore, isArchived: false }, ...posts.filter((p) => p.id !== postId)];

    setArchivedPosts(remainingArchived);
    setPosts(updatedPosts);
    safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(remainingArchived));
    safeLocalStorageSet(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
    syncToServer('RESTORE_POST', { postId });
    showToast('Post restored to profile', 'success');
  };

  const deletePostPermanently = (postId: string) => {
    const remainingArchived = archivedPosts.filter((p) => p.id !== postId);
    const remainingPosts = posts.filter((p) => p.id !== postId);
    setArchivedPosts(remainingArchived);
    setPosts(remainingPosts);
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_POSTS, JSON.stringify(remainingArchived));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(remainingPosts));
    syncToServer('DELETE_POST', { postId });
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

    // Trigger comment/reply notification to post author
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost && targetPost.authorId !== currentUser.id) {
      const newAct: Activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'comment',
        actor: currentUser,
        recipientId: targetPost.authorId,
        targetPostId: postId,
        commentText: content,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setActivities((acts) => [newAct, ...acts]);
      syncToServer('ADD_ACTIVITY', { activity: newAct });
    }

    syncToServer('ADD_COMMENT', { postId, comment: newComment, parentId });
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
    syncToServer('ADD_STORY', { story: newStory });
    showToast('Story published', 'success');
    return newStory;
  };

  const viewStory = (storyId: string) => {
    if (!currentUser) return;
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          // Rule 7: Creator must NOT be recorded as viewer of their own story
          if (s.authorId === currentUser.id) return s;
          const alreadyViewed = s.viewers.some((v) => v.user.id === currentUser.id);
          if (alreadyViewed) return s;
          const updated = {
            ...s,
            viewers: [...s.viewers, { user: currentUser, viewedAt: new Date().toISOString() }],
          };
          syncToServer('VIEW_STORY', { storyId, user: currentUser });
          return updated;
        }
        return s;
      })
    );
  };

  const deleteStory = (storyId: string) => {
    const updated = stories.filter((s) => s.id !== storyId);
    setStories(updated);
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(updated));
    syncToServer('DELETE_STORY', { storyId });
    showToast('Story deleted', 'info');
  };

  const archiveStory = (storyId: string) => {
    const storyToArchive = stories.find((s) => s.id === storyId);
    if (!storyToArchive) return;

    const remainingStories = stories.filter((s) => s.id !== storyId);
    const updatedArchived = [{ ...storyToArchive, isArchived: true }, ...archivedStories.filter((s) => s.id !== storyId)];

    setStories(remainingStories);
    setArchivedStories(updatedArchived);
    safeLocalStorageSet(STORAGE_KEYS.STORIES, JSON.stringify(remainingStories));
    safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(updatedArchived));
    syncToServer('ARCHIVE_STORY', { storyId });
    showToast('Story archived', 'info');
  };

  const restoreArchivedStory = (storyId: string) => {
    const storyToRestore = archivedStories.find((s) => s.id === storyId);
    if (!storyToRestore) return;

    const remainingArchived = archivedStories.filter((s) => s.id !== storyId);
    const updatedStories = [{ ...storyToRestore, isArchived: false }, ...stories.filter((s) => s.id !== storyId)];

    setArchivedStories(remainingArchived);
    setStories(updatedStories);
    safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(remainingArchived));
    safeLocalStorageSet(STORAGE_KEYS.STORIES, JSON.stringify(updatedStories));
    syncToServer('RESTORE_STORY', { storyId });
    showToast('Story restored', 'success');
  };

  const deleteArchivedStoryPermanently = (storyId: string) => {
    const updated = archivedStories.filter((s) => s.id !== storyId);
    setArchivedStories(updated);
    safeLocalStorageSet(STORAGE_KEYS.ARCHIVED_STORIES, JSON.stringify(updated));
    syncToServer('DELETE_ARCHIVED_STORY', { storyId });
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

    // Trigger follow notification
    if (!isCurrentlyFollowing && userId !== currentUser.id) {
      const newAct: Activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'follow',
        actor: currentUser,
        recipientId: userId,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setActivities((acts) => [newAct, ...acts]);
      safeLocalStorageSet(STORAGE_KEYS.ACTIVITIES, JSON.stringify([newAct, ...activities]));
    }

    syncToServer('TOGGLE_FOLLOW', {
      followerId: currentUser.id,
      followingId: userId,
      actor: currentUser,
    });

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
    syncToServer('SEND_MESSAGE', { conversationId, message: newMsg });
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

  // User-scoped activities: show notifications received by currentUser as well as their own follow activity
  const activeUserActivities = activities.filter(
    (a) => a.recipientId === currentUser?.id || a.actor.id === currentUser?.id
  );

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
