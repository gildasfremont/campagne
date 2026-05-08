'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Famille, MembreWithFamille } from '@/lib/types';
import { getFamilles, getMembres, addMembre, createSejours } from '@/lib/local-store';
import DateRangeField from './DateRangeField';

const IDENTITY_KEY = 'campagne_membre_id';

export default function NouveauSejourForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedFamilleId = params.get('famille');

  const [familles, setFamilles] = useState<Famille[]>([]);
  const [membres, setMembres] = useState<MembreWithFamille[]>([]);
  const [currentMembreId, setCurrentMembreId] = useState<string | null>(null);

  const [arrivee, setArrivee] = useState(params.get('from') ?? '');
  const [depart, setDepart] = useState(params.get('to') ?? '');
  const [selectedFamilleId, setSelectedFamilleId] = useState('');
  const [selectedMembreIds, setSelectedMembreIds] = useState<Set<string>>(new Set());
  const [remarque, setRemarque] = useState('');
  const [newMembreName, setNewMembreName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFamilles(getFamilles());
    setMembres(getMembres());
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored) setCurrentMembreId(stored);
  }, []);

  const visibleMembres = useMemo(
    () => membres.filter((m) => !m.est_cache),
    [membres]
  );

  const famillesMembres = useMemo(
    () => visibleMembres.filter((m) => m.famille_id === selectedFamilleId),
    [visibleMembres, selectedFamilleId]
  );

  // Initial famille selection (preselected, then current member's, then first)
  useEffect(() => {
    if (selectedFamilleId || familles.length === 0) return;
    const currentMembre = membres.find((m) => m.id === currentMembreId);
    setSelectedFamilleId(
      preselectedFamilleId || currentMembre?.famille_id || familles[0].id
    );
  }, [familles, membres, currentMembreId, preselectedFamilleId, selectedFamilleId]);

  // Pre-select permanent members when famille changes
  useEffect(() => {
    if (!selectedFamilleId) return;
    const permanentIds = new Set(
      famillesMembres.filter((m) => m.est_permanent).map((m) => m.id)
    );
    setSelectedMembreIds(permanentIds);
  }, [selectedFamilleId, famillesMembres]);

  const branches = useMemo(() => {
    const map = new Map<string, Famille[]>();
    for (const f of familles) {
      const list = map.get(f.branche) || [];
      list.push(f);
      map.set(f.branche, list);
    }
    return map;
  }, [familles]);

  const saveIdentity = (id: string) => {
    setCurrentMembreId(id);
    if (id) localStorage.setItem(IDENTITY_KEY, id);
    else localStorage.removeItem(IDENTITY_KEY);
    if (!preselectedFamilleId && id) {
      const m = membres.find((x) => x.id === id);
      if (m) setSelectedFamilleId(m.famille_id);
    }
  };

  const toggleMembre = (id: string) => {
    setSelectedMembreIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddTemporaryMember = () => {
    if (!newMembreName.trim() || !selectedFamilleId) return;
    const created = addMembre({
      famille_id: selectedFamilleId,
      prenom: newMembreName.trim(),
      est_permanent: false,
    });
    setMembres(getMembres());
    setSelectedMembreIds((prev) => new Set(prev).add(created.id));
    setNewMembreName('');
  };

  const canSubmit = selectedMembreIds.size > 0 && arrivee && depart && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    createSejours({
      membres: Array.from(selectedMembreIds),
      arrivee,
      depart,
      remarque: remarque || null,
    });
    router.push('/');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/')}
          aria-label="Retour"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Nouveau séjour</h1>
      </div>

      {/* Identity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Qui êtes-vous ?</label>
        <select
          value={currentMembreId || ''}
          onChange={(e) => saveIdentity(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Choisir...</option>
          {visibleMembres
            .filter((m) => m.est_permanent)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.prenom} {m.famille_nom}
              </option>
            ))}
        </select>
      </div>

      {/* Dates */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
        <DateRangeField
          arrivee={arrivee}
          depart={depart}
          onChange={(a, d) => {
            setArrivee(a);
            setDepart(d);
          }}
        />
      </div>

      {/* Famille */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
        <select
          value={selectedFamilleId}
          onChange={(e) => setSelectedFamilleId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        >
          {Array.from(branches.entries()).map(([branche, fams]) => (
            <optgroup key={branche} label={branche}>
              {fams.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Members */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Membres</label>
        <div className="space-y-1.5">
          {famillesMembres.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedMembreIds.has(m.id)}
                onChange={() => toggleMembre(m.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{m.prenom}</span>
              {!m.est_permanent && (
                <span className="text-xs text-gray-400">(ponctuel)</span>
              )}
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newMembreName}
            onChange={(e) => setNewMembreName(e.target.value)}
            placeholder="Ajouter (nounou, ami...)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTemporaryMember()}
          />
          <button
            onClick={handleAddTemporaryMember}
            className="px-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Remarque */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarque</label>
        <textarea
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          placeholder="Champ libre (optionnel)"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/')}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
        >
          {submitting ? '...' : 'Créer'}
        </button>
      </div>
    </div>
  );
}
