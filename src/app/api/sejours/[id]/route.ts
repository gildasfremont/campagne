import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { arrivee, depart, remarque } = body;

    const result = await sql`
      UPDATE sejours
      SET arrivee = COALESCE(${arrivee}::date, arrivee),
          depart = COALESCE(${depart}::date, depart),
          remarque = COALESCE(${remarque}, remarque)
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sejour not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating sejour:', error);
    return NextResponse.json({ error: 'Failed to update sejour' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await sql`
      DELETE FROM sejours WHERE id = ${id}::uuid RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Sejour not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting sejour:', error);
    return NextResponse.json({ error: 'Failed to delete sejour' }, { status: 500 });
  }
}
