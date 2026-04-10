'use client';

import { useMemo, useState, useCallback } from 'react';
import { SejourWithDetails } from '@/lib/types';
import {
  getMonthDays,
  format,
  formatDateParam,
  isNightOccupied,
  differenceInDays,
  parseISO,
  fr,
} from '@/lib/dates';
import OccupancyBadge from './OccupancyBadge';

interface MonthViewProps {
  currentDate: Date;
  sejours: SejourWithDetails[];
  onSelectDates: (start: Date, end: Date) => void;
  onEditSejour: (sejour: SejourWithDetails) => void;
}

// Group sejours by branche for row layout
interface BrancheRow {
  branche: string;
  couleur: string;
  sejours: SejourWithDetails[];
}

export default function MonthView({ currentDate, sejours, onSelectDates, onEditSejour }: MonthViewProps) {
  const days = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Calculate nightly occupancy for each day
  const occupancy = useMemo(() => {
    return days.map((day) => {
      return sejours.filter((s) => isNightOccupied(day, s.arrivee, s.depart)).length;
    });
  }, [days, sejours]);

  // Group sejours into rows by branche+famille
  const rows = useMemo(() => {
    const brancheMap = new Map<string, BrancheRow>();
    for (const s of sejours) {
      const key = s.branche;
      if (!brancheMap.has(key)) {
        brancheMap.set(key, { branche: s.branche, couleur: s.couleur, sejours: [] });
      }
      brancheMap.get(key)!.sejours.push(s);
    }
    return Array.from(brancheMap.values());
  }, [sejours]);

  const handleDayMouseDown = useCallback((dayIndex: number) => {
    setIsSelecting(true);
    setSelectionStart(dayIndex);
    setSelectionEnd(dayIndex);
  }, []);

  const handleDayMouseEnter = useCallback((dayIndex: number) => {
    if (isSelecting) {
      setSelectionEnd(dayIndex);
    }
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      onSelectDates(days[start], days[end]);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [isSelecting, selectionStart, selectionEnd, days, onSelectDates]);

  const getSelectionRange = () => {
    if (selectionStart === null || selectionEnd === null) return { start: -1, end: -1 };
    return {
      start: Math.min(selectionStart, selectionEnd),
      end: Math.max(selectionStart, selectionEnd),
    };
  };

  const sel = getSelectionRange();
  const today = formatDateParam(new Date());

  return (
    <div
      className="overflow-x-auto select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="min-w-[800px]">
        {/* Day headers */}
        <div className="flex border-b border-gray-200">
          <div className="w-28 shrink-0" />
          {days.map((day, i) => {
            const dateStr = formatDateParam(day);
            const isToday = dateStr === today;
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isSelected = i >= sel.start && i <= sel.end;
            return (
              <div
                key={dateStr}
                className={`flex-1 min-w-[38px] text-center py-1 cursor-pointer border-r border-gray-100 last:border-r-0
                  ${isWeekend ? 'bg-gray-50' : ''}
                  ${isToday ? 'bg-blue-50' : ''}
                  ${isSelected ? 'bg-blue-100' : ''}
                `}
                onMouseDown={() => handleDayMouseDown(i)}
                onMouseEnter={() => handleDayMouseEnter(i)}
              >
                <div className="text-[10px] text-gray-500 uppercase">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Occupancy row */}
        <div className="flex border-b border-gray-300">
          <div className="w-28 shrink-0 px-2 py-1 text-xs text-gray-500 font-medium flex items-center">
            Couchages
          </div>
          {days.map((day, i) => (
            <div
              key={`occ-${formatDateParam(day)}`}
              className="flex-1 min-w-[38px] flex items-center justify-center py-1 border-r border-gray-100 last:border-r-0"
            >
              <OccupancyBadge count={occupancy[i]} />
            </div>
          ))}
        </div>

        {/* Sejour rows by branche */}
        {rows.map((row) => {
          // Collect unique members within this branche
          const memberSejours = new Map<string, SejourWithDetails[]>();
          for (const s of row.sejours) {
            const key = s.membre_id;
            if (!memberSejours.has(key)) memberSejours.set(key, []);
            memberSejours.get(key)!.push(s);
          }

          return Array.from(memberSejours.entries()).map(([membreId, mSejours]) => {
            const firstSejour = mSejours[0];
            return (
              <div key={membreId} className="flex border-b border-gray-100 hover:bg-gray-50/50">
                <div
                  className="w-28 shrink-0 px-2 py-1.5 text-xs truncate flex items-center gap-1"
                  title={`${firstSejour.prenom} ${firstSejour.famille_nom}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: firstSejour.couleur }}
                  />
                  <span className="text-gray-700 truncate">{firstSejour.prenom}</span>
                </div>
                <div className="flex flex-1 relative">
                  {days.map((day) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                      <div
                        key={formatDateParam(day)}
                        className={`flex-1 min-w-[38px] border-r border-gray-100 last:border-r-0 ${isWeekend ? 'bg-gray-50/50' : ''}`}
                      />
                    );
                  })}
                  {/* Render sejour bars as absolute overlays */}
                  {mSejours.map((sejour) => {
                    const arrDate = parseISO(sejour.arrivee);
                    const depDate = parseISO(sejour.depart);
                    const monthStart = days[0];
                    const monthEnd = days[days.length - 1];

                    // Clamp to visible range
                    const visStart = arrDate < monthStart ? monthStart : arrDate;
                    const visEnd = depDate > monthEnd ? monthEnd : depDate;

                    const startIdx = differenceInDays(visStart, monthStart);
                    const endIdx = differenceInDays(visEnd, monthStart);
                    const totalDays = days.length;

                    const leftPercent = (startIdx / totalDays) * 100;
                    const widthPercent = ((endIdx - startIdx + 1) / totalDays) * 100;

                    return (
                      <button
                        key={sejour.id}
                        className="absolute top-0.5 bottom-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: sejour.couleur,
                          opacity: 0.7,
                        }}
                        onClick={() => onEditSejour(sejour)}
                        title={`${sejour.prenom} — ${sejour.arrivee.split('T')[0]} → ${sejour.depart.split('T')[0]}${sejour.remarque ? ` (${sejour.remarque})` : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          });
        })}

        {/* Empty state */}
        {sejours.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            Aucun séjour ce mois-ci. Sélectionnez des dates pour en créer un.
          </div>
        )}
      </div>
    </div>
  );
}
