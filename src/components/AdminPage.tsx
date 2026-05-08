'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Affectation, Chambre, SejourWithDetails } from '@/lib/types';
import {
  addChambre,
  assignSejour,
  deleteChambre,
  getAffectations,
  getChambres,
  getSejours,
  unassignSejour,
  updateChambre,
} from '@/lib/local-store';
import {
  addMonths,
  format,
  formatDateParam,
  fr,
  isNightOccupied,
  parseISO,
  subMonths,
} from '@/lib/dates';

type AssignTarget = { sejour: SejourWithDetails; nuit: string };

export default function AdminPage() {
  const router = useRouter();
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [sejours, setSejours] = useState<SejourWithDetails[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [nuit, setNuit] = useState<string>(formatDateParam(new Date()));

  // Chambre management state
  const [showChambreForm, setShowChambreForm] = useState(false);
  const [editingChambreId, setEditingChambreId] = useState<string | null>(null);
  const [formNom, setFormNom] = useState('');
  const [formCouchages, setFormCouchages] = useState('2');
  const [formMaison, setFormMaison] = useState<'grande' | 'petite'>('grande');

  // Assign modal
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);

  useEffect(() => {
    setChambres(getChambres());
    setSejours(getSejours());
    setAffectations(getAffectations());
  }, []);

  const refresh = () => {
    setChambres(getChambres());
    setAffectations(getAffectations());
  };

  // Sejours présents cette nuit
  const sejoursThisNuit = useMemo(() => {
    const target = parseISO(nuit);
    return sejours.filter((s) => isNightOccupied(target, s.arrivee, s.depart));
  }, [sejours, nuit]);

  // Map: sejour_id -> chambre_id pour cette nuit
  const sejourChambre = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of affectations) {
      if (a.nuit === nuit) map.set(a.sejour_id, a.chambre_id);
    }
    return map;
  }, [affectations, nuit]);

  const unassigned = sejoursThisNuit.filter((s) => !sejourChambre.has(s.id));

  // Chambre management actions
  const startNewChambre = () => {
    setEditingChambreId(null);
    setFormNom('');
    setFormCouchages('2');
    setFormMaison('grande');
    setShowChambreForm(true);
  };

  const startEditChambre = (c: Chambre) => {
    setEditingChambreId(c.id);
    setFormNom(c.nom);
    setFormCouchages(String(c.couchages));
    setFormMaison(c.maison);
    setShowChambreForm(true);
  };

  const saveChambre = () => {
    const couchages = parseInt(formCouchages, 10);
    if (!formNom.trim() || isNaN(couchages) || couchages < 1) return;
    if (editingChambreId) {
      updateChambre(editingChambreId, { nom: formNom.trim(), couchages, maison: formMaison });
    } else {
      addChambre({ nom: formNom.trim(), couchages, maison: formMaison });
    }
    setShowChambreForm(false);
    refresh();
  };

  const removeChambre = (c: Chambre) => {
    if (!confirm(`Supprimer la chambre "${c.nom}" ?`)) return;
    deleteChambre(c.id);
    refresh();
  };

  // Date navigation
  const nuitDate = parseISO(nuit);
  const goPrev = () => setNuit(formatDateParam(new Date(nuitDate.getTime() - 86400000)));
  const goNext = () => setNuit(formatDateParam(new Date(nuitDate.getTime() + 86400000)));
  const goToday = () => setNuit(formatDateParam(new Date()));
  const goPrevMonth = () => setNuit(formatDateParam(subMonths(nuitDate, 1)));
  const goNextMonth = () => setNuit(formatDateParam(addMonths(nuitDate, 1)));

  const handleAssign = (target: AssignTarget, chambreId: string, mode: 'nuit' | 'sejour') => {
    const sej = target.sejour;
    const nuits =
      mode === 'nuit'
        ? [target.nuit]
        : enumerateNuits(sej.arrivee, sej.depart);
    assignSejour({ sejour_id: sej.id, chambre_id: chambreId, nuits });
    refresh();
    setAssignTarget(null);
  };

  const handleUnassign = (sejourId: string, mode: 'nuit' | 'sejour') => {
    const sej = sejours.find((s) => s.id === sejourId);
    if (!sej) return;
    const nuits = mode === 'nuit' ? [nuit] : enumerateNuits(sej.arrivee, sej.depart);
    unassignSejour(sejourId, nuits);
    refresh();
  };

  // Group occupants by chambre
  const occupantsByChambre = useMemo(() => {
    const map = new Map<string, SejourWithDetails[]>();
    for (const s of sejoursThisNuit) {
      const cId = sejourChambre.get(s.id);
      if (!cId) continue;
      const list = map.get(cId) || [];
      list.push(s);
      map.set(cId, list);
    }
    return map;
  }, [sejoursThisNuit, sejourChambre]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/')}
          aria-label="Retour"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Admin · Chambres</h1>
      </div>

      {/* Chambre management */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Chambres ({chambres.length})
          </h2>
          <button
            onClick={startNewChambre}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Ajouter
          </button>
        </div>

        {chambres.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
            Aucune chambre. Ajoutez-en une pour commencer.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {chambres.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2.5">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                    c.maison === 'grande' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {c.maison === 'grande' ? 'Grande' : 'Petite'}
                </span>
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">{c.nom}</span>
                <span className="text-xs text-gray-500 shrink-0">
                  {c.couchages} couchage{c.couchages > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => startEditChambre(c)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2"
                >
                  Modifier
                </button>
                <button
                  onClick={() => removeChambre(c)}
                  className="text-xs text-red-500 hover:text-red-700 px-2"
                >
                  Suppr.
                </button>
              </div>
            ))}
          </div>
        )}

        {showChambreForm && (
          <div className="mt-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editingChambreId ? 'Modifier la chambre' : 'Nouvelle chambre'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  placeholder="Ex: Chambre bleue"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Couchages</label>
                  <input
                    type="number"
                    min={1}
                    value={formCouchages}
                    onChange={(e) => setFormCouchages(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Maison</label>
                  <select
                    value={formMaison}
                    onChange={(e) => setFormMaison(e.target.value as 'grande' | 'petite')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="grande">Grande</option>
                    <option value="petite">Petite</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowChambreForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={saveChambre}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {editingChambreId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Date picker */}
      <section className="mb-6 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Affectation par nuit
        </h2>
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={goPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Mois précédent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Jour précédent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={nuit}
            onChange={(e) => setNuit(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 text-center"
          />
          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Jour suivant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Mois suivant"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="capitalize">{format(nuitDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
          <button onClick={goToday} className="text-blue-600 hover:text-blue-800 font-medium">
            Auj.
          </button>
        </div>
      </section>

      {/* Unassigned sejours */}
      {unassigned.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
            Non affectés ({unassigned.length})
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 space-y-1">
            {unassigned.map((s) => (
              <button
                key={s.id}
                onClick={() => setAssignTarget({ sejour: s, nuit })}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white text-left"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.couleur }}
                />
                <span className="text-sm font-medium text-gray-900">{s.prenom}</span>
                <span className="text-xs text-gray-500 truncate">{s.famille_nom}</span>
                {s.remarque && (
                  <span className="text-xs text-gray-400 italic truncate flex-1">— {s.remarque}</span>
                )}
                <span className="text-xs text-blue-600 font-medium ml-auto shrink-0">Affecter →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Chambres avec occupants */}
      {chambres.length > 0 && (
        <section className="space-y-3 mb-8">
          {chambres.map((c) => {
            const occupants = occupantsByChambre.get(c.id) || [];
            const overflow = occupants.length > c.couchages;
            return (
              <div
                key={c.id}
                className={`border rounded-xl p-3 ${
                  overflow ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                      c.maison === 'grande' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {c.maison === 'grande' ? 'Grande' : 'Petite'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{c.nom}</span>
                  <span
                    className={`text-xs ml-auto ${
                      overflow ? 'text-red-700 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {occupants.length} / {c.couchages}
                  </span>
                </div>
                {occupants.length === 0 ? (
                  <div className="text-xs text-gray-400 italic">Vide</div>
                ) : (
                  <div className="space-y-1">
                    {occupants.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-2 py-1 rounded bg-gray-50">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.couleur }}
                        />
                        <span className="text-sm text-gray-900">{s.prenom}</span>
                        <span className="text-xs text-gray-400 truncate">{s.famille_nom}</span>
                        {s.remarque && (
                          <span className="text-xs text-gray-400 italic truncate">— {s.remarque}</span>
                        )}
                        <div className="ml-auto flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleUnassign(s.id, 'nuit')}
                            className="text-xs text-gray-400 hover:text-red-600 px-1.5"
                            title="Retirer pour cette nuit"
                          >
                            Retirer
                          </button>
                          <button
                            onClick={() => setAssignTarget({ sejour: s, nuit })}
                            className="text-xs text-blue-600 hover:text-blue-800 px-1.5"
                          >
                            Déplacer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {sejoursThisNuit.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">Personne cette nuit-là.</div>
      )}

      {/* Assign modal */}
      {assignTarget && (
        <AssignModal
          target={assignTarget}
          chambres={chambres}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

function enumerateNuits(arrivee: string, depart: string): string[] {
  const nuits: string[] = [];
  const start = parseISO(arrivee);
  const end = parseISO(depart);
  for (
    let d = new Date(start);
    d.getTime() < end.getTime();
    d = new Date(d.getTime() + 86400000)
  ) {
    nuits.push(formatDateParam(d));
  }
  return nuits;
}

function AssignModal({
  target,
  chambres,
  onClose,
  onAssign,
}: {
  target: AssignTarget;
  chambres: Chambre[];
  onClose: () => void;
  onAssign: (target: AssignTarget, chambreId: string, mode: 'nuit' | 'sejour') => void;
}) {
  const [mode, setMode] = useState<'nuit' | 'sejour'>('sejour');
  const totalNuits = enumerateNuits(target.sejour.arrivee, target.sejour.depart).length;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{target.sejour.prenom}</h2>
            <p className="text-xs text-gray-500">{target.sejour.famille_nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="mb-4 text-xs">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode('sejour')}
              className={`flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'sejour' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Tout le séjour ({totalNuits} nuit{totalNuits > 1 ? 's' : ''})
            </button>
            <button
              onClick={() => setMode('nuit')}
              className={`flex-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'nuit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Cette nuit
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {chambres.map((c) => (
            <button
              key={c.id}
              onClick={() => onAssign(target, c.id, mode)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-200 text-left"
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                  c.maison === 'grande' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {c.maison === 'grande' ? 'Grande' : 'Petite'}
              </span>
              <span className="text-sm font-medium text-gray-900 flex-1">{c.nom}</span>
              <span className="text-xs text-gray-500 shrink-0">
                {c.couchages} cou.
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
