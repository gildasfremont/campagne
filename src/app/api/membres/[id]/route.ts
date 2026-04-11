import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { prenom, est_cache } = body;

    const result = await sql`
      UPDATE membres
      SET prenom = COALESCE(${prenom}, prenom),
          est_cache = COALESCE(${est_cache}, est_cache)
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Membre not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating membre:', error);
    return NextResponse.json({ error: 'Failed to update membre' }, { status: 500 });
  }
}
