'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SejourWithDetails } from '@/lib/types';
import { getSejours, updateSejour, deleteSejour as deleteLocal } from '@/lib/local-store';

export default function EditSejourForm() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sejour, setSejour] = useState<SejourWithDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [arrivee, setArrivee] = useState('');
  const [depart, setDepart] = useState('');
  const [remarque, setRemarque] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const all = getSejours();
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
    </div>
  );
}
