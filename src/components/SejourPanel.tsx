'use client';

import { useState, useEffect, useMemo } from 'react';
import { Famille, MembreWithFamille, SejourWithDetails } from '@/lib/types';
import { formatDateParam } from '@/lib/dates';

interface SejourPanelProps {
  familles: Famille[];
  membres: MembreWithFamille[];
  selectedDates: { start: Date; end: Date } | null;
  editingSejour: SejourWithDetails | null;
  currentMembreId: string | null;
  preselectedFamilleId?: string | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated: () => void;
  onDeleted: (sejour: SejourWithDetails) => void;
}

export default function SejourPanel({
  familles,
  membres,
  selectedDates,
  editingSejour,
  currentMembreId,
  preselectedFamilleId,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: SejourPanelProps) {
  const isEditing = !!editingSejour;

  // Find the current user's famille
  const currentMembre = membres.find((m) => m.id === currentMembreId);
  const defaultFamilleId = preselectedFamilleId || currentMembre?.famille_id || familles[0]?.id || '';

  const [selectedFamilleId, setSelectedFamilleId] = useState(defaultFamilleId);
  const [selectedMembreIds, setSelectedMembreIds] = useState<Set<string>>(new Set());
  const [arrivee, setArrivee] = useState('');
  const [depart, setDepart] = useState('');
  const [remarque, setRemarque] = useState('');
  const [newMembreName, setNewMembreName] = useState('');
  const [loading, setLoading] = useState(false);

  const famillesMembres = useMemo(
    () => membres.filter((m) => m.famille_id === selectedFamilleId),
    [membres, selectedFamilleId]
  );

  // Group familles by branche for the selector
  const branches = useMemo(() => {
    const map = new Map<string, Famille[]>();
    for (const f of familles) {
      const list = map.get(f.branche) || [];
      list.push(f);
      map.set(f.branche, list);
    }
    return map;
  }, [familles]);

  // Sync preselectedFamilleId into state when panel opens
  useEffect(() => {
    if (!isEditing && preselectedFamilleId) {
      setSelectedFamilleId(preselectedFamilleId);
    }
  }, [preselectedFamilleId, isEditing]);

  useEffect(() => {
    if (editingSejour) {
      setArrivee(editingSejour.arrivee.split('T')[0]);
      setDepart(editingSejour.depart.split('T')[0]);
      setRemarque(editingSejour.remarque || '');
      setSelectedFamilleId(editingSejour.famille_id);
    } else if (selectedDates) {
      setArrivee(formatDateParam(selectedDates.start));
      setDepart(formatDateParam(selectedDates.end));
      // Pre-select permanent members of the family
      const permanentIds = new Set(
        famillesMembres.filter((m) => m.est_permanent).map((m) => m.id)
      );
      setSelectedMembreIds(permanentIds);
    }
  }, [editingSejour, selectedDates, famillesMembres]);

  // When famille changes in create mode, update selected members
  useEffect(() => {
    if (!isEditing) {
      const permanentIds = new Set(
        famillesMembres.filter((m) => m.est_permanent).map((m) => m.id)
      );
      setSelectedMembreIds(permanentIds);
    }
  }, [selectedFamilleId, famillesMembres, isEditing]);

  const toggleMembre = (id: string) => {
    setSelectedMembreIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddTemporaryMember = async () => {
    if (!newMembreName.trim()) return;
    try {
      const res = await fetch('/api/membres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          famille_id: selectedFamilleId,
          prenom: newMembreName.trim(),
          est_permanent: false,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSelectedMembreIds((prev) => new Set(prev).add(created.id));
        setNewMembreName('');
        // Trigger a refresh so the new member appears
        onCreated();
      }
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const handleSubmit = async () => {
    if (isEditing) {
      setLoading(true);
      try {
        await fetch(`/api/sejours/${editingSejour!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arrivee, depart, remarque: remarque || null }),
        });
        onUpdated();
      } catch (err) {
        console.error('Error updating sejour:', err);
      } finally {
        setLoading(false);
      }
    } else {
      if (selectedMembreIds.size === 0) return;
      setLoading(true);
      try {
        await fetch('/api/sejours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            membres: Array.from(selectedMembreIds),
            arrivee,
            depart,
            remarque: remarque || null,
          }),
        });
        onCreated();
      } catch (err) {
        console.error('Error creating sejours:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = () => {
    if (editingSejour) {
      onDeleted(editingSejour);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? `${editingSejour!.prenom} — Modifier le séjour` : 'Nouveau séjour'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
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

        {/* Family selector (create mode only) */}
        {!isEditing && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
            <select
              value={selectedFamilleId}
              onChange={(e) => setSelectedFamilleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              {Array.from(branches.entries()).map(([branche, fams]) => (
                <optgroup key={branche} label={branche}>
                  {fams.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Member checkboxes (create mode only) */}
        {!isEditing && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Membres</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {famillesMembres.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembreIds.has(m.id)}
                    onChange={() => toggleMembre(m.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{m.prenom}</span>
                  {!m.est_permanent && (
                    <span className="text-xs text-gray-400">(ponctuel)</span>
                  )}
                </label>
              ))}
            </div>
            {/* Add temporary member */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newMembreName}
                onChange={(e) => setNewMembreName(e.target.value)}
                placeholder="Ajouter (nounou, ami...)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTemporaryMember()}
              />
              <button
                onClick={handleAddTemporaryMember}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2"
              >
                +
              </button>
            </div>
          </div>
        )}

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
          {isEditing && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              Supprimer
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!isEditing && selectedMembreIds.size === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '...' : isEditing ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
