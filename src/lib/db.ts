import { sql } from '@vercel/postgres';

export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS familles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nom TEXT NOT NULL,
      branche TEXT NOT NULL,
      couleur TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS membres (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      famille_id UUID NOT NULL REFERENCES familles(id) ON DELETE CASCADE,
      prenom TEXT NOT NULL,
      est_permanent BOOLEAN NOT NULL DEFAULT true
    )
  `;

  // Migration: add est_cache column
  await sql`
    ALTER TABLE membres ADD COLUMN IF NOT EXISTS est_cache BOOLEAN NOT NULL DEFAULT false
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sejours (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      membre_id UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
      arrivee DATE NOT NULL,
      depart DATE NOT NULL,
      remarque TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chambres (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nom TEXT NOT NULL,
      couchages INTEGER NOT NULL,
      maison TEXT NOT NULL CHECK (maison IN ('grande', 'petite'))
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS affectations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chambre_id UUID NOT NULL REFERENCES chambres(id) ON DELETE CASCADE,
      sejour_id UUID NOT NULL REFERENCES sejours(id) ON DELETE CASCADE,
      nuit DATE NOT NULL,
      UNIQUE (chambre_id, sejour_id, nuit)
    )
  `;
}

export { sql };
