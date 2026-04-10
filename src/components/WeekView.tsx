'use client';

import { useMemo } from 'react';
import { SejourWithDetails } from '@/lib/types';
import {
  getWeekDays,
  format,
  formatDateParam,
  isNightOccupied,
  fr,
} from '@/lib/dates';
import OccupancyBadge from './OccupancyBadge';

interface WeekViewProps {
  currentDate: Date;
  sejours: SejourWithDetails[];
  onEditSejour: (sejour: SejourWithDetails) => void;
}

export default function WeekView({ currentDate, sejours, onEditSejour }: WeekViewProps) {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Occupancy per night
  const occupancy = useMemo(() => {
    return days.map((day) =>
      sejours.filter((s) => isNightOccupied(day, s.arrivee, s.depart)).length
    );
  }, [days, sejours]);

  // People present each day
  const dayPresence = useMemo(() => {
    return days.map((day) =>
      sejours.filter((s) => isNightOccupied(day, s.arrivee, s.depart))
    );
  }, [days, sejours]);

  const today = formatDateParam(new Date());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {days.map((day, i) => {
          const dateStr = formatDateParam(day);
          const isToday = dateStr === today;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const present = dayPresence[i];

          return (
            <div
              key={dateStr}
              className={`bg-white p-2 min-h-[200px]
                ${isWeekend ? 'bg-gray-50' : ''}
                ${isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}
              `}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase">
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'd MMM', { locale: fr })}
                  </div>
                </div>
                <OccupancyBadge count={occupancy[i]} />
              </div>

              {/* People present */}
              <div className="space-y-0.5">
                {present.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onEditSejour(s)}
                    className="w-full text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-800 truncate">{s.prenom}</span>
                    <span className="text-gray-400 truncate text-[10px]">{s.famille_nom}</span>
                  </button>
                ))}
                {present.length === 0 && (
                  <div className="text-xs text-gray-300 italic">Personne</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
