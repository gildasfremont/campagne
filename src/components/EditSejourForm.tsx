'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SejourWithDetails } from '@/lib/types';
import { getSejours, updateSejour, deleteSejour as deleteLocal } from '@/lib/local-store';
import { differenceInDays, format, fr, parseISO } from '@/lib/dates';

export default function EditSejourForm() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sejour, setSejour] = useState<SejourWithDetails | null>(null);
  const [allSejours, setAllSejours] = useState<SejourWithDetails[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [arrivee, setArrivee] = useState('');
  const [depart, setDepart] = useState('');
  const [remarque, setRemarque] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const all = getSejours();
    setAllSejours(all);
    const found = all.find((s) => s.id === id);
    if (!found) {
      setNotFound(true);
      return;
    }
    setSejour(found);
    setArrivee(found.arrivee.split('T')[0]);
    setDepart(found.depart.split('T')[0]);
    setRemarque(found.remarque || '');
  }, [id]);

  const familySejours = useMemo(() => {
    if (!sejour) return [];
    return allSejours
      .filter((s) => s.famille_id === sejour.famille_id && s.id !== sejour.id)
      .slice()
      .sort((a, b) => a.arrivee.localeCompare(b.arrivee));
  }, [allSejours, sejour]);

  const handleUpdate = () => {
    if (!sejour || submitting) return;
    setSubmitting(true);
    updateSejour(sejour.id, { arrivee, depart, remarque: remarque || null });
    router.push('/');
  };

  const handleDelete = () => {
    if (!sejour || submitting) return;
    setSubmitting(true);
    deleteLocal(sejour.id);
    router.push('/');
  };

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500">Séjour introuvable.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Retour au calendrier
        </button>
      </div>
    );
  }

  if (!sejour) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 text-sm text-gray-400">Chargement…</div>
    );
  }

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
        <h1 className="text-xl font-semibold text-gray-900">
          Séjour de {sejour.prenom}
        </h1>
      </div>

      {/* Famille (read-only) */}
      <div className="mb-4">
        <span className="block text-sm font-medium text-gray-700 mb-1">Famille</span>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: sejour.couleur }}
          />
          <span>{sejour.famille_nom}</span>
          <span className="text-xs text-gray-400">({sejour.branche})</span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label>
          <input
            type="date"
            value={arrivee}
            onChange={(e) => setArrivee(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
          <input
            type="date"
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      {/* Remarque */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarque</label>
        <textarea
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          placeholder="Champ libre (optionnel)"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={submitting}
          className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg"
        >
          Supprimer
        </button>
        <div className="flex-1" />
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Annuler
        </button>
        <button
          onClick={handleUpdate}
          disabled={submitting}
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
        >
          {submitting ? '…' : 'Modifier'}
        </button>
      </div>

      {/* Other sejours from the same family */}
      {familySejours.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Autres séjours de {sejour.famille_nom}
            <span className="text-xs text-gray-400 font-normal ml-1">
              ({familySejours.length})
            </span>
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {familySejours.map((s) => {
              const arr = parseISO(s.arrivee);
              const dep = parseISO(s.depart);
              const nights = differenceInDays(dep, arr);
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/sejour/${s.id}`)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.couleur }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{s.prenom}</div>
                    <div className="text-xs text-gray-500">
                      {format(arr, 'd MMM yyyy', { locale: fr })} → {format(dep, 'd MMM yyyy', { locale: fr })}
                      <span className="text-gray-400"> · {nights} nuit{nights > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
