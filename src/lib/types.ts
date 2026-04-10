export interface Famille {
  id: string;
  nom: string;
  branche: string;
  couleur: string;
}

export interface Membre {
  id: string;
  famille_id: string;
  prenom: string;
  est_permanent: boolean;
}

export interface MembreWithFamille extends Membre {
  famille_nom: string;
  branche: string;
  couleur: string;
}

export interface Sejour {
  id: string;
  membre_id: string;
  arrivee: string;
  depart: string;
  remarque: string | null;
  created_at: string;
}

export interface SejourWithDetails extends Sejour {
  prenom: string;
  famille_nom: string;
  branche: string;
  couleur: string;
  famille_id: string;
}

export interface Chambre {
  id: string;
  nom: string;
  couchages: number;
  maison: 'grande' | 'petite';
}

export interface Affectation {
  id: string;
  chambre_id: string;
  sejour_id: string;
  nuit: string;
}
