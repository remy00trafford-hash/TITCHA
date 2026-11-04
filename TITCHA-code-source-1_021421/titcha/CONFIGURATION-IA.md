# Configuration IA et OCR de TITCHA

## Projet Supabase

- URL : `https://htkynieftrrkdylcuzyt.supabase.co`
- Projet : `htkynieftrrkdylcuzyt`
- Bucket privé : `student-documents`
- Fonctions Edge : `process-course-document` et `titcha-ai`

## Secret fournisseur

Dans Supabase → Edge Functions → Secrets, le secret suivant doit être présent :

- `GEMINI_API_KEY` : clé Google Gemini utilisée par les deux fonctions Edge.

La valeur de ce secret reste exclusivement dans Supabase. Ne jamais la mettre dans `.env.local`, le code frontend ou GitHub. Ne jamais exposer de clé `service_role` / `sb_secret`.

## Variables du frontend

Copier `.env.example` vers `.env.local`, puis renseigner la clé publishable du projet Supabase :

- `NEXT_PUBLIC_SUPABASE_URL=https://htkynieftrrkdylcuzyt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé publishable du projet>`

La clé publishable peut être utilisée côté navigateur. Ne jamais utiliser la clé `service_role` ou une clé secrète dans une variable `NEXT_PUBLIC_`.

## Parcours intégré

1. `/documents` téléverse le fichier dans le bucket privé `student-documents`.
2. Le site crée la ligne `course_documents` avec le chemin, le type MIME et la taille.
3. Le site appelle `process-course-document` avec `document_id`.
4. La fonction OCR appelle Gemini et enregistre le texte extrait dans `course_documents.extracted_text`.
5. `/prof-ia` liste les documents traités et appelle `titcha-ai` pour répondre, expliquer, résumer ou générer un quiz à partir du document sélectionné.

## Vérifications restantes

- La présence de `GEMINI_API_KEY` a été observée dans Supabase, mais sa validité et les réponses réelles de Gemini doivent encore être testées de bout en bout.
- Le build Next.js et le contrôle TypeScript restent à exécuter dans un environnement avec les dépendances installées.
- La génération de quiz est actuellement présentée dans l'interface ; son enregistrement automatique dans les tables de quiz reste à finaliser.
- Les révisions sont actuellement stockées dans le navigateur (`localStorage`), pas encore synchronisées entre appareils.
