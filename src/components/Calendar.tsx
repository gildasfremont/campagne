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
import MonthView from './MonthView';
import WeekView from './WeekView';
import SejourPanel from './SejourPanel';
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

  // Undo toast
  const [deletedSejour, setDeletedSejour] = useState<SejourWithDetails | null>(null);

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('campagne_membre_id');
    if (stored) setCurrentMembreId(stored);
  }, []);

  const saveIdentity = (membreId: string) => {
    setCurrentMembreId(membreId);
    localStorage.setItem('campagne_membre_id', membreId);
  };

  // Fetch static data
  useEffect(() => {
    Promise.all([
      fetch('/api/familles').then((r) => r.json()),
      fetch('/api/membres').then((r) => r.json()),
    ]).then(([fam, mem]) => {
      setFamilles(fam);
      setMembres(mem);
    });
  }, []);

  // Fetch sejours when date changes
  const fetchSejours = useCallback(async () => {
    setLoading(true);
    try {
      let from: string, to: string;
      if (viewMode === 'month') {
        from = formatDateParam(startOfMonth(currentDate));
        to = formatDateParam(endOfMonth(currentDate));
      } else {
        from = formatDateParam(startOfWeek(currentDate, { weekStartsOn: 1 }));
        to = formatDateParam(endOfWeek(currentDate, { weekStartsOn: 1 }));
      }
      const res = await fetch(`/api/sejours?from=${from}&to=${to}`);
      const data = await res.json();
      setSejours(data);
    } catch (err) {
      console.error('Error fetching sejours:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchSejours();
  }, [fetchSejours]);

  // Refresh membres too (for newly added temp members)
  const refreshAll = useCallback(async () => {
    const mem = await fetch('/api/membres').then((r) => r.json());
    setMembres(mem);
    await fetchSejours();
  }, [fetchSejours]);

  // Refresh only members (without closing panel)
  const refreshMembres = useCallback(async () => {
    const mem = await fetch('/api/membres').then((r) => r.json());
    setMembres(mem);
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

  const handleDeleted = async (sejour: SejourWithDetails) => {
    handlePanelClose();
    // Optimistically remove
    setSejours((prev) => prev.filter((s) => s.id !== sejour.id));
    setDeletedSejour(sejour);
    // Actually delete after toast timeout (unless undone)
  };

  const handleConfirmDelete = async () => {
    if (!deletedSejour) return;
    try {
      await fetch(`/api/sejours/${deletedSejour.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting:', err);
    }
    setDeletedSejour(null);
  };

  const handleUndoDelete = () => {
    // Restore the sejour in the list
    if (deletedSejour) {
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

        {/* Identity selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Qui êtes-vous ?</label>
          <select
            value={currentMembreId || ''}
            onChange={(e) => saveIdentity(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 max-w-[180px]"
          >
            <option value="">Choisir...</option>
            {membres
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

      {/* Occupancy legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
        <span className="font-medium">Occupation :</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#22c55e] mr-1" />&le; 17 confortable</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#f59e0b] mr-1" />18-27 grande maison</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#ef4444] mr-1" />28-32 on s&apos;arrange</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-[#991b1b] mr-1" />&gt; 32 dépassement</span>
      </div>

      {/* Calendar view */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            sejours={sejours}
            membres={membres}
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

      {/* Mobile fab to create sejour */}
      {viewMode === 'week' && (
        <button
          onClick={() => {
            setSelectedDates({ start: new Date(), end: new Date() });
            setEditingSejour(null);
            setShowPanel(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 sm:hidden z-30"
          aria-label="Nouveau séjour"
        >
          +
        </button>
      )}

      {/* Sejour panel */}
      {showPanel && (
        <SejourPanel
          familles={familles}
          membres={membres}
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
