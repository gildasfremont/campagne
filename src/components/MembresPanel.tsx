'use client';

import { useState, useMemo } from 'react';
import { Famille, MembreWithFamille } from '@/lib/types';

interface MembresPanelProps {
  familles: Famille[];
  membres: MembreWithFamille[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function MembresPanel({ familles, membres, onClose, onRefresh }: MembresPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [addingFamilleId, setAddingFamilleId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Group members by branche then famille
  const groups = useMemo(() => {
    const brancheMap = new Map<string, { famille: Famille; membres: MembreWithFamille[] }[]>();
    for (const f of familles) {
      const branche = brancheMap.get(f.branche) || [];
      branche.push({ famille: f, membres: membres.filter((m) => m.famille_id === f.id) });
      brancheMap.set(f.branche, branche);
    }
    return brancheMap;
  }, [familles, membres]);

  const startEdit = (m: MembreWithFamille) => {
    setEditingId(m.id);
    setEditName(m.prenom);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setLoading(editingId);
    try {
      await fetch(`/api/membres/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom: editName.trim() }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating membre:', err);
    } finally {
      setLoading(null);
      setEditingId(null);
    }
  };

  const toggleCache = async (m: MembreWithFamille) => {
    setLoading(m.id);
    try {
      await fetch(`/api/membres/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ est_cache: !m.est_cache }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error toggling cache:', err);
    } finally {
      setLoading(null);
    }
  };

  const addMembre = async (familleId: string) => {
    if (!newName.trim()) return;
    setLoading('new');
    try {
      await fetch('/api/membres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ famille_id: familleId, prenom: newName.trim(), est_permanent: true }),
      });
      setNewName('');
      setAddingFamilleId(null);
      onRefresh();
    } catch (err) {
      console.error('Error adding membre:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Gérer les membres</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {Array.from(groups.entries()).map(([branche, familleGroups]) => (
            <div key={branche}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {branche}
              </div>
              {familleGroups.map(({ famille, membres: famMembres }) => (
                <div key={famille.id} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: famille.couleur }}
                    />
                    <span className="text-sm font-medium text-gray-700">{famille.nom}</span>
                    <button
                      onClick={() => {
                        setAddingFamilleId(addingFamilleId === famille.id ? null : famille.id);
                        setNewName('');
                      }}
                      className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Ajouter
                    </button>
                  </div>

                  <div className="ml-5 space-y-0.5">
                    {famMembres.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 py-1 px-2 rounded group ${
                          m.est_cache ? 'opacity-40' : ''
                        }`}
                      >
                        {editingId === m.id ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-sm text-gray-900"
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              disabled={loading === m.id}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-800 flex-1">
                              {m.prenom}
                              {!m.est_permanent && (
                                <span className="text-xs text-gray-400 ml-1">(ponctuel)</span>
                              )}
                            </span>
                            <button
                              onClick={() => startEdit(m)}
                              className="text-xs text-gray-400 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => toggleCache(m)}
                              disabled={loading === m.id}
                              className="text-xs text-gray-400 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                              {m.est_cache ? 'Afficher' : 'Cacher'}
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    {famMembres.length === 0 && (
                      <div className="text-xs text-gray-400 italic py-1 px-2">Aucun membre</div>
                    )}
                  </div>

                  {/* Add member form */}
                  {addingFamilleId === famille.id && (
                    <div className="ml-5 mt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addMembre(famille.id);
                          if (e.key === 'Escape') setAddingFamilleId(null);
                        }}
                        placeholder="Prénom"
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                        autoFocus
                      />
                      <button
                        onClick={() => addMembre(famille.id)}
                        disabled={loading === 'new'}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2"
                      >
                        Ajouter
                      </button>
                      <button
                        onClick={() => setAddingFamilleId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
