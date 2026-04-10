import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
