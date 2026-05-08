'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SejourWithDetails } from '@/lib/types';
import { getSejours } from '@/lib/local-store';
import { format, parseISO, fr, formatDateParam, differenceInDays } from '@/lib/dates';

type Filter = 'all' | 'upcoming' | 'past';

export default function SejoursListe() {
  const router = useRouter();
  const [sejours, setSejours] = useState<SejourWithDetails[]>([]);
  const [filter, setFilter] = useState<Filter>('upcoming');

  useEffect(() => {
    setSejours(getSejours());
  }, []);

  const today = formatDateParam(new Date());

  const filtered = useMemo(() => {
    let list = sejours;
    if (filter === 'upcoming') list = list.filter((s) => s.depart >= today);
    else if (filter === 'past') list = list.filter((s) => s.depart < today);
    return list.slice().sort((a, b) => a.arrivee.localeCompare(b.arrivee));
  }, [sejours, filter, today]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, SejourWithDetails[]>();
    for (const s of filtered) {
      const key = s.arrivee.slice(0, 7);
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
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
        <h1 className="text-xl font-semibold text-gray-900 flex-1">Séjours</h1>
        <Link
          href="/sejour/nouveau"
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          + Séjour
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 mb-5 w-fit">
        {(['upcoming', 'past', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passés' : 'Tous'}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">Aucun séjour</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, list]) => (
            <div key={month}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: fr })}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {list.map((s) => {
                  const arr = parseISO(s.arrivee);
                  const dep = parseISO(s.depart);
                  const nights = differenceInDays(dep, arr);
                  return (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/sejour/${s.id}`)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.couleur }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-gray-900">{s.prenom}</span>
                          <span className="text-xs text-gray-400 truncate">{s.famille_nom}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(arr, 'd MMM', { locale: fr })} → {format(dep, 'd MMM', { locale: fr })}
                          <span className="text-gray-400"> · {nights} nuit{nights > 1 ? 's' : ''}</span>
                        </div>
                        {s.remarque && (
                          <div className="text-xs text-gray-400 italic truncate mt-0.5">
                            {s.remarque}
                          </div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
