import { NextResponse } from 'next/server';
import { readServerDb, writeServerDb } from '@/lib/serverDb';
import { User, Post, Story, Message } from '@/types/velo';

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

      case 'DELETE_POST': {
        const { postId } = payload;
        if (postId) {
          db.posts = db.posts.filter((p) => p.id !== postId);
        }
        break;
      }

      case 'TOGGLE_LIKE_POST': {
        const { postId, userId } = payload;
        const post = db.posts.find((p) => p.id === postId);
        if (post) {
          const isLiked = post.isLiked;
          post.isLiked = !isLiked;
          post.likesCount = Math.max(0, post.likesCount + (isLiked ? -1 : 1));
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

      case 'DELETE_STORY': {
        const { storyId } = payload;
        if (storyId) {
          db.stories = db.stories.filter((s) => s.id !== storyId);
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
