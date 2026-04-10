import { NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { FAMILLES_SEED } from '@/lib/seed-data';

export async function POST() {
  try {
    await initDatabase();

    // Check if already seeded
    const existing = await sql`SELECT COUNT(*) as count FROM familles`;
    if (Number(existing.rows[0].count) > 0) {
      return NextResponse.json({ message: 'Already seeded' });
    }

    for (const f of FAMILLES_SEED) {
      const result = await sql`
        INSERT INTO familles (nom, branche, couleur)
        VALUES (${f.nom}, ${f.branche}, ${f.couleur})
        RETURNING id
      `;
      const familleId = result.rows[0].id;

      for (const prenom of f.membres) {
        await sql`
          INSERT INTO membres (famille_id, prenom, est_permanent)
          VALUES (${familleId}, ${prenom}, true)
        `;
      }
    }

    return NextResponse.json({ success: true, message: 'Seed completed' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
