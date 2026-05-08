'use client';

import { useState, useEffect, useCallback } from 'react';
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
import SejourPanel from './SejourPanel';
import MembresPanel from './MembresPanel';
import Toast from './Toast';

type ViewMode = 'month' | 'week';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(getDefaultMonth);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [membres, setMembres] = useState<MembreWithFamille[]>([]);
  const [sejours, setSejours] = useState<SejourWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Panel state
  const [showPanel, setShowPanel] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [editingSejour, setEditingSejour] = useState<SejourWithDetails | null>(null);

  // localStorage identity
  const [currentMembreId, setCurrentMembreId] = useState<string | null>(null);

  // Membres panel
  const [showMembresPanel, setShowMembresPanel] = useState(false);

  // Undo toast
  const [deletedSejour, setDeletedSejour] = useState<SejourWithDetails | null>(null);

  // Filter to show only members with sejours
  const [onlyWithSejours, setOnlyWithSejours] = useState(false);

  // Filter hidden members for calendar display
  const visibleMembres = membres.filter((m) => !m.est_cache);

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('campagne_membre_id');
    if (stored) setCurrentMembreId(stored);
  }, []);

  const saveIdentity = (membreId: string) => {
    setCurrentMembreId(membreId);
    localStorage.setItem('campagne_membre_id', membreId);
  };

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
    } else {
      from = formatDateParam(startOfWeek(currentDate, { weekStartsOn: 1 }));
      to = formatDateParam(endOfWeek(currentDate, { weekStartsOn: 1 }));
    }
    setSejours(getSejours(from, to));
    setLoading(false);
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchSejours();
  }, [fetchSejours]);

  const refreshAll = useCallback(() => {
    setMembres(getMembres());
    fetchSejours();
  }, [fetchSejours]);

  const refreshMembres = useCallback(() => {
    setMembres(getMembres());
  }, []);

  // Navigation
  const goNext = () => {
    setCurrentDate((d) => addMonths(d, viewMode === 'month' ? 1 : 0));
    if (viewMode === 'week') {
      setCurrentDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const goPrev = () => {
    setCurrentDate((d) => subMonths(d, viewMode === 'month' ? 1 : 0));
    if (viewMode === 'week') {
      setCurrentDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const goToday = () => setCurrentDate(new Date());

  // Pre-selected family (when user drags on a member row)
  const [preselectedFamilleId, setPreselectedFamilleId] = useState<string | null>(null);

  // Date selection for creating sejours
  const handleSelectDates = (start: Date, end: Date, membreId?: string) => {
    setSelectedDates({ start, end });
    setEditingSejour(null);
    if (membreId) {
      const membre = membres.find((m) => m.id === membreId);
      setPreselectedFamilleId(membre?.famille_id ?? null);
    } else {
      setPreselectedFamilleId(null);
    }
    setShowPanel(true);
  };

  // Edit sejour
  const handleEditSejour = (sejour: SejourWithDetails) => {
    setEditingSejour(sejour);
    setSelectedDates(null);
    setShowPanel(true);
  };

  // Panel callbacks
  const handlePanelClose = () => {
    setShowPanel(false);
    setEditingSejour(null);
    setSelectedDates(null);
    setPreselectedFamilleId(null);
  };

  const handleCreated = () => {
    handlePanelClose();
    refreshAll();
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
      : `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })}`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagne</h1>
          <p className="text-sm text-gray-500">Calendrier de la maison</p>
        </div>

        {/* Identity selector + members management */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembresPanel(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Gérer les membres"
            title="Gérer les membres"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>
          <label className="text-xs text-gray-500">Qui êtes-vous ?</label>
          <select
            value={currentMembreId || ''}
            onChange={(e) => saveIdentity(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 max-w-[180px]"
          >
            <option value="">Choisir...</option>
            {visibleMembres
              .filter((m) => m.est_permanent)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.famille_nom}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Précédent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize min-w-[180px] text-center">
            {currentTitle}
          </h2>
          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Suivant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={goToday} className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2">
            Aujourd&apos;hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithSejours}
              onChange={(e) => setOnlyWithSejours(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Séjours uniquement
          </label>

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
          </div>
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
        ) : (
          <WeekView
            currentDate={currentDate}
            sejours={sejours}
            onEditSejour={handleEditSejour}
          />
        )}
      </div>

      {/* FAB to create sejour in week view */}
      {viewMode === 'week' && (
        <button
          onClick={() => {
            setSelectedDates({ start: new Date(), end: new Date() });
            setEditingSejour(null);
            setShowPanel(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 z-30"
          aria-label="Nouveau séjour"
        >
          +
        </button>
      )}

      {/* Occupancy legend */}
      <div className="flex flex-col gap-1 mt-6 text-xs text-gray-500">
        <span className="font-medium">Occupation :</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#22c55e] mr-1" />&le; 17 confortable</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#f59e0b] mr-1" />18-27 grande maison</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444] mr-1" />28-32 on s&apos;arrange</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#991b1b] mr-1" />&gt; 32 dépassement</span>
      </div>

      {/* Sejour panel */}
      {showPanel && (
        <SejourPanel
          familles={familles}
          membres={visibleMembres}
          selectedDates={selectedDates}
          editingSejour={editingSejour}
          currentMembreId={currentMembreId}
          preselectedFamilleId={preselectedFamilleId}
          onClose={handlePanelClose}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onRefreshMembres={refreshMembres}
        />
      )}

      {/* Membres management panel */}
      {showMembresPanel && (
        <MembresPanel
          familles={familles}
          membres={membres}
          onClose={() => setShowMembresPanel(false)}
          onRefresh={refreshMembres}
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
