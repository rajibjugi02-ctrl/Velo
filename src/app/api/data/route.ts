import { NextResponse } from 'next/server';
import { readServerDb, writeServerDb } from '@/lib/serverDb';
import { User, Post, Story, Message, Activity } from '@/types/velo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readServerDb();
    return NextResponse.json({
      success: true,
      data: db,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve server data' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const db = readServerDb();

    switch (action) {
      case 'REGISTER_USER':
      case 'UPDATE_USER': {
        const user: User = payload.user;
        if (!user || !user.id) break;
        const existingIdx = db.users.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
        if (existingIdx !== -1) {
          db.users[existingIdx] = { ...db.users[existingIdx], ...user };
        } else {
          db.users.push(user);
        }
        break;
      }

      case 'ADD_POST': {
        const post: Post = payload.post;
        if (post && post.id) {
          const idx = db.posts.findIndex((p) => p.id === post.id);
          if (idx !== -1) {
            db.posts[idx] = post;
          } else {
            db.posts.unshift(post);
          }
        }
        break;
      }

      case 'ARCHIVE_POST': {
        const { postId } = payload;
        if (postId) {
          const postToArchive = db.posts.find((p) => p.id === postId);
          if (postToArchive) {
            db.posts = db.posts.filter((p) => p.id !== postId);
            if (!db.archivedPosts) db.archivedPosts = [];
            db.archivedPosts = [
              { ...postToArchive, isArchived: true },
              ...db.archivedPosts.filter((p) => p.id !== postId),
            ];
          }
        }
        break;
      }

      case 'RESTORE_POST': {
        const { postId } = payload;
        if (postId) {
          if (!db.archivedPosts) db.archivedPosts = [];
          const postToRestore = db.archivedPosts.find((p) => p.id === postId);
          if (postToRestore) {
            db.archivedPosts = db.archivedPosts.filter((p) => p.id !== postId);
            db.posts = [
              { ...postToRestore, isArchived: false },
              ...db.posts.filter((p) => p.id !== postId),
            ];
          }
        }
        break;
      }

      case 'DELETE_POST': {
        const { postId } = payload;
        if (postId) {
          db.posts = db.posts.filter((p) => p.id !== postId);
          if (db.archivedPosts) {
            db.archivedPosts = db.archivedPosts.filter((p) => p.id !== postId);
          }
        }
        break;
      }

      case 'TOGGLE_LIKE_POST': {
        const { postId, userId } = payload;
        if (postId && userId) {
          if (!db.likes) db.likes = {};
          if (!db.likes[postId]) db.likes[postId] = [];

          const isLiked = db.likes[postId].includes(userId);
          if (isLiked) {
            db.likes[postId] = db.likes[postId].filter((id) => id !== userId);
          } else {
            db.likes[postId].push(userId);
          }

          const post = db.posts.find((p) => p.id === postId);
          if (post) {
            post.likesCount = db.likes[postId].length;
            post.isLiked = !isLiked;
          }
        }
        break;
      }

      case 'TOGGLE_REPOST_POST': {
        const { postId, userId } = payload;
        if (postId && userId) {
          if (!db.reposts) db.reposts = {};
          if (!db.reposts[postId]) db.reposts[postId] = [];

          const isReposted = db.reposts[postId].includes(userId);
          if (isReposted) {
            db.reposts[postId] = db.reposts[postId].filter((id) => id !== userId);
          } else {
            db.reposts[postId].push(userId);
          }

          const post = db.posts.find((p) => p.id === postId);
          if (post) {
            post.repostsCount = db.reposts[postId].length;
            post.isReposted = !isReposted;
          }
        }
        break;
      }

      case 'ADD_COMMENT': {
        const { postId, comment, parentId } = payload;
        if (postId && comment) {
          if (!db.comments) db.comments = {};
          if (!db.comments[postId]) db.comments[postId] = [];

          if (parentId) {
            db.comments[postId] = db.comments[postId].map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), comment],
                };
              }
              return c;
            });
          } else {
            db.comments[postId] = [comment, ...db.comments[postId]];
          }

          const post = db.posts.find((p) => p.id === postId);
          if (post) {
            let total = 0;
            db.comments[postId].forEach((c) => {
              total++;
              if (c.replies) total += c.replies.length;
            });
            post.commentsCount = total;
          }
        }
        break;
      }

      case 'DELETE_COMMENT': {
        const { postId, commentId } = payload;
        if (postId && commentId && db.comments && db.comments[postId]) {
          db.comments[postId] = db.comments[postId].filter((c) => c.id !== commentId);
          const post = db.posts.find((p) => p.id === postId);
          if (post) {
            let total = 0;
            db.comments[postId].forEach((c) => {
              total++;
              if (c.replies) total += c.replies.length;
            });
            post.commentsCount = total;
          }
        }
        break;
      }

      case 'TOGGLE_LIKE_COMMENT': {
        const { postId, commentId } = payload;
        if (postId && commentId && db.comments && db.comments[postId]) {
          const updateComments = (list: any[]): any[] => {
            return list.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked,
                  likesCount: isLiked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 1) - 1),
                };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: updateComments(c.replies) };
              }
              return c;
            });
          };
          db.comments[postId] = updateComments(db.comments[postId]);
        }
        break;
      }

      case 'ADD_STORY': {
        const story: Story = payload.story;
        if (story && story.id) {
          const idx = db.stories.findIndex((s) => s.id === story.id);
          if (idx !== -1) {
            db.stories[idx] = story;
          } else {
            db.stories.unshift(story);
          }
        }
        break;
      }

      case 'VIEW_STORY': {
        const { storyId, user } = payload;
        const story = db.stories.find((s) => s.id === storyId);
        if (story && user) {
          // Rule 7: Do not record if viewer is the story author
          if (story.authorId !== user.id) {
            const already = story.viewers.some((v) => v.user.id === user.id);
            if (!already) {
              story.viewers.push({
                user,
                viewedAt: new Date().toISOString(),
              });
            }
          }
        }
        break;
      }

      case 'ARCHIVE_STORY': {
        const { storyId } = payload;
        if (storyId) {
          const storyToArchive = db.stories.find((s) => s.id === storyId);
          if (storyToArchive) {
            db.stories = db.stories.filter((s) => s.id !== storyId);
            if (!db.archivedStories) db.archivedStories = [];
            db.archivedStories = [
              { ...storyToArchive, isArchived: true },
              ...db.archivedStories.filter((s) => s.id !== storyId),
            ];
          }
        }
        break;
      }

      case 'RESTORE_STORY': {
        const { storyId } = payload;
        if (storyId) {
          if (!db.archivedStories) db.archivedStories = [];
          const storyToRestore = db.archivedStories.find((s) => s.id === storyId);
          if (storyToRestore) {
            db.archivedStories = db.archivedStories.filter((s) => s.id !== storyId);
            db.stories = [
              { ...storyToRestore, isArchived: false },
              ...db.stories.filter((s) => s.id !== storyId),
            ];
          }
        }
        break;
      }

      case 'DELETE_STORY': {
        const { storyId } = payload;
        if (storyId) {
          db.stories = db.stories.filter((s) => s.id !== storyId);
          if (db.archivedStories) {
            db.archivedStories = db.archivedStories.filter((s) => s.id !== storyId);
          }
        }
        break;
      }

      case 'DELETE_ARCHIVED_STORY': {
        const { storyId } = payload;
        if (storyId && db.archivedStories) {
          db.archivedStories = db.archivedStories.filter((s) => s.id !== storyId);
        }
        break;
      }

      case 'CREATE_CONVERSATION': {
        const { conversationId, participantIds } = payload;
        if (conversationId) {
          if (!db.conversations) db.conversations = [];
          const existing = db.conversations.find((c) => c.id === conversationId);
          if (!existing) {
            db.conversations.unshift({
              id: conversationId,
              participantIds: participantIds || [],
              unreadCount: 0,
            } as any);
          }
        }
        break;
      }

      case 'SEND_MESSAGE': {
        const { conversationId, message, participantIds } = payload;
        if (conversationId && message) {
          if (!db.messages) db.messages = {};
          if (!db.messages[conversationId]) {
            db.messages[conversationId] = [];
          }
          if (!db.messages[conversationId].some((m) => m.id === message.id)) {
            db.messages[conversationId].push(message);
          }

          if (!db.conversations) db.conversations = [];
          let conv = db.conversations.find((c) => c.id === conversationId);
          const pIds =
            participantIds ||
            (conv as any)?.participantIds ||
            (conversationId.startsWith('conv_')
              ? conversationId.replace('conv_', '').split('_')
              : [message.senderId].filter(Boolean));

          if (conv) {
            conv.lastMessage = message;
            if (!(conv as any).participantIds || (conv as any).participantIds.length === 0) {
              (conv as any).participantIds = pIds;
            }
          } else {
            db.conversations.unshift({
              id: conversationId,
              participantIds: pIds,
              lastMessage: message,
              unreadCount: 0,
            } as any);
          }
        }
        break;
      }

      case 'MARK_MESSAGES_READ': {
        const { conversationId, readerId } = payload;
        if (conversationId && readerId && db.messages && db.messages[conversationId]) {
          db.messages[conversationId] = db.messages[conversationId].map((m) =>
            m.senderId !== readerId ? { ...m, read: true } : m
          );
        }
        break;
      }

      case 'ADD_ACTIVITY': {
        const { activity } = payload;
        if (activity && activity.id) {
          // Never record self-notifications (e.g. like/repost/comment own post)
          if (activity.actor?.id && activity.recipientId && activity.actor.id === activity.recipientId) {
            break;
          }
          if (!db.activities) db.activities = [];
          db.activities = [activity, ...db.activities.filter((a) => a.id !== activity.id)];
        }
        break;
      }

      case 'MARK_ACTIVITY_READ': {
        const { activityId } = payload;
        if (activityId && db.activities) {
          const act = db.activities.find((a) => a.id === activityId);
          if (act) act.isRead = true;
        }
        break;
      }

      case 'MARK_ALL_ACTIVITIES_READ': {
        const { recipientId } = payload;
        if (recipientId && db.activities) {
          db.activities.forEach((a) => {
            if (a.recipientId === recipientId) a.isRead = true;
          });
        }
        break;
      }

      case 'TOGGLE_FOLLOW': {
        const { followerId, followingId, actor, targetUser, isFollow } = payload;
        if (followerId && followingId && followerId !== followingId) {
          if (!db.follows) db.follows = {};
          if (!db.follows[followingId]) db.follows[followingId] = [];

          // Ensure both users exist in db.users for cross-device discovery
          if (actor && actor.id) {
            const aIdx = db.users.findIndex((u) => u.id === actor.id);
            if (aIdx !== -1) db.users[aIdx] = { ...db.users[aIdx], ...actor };
            else db.users.push(actor);
          }
          if (targetUser && targetUser.id) {
            const tIdx = db.users.findIndex((u) => u.id === targetUser.id);
            if (tIdx !== -1) db.users[tIdx] = { ...db.users[tIdx], ...targetUser };
            else db.users.push(targetUser);
          }

          const currentlyFollowing = db.follows[followingId].includes(followerId);
          const shouldFollow = typeof isFollow === 'boolean' ? isFollow : !currentlyFollowing;

          if (shouldFollow) {
            if (!currentlyFollowing) {
              db.follows[followingId].push(followerId);
            }
            // Idempotent follow notification: strictly 1 notification per follower-recipient pair
            if (actor) {
              if (!db.activities) db.activities = [];
              const alreadyHasFollowNotif = db.activities.some(
                (a) => a.type === 'follow' && a.actor?.id === followerId && a.recipientId === followingId
              );
              if (!alreadyHasFollowNotif) {
                const newAct: Activity = {
                  id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  type: 'follow',
                  actor,
                  recipientId: followingId,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                };
                db.activities.unshift(newAct);
              }
            }
          } else {
            db.follows[followingId] = db.follows[followingId].filter((id) => id !== followerId);
            if (db.activities) {
              db.activities = db.activities.filter(
                (a) => !(a.type === 'follow' && a.actor?.id === followerId && a.recipientId === followingId)
              );
            }
          }

          // Update follower & following counts
          const tUser = db.users.find((u) => u.id === followingId);
          if (tUser) {
            tUser.followersCount = db.follows[followingId].length;
          }
          const fUser = db.users.find((u) => u.id === followerId);
          if (fUser) {
            let fCount = 0;
            Object.values(db.follows).forEach((flist) => {
              if (flist.includes(followerId)) fCount++;
            });
            fUser.followingCount = fCount;
          }
        }
        break;
      }

      case 'SYNC_ALL': {
        // Bulk client state push for cross-device sync
        if (payload.users) {
          payload.users.forEach((u: User) => {
            const idx = db.users.findIndex((item) => item.id === u.id);
            if (idx !== -1) db.users[idx] = u;
            else db.users.push(u);
          });
        }
        if (payload.posts) {
          payload.posts.forEach((p: Post) => {
            const idx = db.posts.findIndex((item) => item.id === p.id);
            if (idx !== -1) db.posts[idx] = p;
            else db.posts.unshift(p);
          });
        }
        if (payload.stories) {
          payload.stories.forEach((s: Story) => {
            const idx = db.stories.findIndex((item) => item.id === s.id);
            if (idx !== -1) db.stories[idx] = s;
            else db.stories.unshift(s);
          });
        }
        if (payload.archivedPosts) {
          if (!db.archivedPosts) db.archivedPosts = [];
          payload.archivedPosts.forEach((p: Post) => {
            const idx = db.archivedPosts.findIndex((item) => item.id === p.id);
            if (idx !== -1) db.archivedPosts[idx] = p;
            else db.archivedPosts.unshift(p);
          });
        }
        if (payload.archivedStories) {
          if (!db.archivedStories) db.archivedStories = [];
          payload.archivedStories.forEach((s: Story) => {
            const idx = db.archivedStories.findIndex((item) => item.id === s.id);
            if (idx !== -1) db.archivedStories[idx] = s;
            else db.archivedStories.unshift(s);
          });
        }
        break;
      }

      default:
        break;
    }

    writeServerDb(db);
    return NextResponse.json({ success: true, data: db });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
}

