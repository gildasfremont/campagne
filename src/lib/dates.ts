import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  isSameDay,
  differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  isSameDay,
  differenceInDays,
  fr,
};

export function formatDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getMonthDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function getWeekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  });
}

export function isDateInRange(date: Date, arrivee: string, depart: string): boolean {
  const arrival = parseISO(arrivee);
  const departure = parseISO(depart);
  return isWithinInterval(date, { start: arrival, end: departure }) || isSameDay(date, arrival) || isSameDay(date, departure);
}

// A person occupies a "nuit" (night) if they are present that night,
// i.e. they arrived on or before that date and depart after that date
export function isNightOccupied(date: Date, arrivee: string, depart: string): boolean {
  const arrival = parseISO(arrivee);
  const departure = parseISO(depart);
  // Present the night of `date` means: arrived <= date AND depart > date
  return arrival <= date && departure > date;
}

export function getOccupancyColor(count: number): string {
  if (count <= 17) return '#22c55e'; // green
  if (count <= 27) return '#f59e0b'; // orange
  if (count <= 32) return '#ef4444'; // red
  return '#991b1b'; // dark red
}

export function getOccupancyLabel(count: number): string {
  if (count <= 17) return 'Confortable';
  if (count <= 27) return 'Grande maison';
  if (count <= 32) return "On s'arrange";
  return 'Dépassement !';
}

export function getDefaultMonth(): Date {
  const now = new Date();
  const year = now.getFullYear();
  // Default to July of current year (or next year if past September)
  if (now.getMonth() > 8) {
    return new Date(year + 1, 6, 1);
  }
  return new Date(year, 6, 1);
}
