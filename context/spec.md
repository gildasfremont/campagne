# Campagne — spec v1

Calendrier partagé pour coordonner l'occupation d'une maison de campagne familiale pendant l'été. Chaque membre de la famille peut déclarer ses dates de séjour, voir qui est là quand, et l'admin affecte les chambres.

## Contexte

Maison familiale partagée entre plusieurs branches (Casati, Saint-Pierre, Saugnac, Lamblin, Koempel, Parjadis, Chevalier, Roy/Antoine). Capacité max : 32 couchages. La négociation se fait en famille, hors de l'app. L'app est le support visuel qui permet à chacun de voir l'état des lieux et de poser ses dates.

Remplace un Google Sheet existant qui ne remplissait plus sa fonction (doublons, lignes sans dates, pas de feedback visuel sur l'occupation).

## Stack

- Next.js (App Router)
- Vercel Postgres pour la persistence
- Vercel pour le déploiement
- Pas d'authentification

## Modèle de données

### familles

| champ | type | description |
|-------|------|-------------|
| id | uuid | PK |
| nom | text | nom de famille (Frémont, Saint-Pierre (de), etc.) |
| branche | text | branche familiale (Casati, Saint-Pierre, Saugnac, etc.) |
| couleur | text | couleur attribuée pour le calendrier (hex) |

### membres

| champ | type | description |
|-------|------|-------------|
| id | uuid | PK |
| famille_id | uuid | FK vers familles |
| prenom | text | prénom ou prénoms |
| est_permanent | boolean | true = membre fixe de la famille, false = ajouté ponctuellement (nounou, ami, etc.) |

### sejours

| champ | type | description |
|-------|------|-------------|
| id | uuid | PK |
| membre_id | uuid | FK vers membres |
| arrivee | date | date d'arrivée |
| depart | date | date de départ |
| remarque | text | champ libre (nullable) |
| created_at | timestamp | |

### chambres

| champ | type | description |
|-------|------|-------------|
| id | uuid | PK |
| nom | text | nom de la chambre |
| couchages | integer | nombre de couchages max |
| maison | text | "grande" ou "petite" |

### affectations

| champ | type | description |
|-------|------|-------------|
| id | uuid | PK |
| chambre_id | uuid | FK vers chambres |
| sejour_id | uuid | FK vers sejours |
| nuit | date | la nuit concernée |

## Identité utilisateur

Pas d'auth. Au premier accès, l'utilisateur choisit son nom dans la liste des membres. Le choix est stocké en localStorage. Ce n'est pas un login, c'est une préférence locale qui pré-remplit le formulaire. L'utilisateur peut changer d'identité à tout moment en modifiant le sélecteur dans le formulaire de séjour.

## Interaction principale : le calendrier

Le calendrier est l'objet central de l'app. Tout part de là.

### Déclarer un séjour

L'utilisateur sélectionne une plage de dates directement sur le calendrier (clic + drag, ou clic début + clic fin). Un panneau s'ouvre avec :
- Sélecteur de famille (pré-rempli avec la famille de l'utilisateur localStorage)
- Liste des membres de la famille, cochés par défaut selon la composition habituelle
- Possibilité d'ajouter un membre ponctuel (texte libre : "nounou Marie", "ami de Paul", etc.), ce qui crée un membre avec est_permanent = false
- Champ remarque (texte libre)
- Les dates d'arrivée et de départ sont éditables dans le panneau

Un séjour est créé par membre coché. Si Constance et Gildas cochent aussi "nounou", trois séjours sont créés avec les mêmes dates. Chaque séjour est ensuite modifiable individuellement (un membre peut arriver un jour plus tard ou partir un jour plus tôt).

### Modifier un séjour

Cliquer sur une barre de séjour dans le calendrier ouvre le même panneau en mode édition. On peut changer les dates, la remarque, ou supprimer le séjour.

### Supprimer un séjour

Depuis le panneau d'édition, bouton supprimer. Pas de confirmation modale, mais un undo de 5 secondes (toast).

## Vues du calendrier

### Vue mois (défaut)

Affiche un mois complet (juillet par défaut, navigable). Chaque jour est une colonne. Les séjours apparaissent comme des barres horizontales colorées par branche familiale. En haut de chaque colonne-jour, le total de couchages pour la nuit avec un code couleur :

- Vert : ≤ 17 (confortable)
- Orange : 18–27 (ça passe dans la grande maison)
- Rouge : 28–32 (on s'arrange)
- Rouge foncé : > 32 (dépassement)

### Vue semaine

Zoom sur 7 jours. Montre les noms individuels plutôt que les barres famille. Plus de détail, utile pour la semaine qui approche.

### Vue par famille

Filtre le calendrier pour une branche donnée. Montre tous les séjours de cette branche sur la période. Utile pour l'admin avant d'affecter les chambres.

## Vue admin : affectation des chambres

Accessible via `/admin` (pas protégée, inutile dans ce contexte).

Grille chambres × nuits. L'admin affecte les séjours aux chambres. L'app alerte si une chambre est surchargée (plus de personnes que de couchages). Les remarques des séjours sont visibles dans cette vue pour aider à la décision ("peut dormir dans la même chambre", "vient avec 2 enfants en bas âge", etc.).

Cette vue peut être livrée dans un second temps. Le MVP c'est le calendrier + saisie de séjours.

## Données initiales (seed)

Importer les familles et membres depuis le Google Sheet existant. Les branches sont :

- Casati : Frémont, d'Hotelans, Roincé (de), Permingeat, Casati (Agathe), Casati (Pascale et Jean)
- Saint-Pierre : Saint-Pierre (de), Grandchamp des Raux
- Saugnac : Saugnac
- Lamblin : Lamblin
- Koempel : Koempel
- Parjadis : Parjadis
- Chevalier : Chevalier
- Antoine : Roy

Les chambres et leur capacité devront être fournies par l'admin (Gildas) dans un second temps.

## Contraintes techniques

- Mobile-first : les membres de la famille rempliront depuis leur téléphone
- Pas de temps réel (WebSocket) : un fetch au chargement de page suffit pour 30 utilisateurs
- Le calendrier doit être performant et lisible sur mobile, ce qui est la partie la plus exigeante du projet
- Pas de framework de calendrier lourd si possible, un composant custom sera plus adapté au besoin spécifique

## MVP vs V2

### MVP

- Calendrier vue mois + vue semaine
- Saisie de séjour depuis le calendrier
- Identité localStorage
- Seed des familles/membres
- Indicateur d'occupation par nuit avec seuils colorés

### V2

- Vue par famille
- Affectation des chambres par l'admin
- Export des données (CSV ou similaire)