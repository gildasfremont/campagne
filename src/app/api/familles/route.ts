import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, nom, branche, couleur
      FROM familles
      ORDER BY branche, nom
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching familles:', error);
    return NextResponse.json({ error: 'Failed to fetch familles' }, { status: 500 });
  }
}
