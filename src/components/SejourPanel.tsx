'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SejourWithDetails } from '@/lib/types';
import { updateSejour } from '@/lib/local-store';

interface SejourPanelProps {
  sejour: SejourWithDetails;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: (sejour: SejourWithDetails) => void;
}

export default function SejourPanel({ sejour, onClose, onUpdated, onDeleted }: SejourPanelProps) {
  const router = useRouter();
  const [arrivee, setArrivee] = useState(sejour.arrivee.split('T')[0]);
  const [depart, setDepart] = useState(sejour.depart.split('T')[0]);
  const [remarque, setRemarque] = useState(sejour.remarque || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setArrivee(sejour.arrivee.split('T')[0]);
    setDepart(sejour.depart.split('T')[0]);
    setRemarque(sejour.remarque || '');
  }, [sejour]);

  const handleSubmit = () => {
    setLoading(true);
    updateSejour(sejour.id, { arrivee, depart, remarque: remarque || null });
    setLoading(false);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {sejour.prenom} — Modifier le séjour
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => router.push(`/sejour/${sejour.id}`)}
              aria-label="Ouvrir en grand"
              title="Ouvrir en grand"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-1"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Famille (read-only) */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: sejour.couleur }}
          />
          <span>{sejour.famille_nom}</span>
          <span className="text-xs text-gray-400">({sejour.branche})</span>
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
        <div className="mb-4">
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
            onClick={() => onDeleted(sejour)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
          >
            Supprimer
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '...' : 'Modifier'}
          </button>
        </div>
      </div>
    </div>
  );
}
