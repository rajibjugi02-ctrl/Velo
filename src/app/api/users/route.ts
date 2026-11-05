import { NextResponse } from 'next/server';
import { readServerDb, writeServerDb } from '@/lib/serverDb';
import { User } from '@/types/velo';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const db = readServerDb();

    if (!query) {
      return NextResponse.json({ success: true, users: db.users });
    }

    const filtered = db.users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.fullName.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query))
    );

    return NextResponse.json({ success: true, users: filtered });
  } catch {
    return NextResponse.json({ success: false, users: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user: User = await req.json();
    if (!user || !user.id || !user.username) {
      return NextResponse.json({ success: false, error: 'Invalid user payload' }, { status: 400 });
    }

    const db = readServerDb();
    const existingIndex = db.users.findIndex(
      (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
    );

    if (existingIndex !== -1) {
      db.users[existingIndex] = { ...db.users[existingIndex], ...user };
    } else {
      db.users.push(user);
    }

    writeServerDb(db);
    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save user' }, { status: 500 });
  }
}
