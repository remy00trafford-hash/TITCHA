# TITCHA — MVP éducatif

Application Next.js / React / TypeScript destinée aux élèves béninois : 4e, 3e, Première et Terminale (séries A/B/C/D au lycée). Matières initiales : SVT et Histoire-Géographie.

## Configuration locale

1. Installer Node.js 20.9 ou supérieur.
2. Exécuter `npm install`.
3. Copier `.env.example` vers `.env.local`.
4. Renseigner la clé **publishable** du projet Supabase indiqué ci-dessous.
5. Exécuter `npm run dev`.

**Projet Supabase configuré pour ce MVP :** `htkynieftrrkdylcuzyt`.

## Fonctionnalités présentes dans le code

- Pages d'accueil, inscription, connexion, tableau de bord, matières, documents, Prof IA, révisions, points, méthodologie et profil.
- Clients Supabase navigateur et serveur, gestion de session, callback d'authentification, déconnexion et réinitialisation du mot de passe.
- Import privé de PDF/JPEG/PNG/WEBP jusqu'à 20 Mo, création de l'enregistrement du document puis déclenchement de l'OCR.
- Page Prof IA : question-réponse, explication, résumé et génération de quiz à partir d'un cours traité.
- Révisions locales : cartes, rappels espacés simplifiés, textes à trous, lecture vocale du navigateur et impression A4.

## Services Supabase

- `process-course-document` : extraction OCR multimodale via Gemini.
- `titcha-ai` : réponses, explications, résumés et génération de quiz via Gemini.
- Tables de cours, documents, quiz, tentatives, points, profils et révisions avec RLS.
- Bucket Storage privé `student-documents`.

La présence du secret `GEMINI_API_KEY` a été vérifiée dans Supabase. Cela ne prouve pas encore que la clé est valide ni que les appels IA fonctionnent en production : un test de bout en bout reste nécessaire.

## Configuration des secrets

Dans Supabase → Edge Functions → Secrets, vérifier la présence de :

- `GEMINI_API_KEY`

La clé Gemini reste côté serveur dans Supabase. Ne jamais la placer dans `.env.local`, le code frontend, GitHub ou une variable `NEXT_PUBLIC_`. Ne jamais exposer une clé `service_role` / `sb_secret`.

## Commandes de validation

- `npm run typecheck`
- `npm run build`

Ces commandes doivent être exécutées après installation réussie des dépendances. Elles ne sont pas encore validées dans cet environnement.

## Restant à finaliser

- Renseigner la clé publishable Supabase dans l'environnement de déploiement.
- Tester réellement import, OCR Gemini, Prof IA et erreurs avec un compte utilisateur.
- Vérifier inscription, connexion, récupération de mot de passe et profil.
- Persister les révisions et les résultats/quiz dans la base lorsque les écrans concernés sont finalisés.
- Tester les politiques RLS, les erreurs, les limites d'usage et le parcours mobile.
- Déployer sur Vercel puis vérifier la prévisualisation et la production.

Le MVP n'active aucun paiement réel. Prévoir des limites d'usage et surveiller les coûts des API avant une ouverture publique.
