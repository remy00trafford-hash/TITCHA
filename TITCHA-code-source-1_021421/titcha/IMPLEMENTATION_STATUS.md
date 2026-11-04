# TITCHA — état technique au 04/11/2026

## Confirmé côté Supabase
- Projet utilisé par le frontend : `htkynieftrrkdylcuzyt`.
- Tables métier pour classes, matières, profils, cours, documents, fragments, quiz, tentatives, réponses, points et révisions.
- RLS activée sur les tables métier.
- Bucket privé `student-documents`.
- Edge Functions `process-course-document` et `titcha-ai` actives, vérification JWT activée.
- Secret `GEMINI_API_KEY` présent dans Edge Function Secrets (valeur masquée par Supabase).

## Présent côté code
- Pages principales Next.js : accueil, inscription/connexion, tableau de bord, matières, documents, Prof IA, révisions, points, méthodologie et profil.
- Authentification Supabase et récupération de mot de passe.
- Import de documents avec enregistrement dans `course_documents`, puis appel automatique de `process-course-document`.
- Prof IA connecté à `titcha-ai` pour question-réponse, explication, résumé et génération de quiz.
- Révisions avec cartes, répétition espacée simplifiée, textes à trous, lecture vocale et impression A4. Les cartes sont encore stockées localement.

## Non confirmé / reste à faire
- La présence du secret Gemini est confirmée, mais sa validité et les appels réels n'ont pas encore été testés de bout en bout.
- `npm install` a dépassé le délai dans l'environnement de préparation ; `npm run typecheck` et `npm run build` n'ont donc pas été exécutés avec succès.
- L'enregistrement automatique des quiz générés et la synchronisation cloud des révisions restent à compléter.
- Aucun déploiement web de production n'est confirmé.
- Tester la sécurité, les politiques RLS, les erreurs et les limites d'usage avant ouverture publique.

## Règles de sécurité
- Garder `GEMINI_API_KEY` exclusivement dans Supabase Edge Function Secrets.
- N'utiliser que la clé publishable côté frontend.
- Ne jamais committer `.env.local`, une clé secrète ou une clé `service_role`.
