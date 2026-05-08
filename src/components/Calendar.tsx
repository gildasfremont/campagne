'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Famille, MembreWithFamille, SejourWithDetails } from '@/lib/types';
import {
  format,
  addMonths,
  subMonths,
  formatDateParam,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  getDefaultMonth,
  fr,
} from '@/lib/dates';
import {
  getFamilles,
  getMembres,
  getSejours,
  deleteSejour as deleteSejourLocal,
  restoreSejour,
} from '@/lib/local-store';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import SejourPanel from './SejourPanel';
import Toast from './Toast';

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(getDefaultMonth);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [membres, setMembres] = useState<MembreWithFamille[]>([]);
  const [sejours, setSejours] = useState<SejourWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingSejour, setEditingSejour] = useState<SejourWithDetails | null>(null);

  // Membres panel

  // Undo toast
  const [deletedSejour, setDeletedSejour] = useState<SejourWithDetails | null>(null);

  // Filter to show only members with sejours
  const [onlyWithSejours, setOnlyWithSejours] = useState(false);

  // Filter hidden members for calendar display
  const visibleMembres = membres.filter((m) => !m.est_cache);

  // Load static data from local store
  useEffect(() => {
    setFamilles(getFamilles());
    setMembres(getMembres());
  }, []);

  // Load sejours when date changes
  const fetchSejours = useCallback(() => {
    setLoading(true);
    let from: string, to: string;
    if (viewMode === 'month') {
      from = formatDateParam(startOfMonth(currentDate));
      to = formatDateParam(endOfMonth(currentDate));
    } else if (viewMode === 'week') {
      from = formatDateParam(startOfWeek(currentDate, { weekStartsOn: 1 }));
      to = formatDateParam(endOfWeek(currentDate, { weekStartsOn: 1 }));
    } else {
      from = formatDateParam(currentDate);
      to = formatDateParam(currentDate);
    }
    setSejours(getSejours(from, to));
    setLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchSejours();
  }, [fetchSejours]);

  const refreshMembres = useCallback(() => {
    setMembres(getMembres());
  }, []);

  // Navigation
  const goNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate((d) => new Date(d.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goPrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate((d) => new Date(d.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const goToday = () => setCurrentDate(new Date());

  // Date selection on calendar → navigate to /sejour/nouveau
  const handleSelectDates = (start: Date, end: Date, membreId?: string) => {
    const params = new URLSearchParams({
      from: formatDateParam(start),
      to: formatDateParam(end),
    });
    if (membreId) {
      const membre = membres.find((m) => m.id === membreId);
      if (membre) params.set('famille', membre.famille_id);
    }
    router.push(`/sejour/nouveau?${params.toString()}`);
  };

  // Edit sejour (modal)
  const handleEditSejour = (sejour: SejourWithDetails) => {
    setEditingSejour(sejour);
  };

  const handlePanelClose = () => {
    setEditingSejour(null);
  };

  const handleUpdated = () => {
    handlePanelClose();
    fetchSejours();
  };

  const handleDeleted = (sejour: SejourWithDetails) => {
    handlePanelClose();
    setSejours((prev) => prev.filter((s) => s.id !== sejour.id));
    deleteSejourLocal(sejour.id);
    setDeletedSejour(sejour);
  };

  const handleConfirmDelete = useCallback(() => {
    setDeletedSejour(null);
  }, []);

  const handleUndoDelete = () => {
    if (deletedSejour) {
      restoreSejour({
        id: deletedSejour.id,
        membre_id: deletedSejour.membre_id,
        arrivee: deletedSejour.arrivee,
        depart: deletedSejour.depart,
        remarque: deletedSejour.remarque,
        created_at: deletedSejour.created_at,
      });
      setSejours((prev) => [...prev, deletedSejour]);
    }
    setDeletedSejour(null);
  };

  const currentTitle =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy', { locale: fr })
      : viewMode === 'week'
      ? `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`
      : format(currentDate, 'EEEE d MMMM', { locale: fr });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campagne</h1>
          <p className="hidden sm:block text-sm text-gray-500">Calendrier de la maison</p>
        </div>

        <button
          onClick={() => router.push('/sejours')}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0"
        >
          Liste
        </button>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={goPrev}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
          aria-label="Précédent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="flex-1 text-center text-base sm:text-lg font-semibold text-gray-900 capitalize truncate">
          {currentTitle}
        </h2>
        <button
          onClick={goNext}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
          aria-label="Suivant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={goToday}
          className="ml-1 px-2.5 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg font-medium shrink-0"
        >
          Aujourd&apos;hui
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center mb-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer min-w-0">
          <input
            type="checkbox"
            checked={onlyWithSejours}
            onChange={(e) => setOnlyWithSejours(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
          />
          <span className="truncate">Séjours uniquement</span>
        </label>
      </div>

      {/* View toggle, juste au-dessus du calendrier */}
      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Jour
          </button>
        </div>
      </div>

      {/* Calendar view */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            sejours={sejours}
            membres={visibleMembres}
            onlyWithSejours={onlyWithSejours}
            onSelectDates={handleSelectDates}
            onEditSejour={handleEditSejour}
          />
        ) : viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            sejours={sejours}
            onEditSejour={handleEditSejour}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            sejours={sejours}
            onEditSejour={handleEditSejour}
          />
        )}
      </div>

      {/* FAB always available */}
      <button
        onClick={() => router.push('/sejour/nouveau')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 z-30"
        aria-label="Nouveau séjour"
      >
        +
      </button>

      {/* Membres */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <button
          onClick={() => router.push('/membres')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Gérer les membres
        </button>
      </div>

      {/* Occupancy legend */}
      <div className="flex flex-col gap-1 mt-6 text-xs text-gray-500">
        <span className="font-medium">Occupation :</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#22c55e] mr-1" />&le; 17 confortable</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#f59e0b] mr-1" />18-27 grande maison</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444] mr-1" />28-32 on s&apos;arrange</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#991b1b] mr-1" />&gt; 32 dépassement</span>
      </div>

      {/* Sejour edit modal */}
      {editingSejour && (
        <SejourPanel
          sejour={editingSejour}
          onClose={handlePanelClose}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {/* Undo toast */}
      {deletedSejour && (
        <Toast
          message={`Séjour de ${deletedSejour.prenom} supprimé`}
          onUndo={handleUndoDelete}
          onDismiss={handleConfirmDelete}
        />
      )}
    </div>
  );
}
