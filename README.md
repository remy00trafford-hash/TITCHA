# TITCHA

Application web d'apprentissage et de révision pour les élèves du secondaire au Bénin. Stack : Next.js 15, React 19, TypeScript et Supabase.

## Fonctionnalités MVP

- Inscription et connexion par e-mail avec Supabase Auth.
- Espace élève et navigation vers les matières, documents, Prof IA, révisions, points et méthodologie.
- Import privé de cours PDF, JPEG, PNG et WEBP.
- OCR Gemini via l'Edge Function `process-course-document`, avec stockage du texte extrait dans `course_documents`.
- Prof IA connecté à Gemini : question/réponse, explication et résumé basés sur un cours extrait.
- Génération de quiz de 10 questions, stockage des questions et des clés de correction côté serveur, correction et sauvegarde des tentatives.
- Historique des points (alimenté lorsque les règles d'attribution seront définies).

## Supabase

Projet : `htkynieftrrkdylcuzyt`.

Edge Functions actives :
- `process-course-document` (JWT obligatoire)
- `titcha-ai` (JWT obligatoire)

Secrets requis dans **Supabase → Edge Functions → Secrets** :
- `GEMINI_API_KEY`

La clé Gemini et la clé `service_role` restent exclusivement côté serveur. Ne jamais les ajouter au frontend, à GitHub ou à une variable `NEXT_PUBLIC_*`.

Deux fonctions SQL sécurisées sont utilisées pour sauvegarder et corriger les quiz :
- `public.titcha_save_quiz`
- `public.titcha_grade_quiz`

Elles sont en SECURITY DEFINER et leur exécution est réservée au rôle `service_role`.

## Variables d'environnement

Copier `.env.example` vers `.env.local` en local, ou définir ces deux variables dans Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=https://htkynieftrrkdylcuzyt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLISHABLE_SUPABASE
```

La clé publishable peut être récupérée dans Supabase → Project Settings → API Keys → Publishable key. Ne pas utiliser une clé secrète ou service role dans le navigateur.

## Déploiement Vercel

- Framework : Next.js
- Root Directory : `./` (racine du dépôt)
- Build Command : `npm run build`
- Install Command : `npm install`
- Node.js : 20.x ou supérieur
- Ajouter les deux variables publiques ci-dessus dans Production, Preview et Development.
- Déployer la branche `main`.

Dans Supabase → Authentication → URL Configuration, ajouter l'URL de production Vercel à **Site URL** et aux **Redirect URLs**. Autoriser aussi l'URL de preview si nécessaire. Vérifier la configuration de confirmation e-mail selon le parcours de test choisi.

## Validation

```bash
npm install
npm run typecheck
npm run build
```

Le workflow GitHub Actions `.github/workflows/ci.yml` exécute automatiquement ces trois étapes à chaque push sur `main`.

## Parcours de premier test

1. Ouvrir l'URL Vercel et créer un compte élève.
2. Confirmer l'e-mail si la confirmation Supabase est activée, puis se connecter.
3. Ouvrir **Documents**, importer un petit PDF de cours (moins de 5 Mo pour le premier essai).
4. Vérifier que l'état passe à **Traité** et que le texte extrait est consultable.
5. Ouvrir **Prof IA**, sélectionner ce cours et tester une question, puis Résumer et Expliquer.
6. Ouvrir **Révisions**, générer le quiz, répondre aux 10 questions et valider.
7. Vérifier le résultat et l'historique dans **Points** (aucun barème automatique n'est encore configuré).

## Limites connues du MVP

- Un test réel de bout en bout avec un compte utilisateur et un fichier est encore nécessaire après déploiement.
- La validité effective de la clé Gemini et les quotas API doivent être confirmés par ce test.
- Les révisions/quiz sont enregistrés, mais les rappels espacés avancés et le barème de points ne sont pas encore activés.
- Le produit ne comprend pas de paiement réel.
