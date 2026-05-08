import { v4 as uuidv4 } from 'uuid';
import { Famille, MembreWithFamille, Sejour, SejourWithDetails } from './types';
import { SEED_FAMILLES, SEED_MEMBRES } from './seed-data';

const MEMBRES_KEY = 'campagne_membres_v1';
const SEJOURS_KEY = 'campagne_sejours_v1';

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFamilles(): Famille[] {
  return SEED_FAMILLES;
}

export function getMembres(): MembreWithFamille[] {
  return readJSON<MembreWithFamille[]>(MEMBRES_KEY, SEED_MEMBRES);
}

function saveMembres(membres: MembreWithFamille[]): void {
  writeJSON(MEMBRES_KEY, membres);
}

export function addMembre(input: {
  famille_id: string;
  prenom: string;
  est_permanent: boolean;
}): MembreWithFamille {
  const famille = SEED_FAMILLES.find((f) => f.id === input.famille_id);
  if (!famille) throw new Error('Famille not found');
  const membre: MembreWithFamille = {
    id: uuidv4(),
    famille_id: famille.id,
    prenom: input.prenom,
    est_permanent: input.est_permanent,
    est_cache: false,
    famille_nom: famille.nom,
    branche: famille.branche,
    couleur: famille.couleur,
  };
  const all = getMembres();
  saveMembres([...all, membre]);
  return membre;
}

export function updateMembre(
  id: string,
  patch: { prenom?: string; est_cache?: boolean }
): MembreWithFamille | null {
  const all = getMembres();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updated: MembreWithFamille = {
    ...all[idx],
    ...(patch.prenom !== undefined ? { prenom: patch.prenom } : {}),
    ...(patch.est_cache !== undefined ? { est_cache: patch.est_cache } : {}),
  };
  const next = [...all];
  next[idx] = updated;
  saveMembres(next);
  return updated;
}

function getRawSejours(): Sejour[] {
  return readJSON<Sejour[]>(SEJOURS_KEY, []);
}

function saveRawSejours(sejours: Sejour[]): void {
  writeJSON(SEJOURS_KEY, sejours);
}

function decorateSejour(s: Sejour, membres: MembreWithFamille[]): SejourWithDetails | null {
  const m = membres.find((x) => x.id === s.membre_id);
  if (!m) return null;
  return {
    ...s,
    prenom: m.prenom,
    famille_nom: m.famille_nom,
    branche: m.branche,
    couleur: m.couleur,
    famille_id: m.famille_id,
  };
}

export function getSejours(from?: string, to?: string): SejourWithDetails[] {
  const raw = getRawSejours();
  const membres = getMembres();
  const filtered = from && to
    ? raw.filter((s) => s.arrivee <= to && s.depart >= from)
    : raw;
  return filtered
    .map((s) => decorateSejour(s, membres))
    .filter((s): s is SejourWithDetails => s !== null)
    .sort((a, b) => {
      if (a.arrivee !== b.arrivee) return a.arrivee.localeCompare(b.arrivee);
      if (a.branche !== b.branche) return a.branche.localeCompare(b.branche);
      return a.prenom.localeCompare(b.prenom);
    });
}

export function createSejours(input: {
  membres: string[];
  arrivee: string;
  depart: string;
  remarque: string | null;
}): Sejour[] {
  const now = new Date().toISOString();
  const created: Sejour[] = input.membres.map((membre_id) => ({
    id: uuidv4(),
    membre_id,
    arrivee: input.arrivee,
    depart: input.depart,
    remarque: input.remarque,
    created_at: now,
  }));
  saveRawSejours([...getRawSejours(), ...created]);
  return created;
}

export function updateSejour(
  id: string,
  patch: { arrivee?: string; depart?: string; remarque?: string | null }
): Sejour | null {
  const all = getRawSejours();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated: Sejour = {
    ...all[idx],
    ...(patch.arrivee !== undefined ? { arrivee: patch.arrivee } : {}),
    ...(patch.depart !== undefined ? { depart: patch.depart } : {}),
    ...(patch.remarque !== undefined ? { remarque: patch.remarque } : {}),
  };
  const next = [...all];
  next[idx] = updated;
  saveRawSejours(next);
  return updated;
}

export function deleteSejour(id: string): boolean {
  const all = getRawSejours();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  saveRawSejours(next);
  return true;
}

export function restoreSejour(sejour: Sejour): void {
  saveRawSejours([...getRawSejours(), sejour]);
}
