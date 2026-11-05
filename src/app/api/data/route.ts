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

      case 'SEND_MESSAGE': {
        const { conversationId, message } = payload;
        if (conversationId && message) {
          if (!db.messages[conversationId]) {
            db.messages[conversationId] = [];
          }
          db.messages[conversationId].push(message);

          // Update conversation's last message
          const conv = db.conversations.find((c) => c.id === conversationId);
          if (conv) {
            conv.lastMessage = message;
          }
        }
        break;
      }

      case 'ADD_ACTIVITY': {
        const { activity } = payload;
        if (activity && activity.id) {
          db.activities = [activity, ...(db.activities || []).filter((a) => a.id !== activity.id)];
        }
        break;
      }

      case 'TOGGLE_FOLLOW': {
        const { followerId, followingId, actor } = payload;
        if (followerId && followingId) {
          if (!db.follows) db.follows = {};
          if (!db.follows[followingId]) db.follows[followingId] = [];

          const isFollowing = db.follows[followingId].includes(followerId);
          if (isFollowing) {
            db.follows[followingId] = db.follows[followingId].filter((id) => id !== followerId);
            if (db.activities) {
              db.activities = db.activities.filter(
                (a) => !(a.type === 'follow' && a.actor?.id === followerId && a.recipientId === followingId)
              );
            }
          } else {
            db.follows[followingId].push(followerId);
            if (actor) {
              const newAct: Activity = {
                id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                type: 'follow',
                actor,
                recipientId: followingId,
                createdAt: new Date().toISOString(),
                isRead: false,
              };
              if (!db.activities) db.activities = [];
              db.activities = [newAct, ...db.activities.filter((a) => a.id !== newAct.id)];
            }
          }

          // Update user counts
          const targetUser = db.users.find((u) => u.id === followingId);
          if (targetUser) {
            targetUser.followersCount = db.follows[followingId].length;
          }
          const followerUser = db.users.find((u) => u.id === followerId);
          if (followerUser) {
            let followingCount = 0;
            Object.values(db.follows).forEach((followers) => {
              if (followers.includes(followerId)) followingCount++;
            });
            followerUser.followingCount = followingCount;
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

