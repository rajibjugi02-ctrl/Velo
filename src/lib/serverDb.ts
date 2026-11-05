import fs from 'fs';
import path from 'path';
import { User, Post, Story, Conversation, Message, Comment, Activity } from '@/types/velo';

export interface VeloServerDb {
  users: User[];
  posts: Post[];
  archivedPosts: Post[];
  stories: Story[];
  archivedStories: Story[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  comments: Record<string, Comment[]>;
  activities: Activity[];
}

// In Vercel serverless, the repository filesystem is read-only, only /tmp is writable
const IS_VERCEL = Boolean(process.env.VERCEL);
const PRIMARY_PATH = path.join(process.cwd(), 'data', 'velo-db.json');
const VERCEL_TMP_PATH = path.join('/tmp', 'velo-db.json');
const DB_PATH = IS_VERCEL ? VERCEL_TMP_PATH : PRIMARY_PATH;

let memoryDb: VeloServerDb | null = null;

function getEmptyDb(): VeloServerDb {
  return {
    users: [],
    posts: [],
    archivedPosts: [],
    stories: [],
    archivedStories: [],
    conversations: [],
    messages: {},
    comments: {},
    activities: [],
  };
}

export function readServerDb(): VeloServerDb {
  if (memoryDb) {
    return memoryDb;
  }

  // Check writable path first, then fallback to packaged data file
  const pathsToCheck = [DB_PATH, PRIMARY_PATH];

  for (const p of pathsToCheck) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        memoryDb = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          posts: Array.isArray(parsed.posts) ? parsed.posts : [],
          archivedPosts: Array.isArray(parsed.archivedPosts) ? parsed.archivedPosts : [],
          stories: Array.isArray(parsed.stories) ? parsed.stories : [],
          archivedStories: Array.isArray(parsed.archivedStories) ? parsed.archivedStories : [],
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messages: parsed.messages || {},
          comments: parsed.comments || {},
          activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        };
        return memoryDb;
      }
    } catch {}
  }

  memoryDb = getEmptyDb();
  writeServerDb(memoryDb);
  return memoryDb;
}

export function writeServerDb(data: VeloServerDb): void {
  try {
    memoryDb = data;
    const targetPath = DB_PATH;
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // If writing to primary failed (e.g. read-only on serverless), attempt writing to /tmp
    try {
      const tmpDir = path.dirname(VERCEL_TMP_PATH);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(VERCEL_TMP_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }
}
