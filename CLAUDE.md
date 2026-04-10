# Campagne — règles pour Claude

## Workflow git

1. Travailler sur la branche de session, jamais directement sur `main`
2. Commit, push sur la branche
3. Créer une PR vers `main`
4. Merge avec **merge normal** (pas de squash)
5. Pull main dans la branche pour rester synchro : `git pull origin main`
6. Push la branche après le pull

## Principes

- Ne jamais inventer de données : s'en tenir au spec (`context/spec.md`)
- Si une info manque, demander plutôt qu'improviser
- Ne pas contredire ce que l'utilisateur voit dans son UI
- Réfléchir avant d'agir, pas l'inverse
- Ne pas ajouter de fonctionnalités non demandées

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Vercel Postgres (`@vercel/postgres`)
- Déployé sur Vercel

## URL de prod

https://campagne-omega.vercel.app/
