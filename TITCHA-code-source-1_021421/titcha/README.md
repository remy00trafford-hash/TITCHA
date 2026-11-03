# TITCHA — socle de démarrage
Application Next.js/React/TypeScript connectable au projet Supabase TITCHA déjà créé.

## Installation
1. Installer Node.js 20.9+.
2. `npm install`
3. Copier `.env.example` vers `.env.local`.
4. Dans Supabase > Project Settings > API, copier l'URL et la clé **publishable** dans `.env.local`.
5. `npm run dev`, puis ouvrir http://localhost:3000.

Ne jamais mettre une clé `service_role` dans le frontend ou GitHub.

## Supabase existant
Projet TITCHA · ref `wisyxjdeqoidqzgtjfub` · région `eu-west-1`. Le schéma, les politiques RLS et le bucket privé `student-documents` sont déjà configurés. Ne pas recréer le projet ni exécuter de migration destructive. Inspecter l'état avant toute modification.

## Inclus
Accueil responsive, inscription/connexion Supabase Auth, tableau de bord protégé, lecture des matières, import PDF/photos dans le bucket privé, pages initiales Prof IA, Révisions, Points et Méthodologie.

## À terminer
Moteur IA serveur, OCR et extraction PDF, résumés et questions-réponses ancrées dans les cours, quiz/correction/suivi, profil classe/série, avatars définitifs, voix éventuelle, tests de sécurité et déploiement. Les fonctions IA/OCR ne sont pas encore actives. Les cours seront ajoutés plus tard par l'utilisateur. Privilégier les solutions gratuites et demander accord avant toute dépense.
