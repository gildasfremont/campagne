'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { format, parseISO, formatDateParam, differenceInDays } from '@/lib/dates';

interface DateRangeFieldProps {
  arrivee: string;
  depart: string;
  onChange: (arrivee: string, depart: string) => void;
}

export default function DateRangeField({ arrivee, depart, onChange }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const range: DateRange | undefined =
    arrivee && depart
      ? { from: parseISO(arrivee), to: parseISO(depart) }
      : arrivee
      ? { from: parseISO(arrivee), to: undefined }
      : undefined;

  const handleSelect = (selected: DateRange | undefined) => {
    if (!selected) {
      onChange('', '');
      return;
    }
    const from = selected.from ? formatDateParam(selected.from) : '';
    const to = selected.to ? formatDateParam(selected.to) : '';
    onChange(from, to);
    if (selected.from && selected.to) {
      setOpen(false);
    }
  };

  const nights = arrivee && depart ? differenceInDays(parseISO(depart), parseISO(arrivee)) : 0;

  const summary =
    arrivee && depart
      ? `${format(parseISO(arrivee), 'd MMM', { locale: fr })} → ${format(parseISO(depart), 'd MMM yyyy', { locale: fr })} · ${nights} nuit${nights > 1 ? 's' : ''}`
      : arrivee
      ? `Arrivée ${format(parseISO(arrivee), 'd MMM yyyy', { locale: fr })} — choisir le départ`
      : 'Choisir les dates';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={arrivee ? 'text-gray-900' : 'text-gray-400'}>{summary}</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            locale={fr}
            weekStartsOn={1}
            showOutsideDays
            numberOfMonths={1}
          />
        </div>
      )}
    </div>
  );
}
