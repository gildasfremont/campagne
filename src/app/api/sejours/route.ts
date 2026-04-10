import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let result;
    if (from && to) {
      result = await sql`
        SELECT s.id, s.membre_id, s.arrivee, s.depart, s.remarque, s.created_at,
               m.prenom, m.famille_id, f.nom as famille_nom, f.branche, f.couleur
        FROM sejours s
        JOIN membres m ON m.id = s.membre_id
        JOIN familles f ON f.id = m.famille_id
        WHERE s.arrivee <= ${to}::date AND s.depart >= ${from}::date
        ORDER BY s.arrivee, f.branche, m.prenom
      `;
    } else {
      result = await sql`
        SELECT s.id, s.membre_id, s.arrivee, s.depart, s.remarque, s.created_at,
               m.prenom, m.famille_id, f.nom as famille_nom, f.branche, f.couleur
        FROM sejours s
        JOIN membres m ON m.id = s.membre_id
        JOIN familles f ON f.id = m.famille_id
        ORDER BY s.arrivee, f.branche, m.prenom
      `;
    }
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching sejours:', error);
    return NextResponse.json({ error: 'Failed to fetch sejours' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { membres, arrivee, depart, remarque } = body;

    // Create one sejour per member
    const created = [];
    for (const membreId of membres as string[]) {
      const result = await sql`
        INSERT INTO sejours (membre_id, arrivee, depart, remarque)
        VALUES (${membreId}, ${arrivee}::date, ${depart}::date, ${remarque || null})
        RETURNING *
      `;
      created.push(result.rows[0]);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating sejours:', error);
    return NextResponse.json({ error: 'Failed to create sejours' }, { status: 500 });
  }
}
