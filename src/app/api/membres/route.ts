import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT m.id, m.famille_id, m.prenom, m.est_permanent, m.est_cache,
             f.nom as famille_nom, f.branche, f.couleur
      FROM membres m
      JOIN familles f ON f.id = m.famille_id
      ORDER BY f.branche, f.nom, m.prenom
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching membres:', error);
    return NextResponse.json({ error: 'Failed to fetch membres' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { famille_id, prenom, est_permanent } = await request.json();
    const result = await sql`
      INSERT INTO membres (famille_id, prenom, est_permanent)
      VALUES (${famille_id}, ${prenom}, ${est_permanent ?? false})
      RETURNING *
    `;
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating membre:', error);
    return NextResponse.json({ error: 'Failed to create membre' }, { status: 500 });
  }
}
