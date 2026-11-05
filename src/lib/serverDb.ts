import fs from 'fs';
import path from 'path';
import { User, Post, Story, Conversation, Message, Comment, Activity } from '@/types/velo';

export interface VeloServerDb {
  users: User[];
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  comments: Record<string, Comment[]>;
  activities: Activity[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'velo-db.json');

// In-memory cache for fast read/writes across API calls
let memoryDb: VeloServerDb | null = null;

function getEmptyDb(): VeloServerDb {
  return {
    users: [],
    posts: [],
    stories: [],
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

  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      memoryDb = JSON.parse(raw);
      // Ensure all keys exist
      if (!memoryDb!.users) memoryDb!.users = [];
      if (!memoryDb!.posts) memoryDb!.posts = [];
      if (!memoryDb!.stories) memoryDb!.stories = [];
      if (!memoryDb!.conversations) memoryDb!.conversations = [];
      if (!memoryDb!.messages) memoryDb!.messages = {};
      if (!memoryDb!.comments) memoryDb!.comments = {};
      if (!memoryDb!.activities) memoryDb!.activities = [];
      return memoryDb!;
    }
  } catch (err) {
    console.error('Failed to read server DB:', err);
  }

  memoryDb = getEmptyDb();
  writeServerDb(memoryDb);
  return memoryDb;
}

export function writeServerDb(data: VeloServerDb): void {
  try {
    memoryDb = data;
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write server DB:', err);
  }
}

