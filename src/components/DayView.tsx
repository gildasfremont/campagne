'use client';

import { useMemo } from 'react';
import { SejourWithDetails } from '@/lib/types';
import { isNightOccupied, format, fr } from '@/lib/dates';
import OccupancyBadge from './OccupancyBadge';

interface DayViewProps {
  currentDate: Date;
  sejours: SejourWithDetails[];
  onEditSejour: (sejour: SejourWithDetails) => void;
}

export default function DayView({ currentDate, sejours, onEditSejour }: DayViewProps) {
  const present = useMemo(
    () => sejours.filter((s) => isNightOccupied(currentDate, s.arrivee, s.depart)),
    [currentDate, sejours]
  );

  // Group by branche
  const groupedByBranche = useMemo(() => {
    const map = new Map<string, { couleur: string; rows: SejourWithDetails[] }>();
    for (const s of present) {
      const entry = map.get(s.branche) || { couleur: s.couleur, rows: [] };
      entry.rows.push(s);
      map.set(s.branche, entry);
    }
    return Array.from(map.entries())
      .map(([branche, { couleur, rows }]) => ({ branche, couleur, rows }))
      .sort((a, b) => a.branche.localeCompare(b.branche));
  }, [present]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase">
            {format(currentDate, 'EEEE', { locale: fr })}
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>
        <OccupancyBadge count={present.length} />
      </div>

      {present.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">Personne ce jour-là</div>
      ) : (
        <div className="space-y-4">
          {groupedByBranche.map((group) => (
            <div key={group.branche}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.couleur }}
                />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {group.branche}
                </span>
                <span className="text-xs text-gray-400">({group.rows.length})</span>
              </div>
              <div className="space-y-1 ml-5">
                {group.rows.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onEditSejour(s)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <span className="text-gray-900 font-medium">{s.prenom}</span>
                    <span className="text-gray-400 text-xs truncate">{s.famille_nom}</span>
                    {s.remarque && (
                      <span className="text-xs text-gray-400 italic truncate">— {s.remarque}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
