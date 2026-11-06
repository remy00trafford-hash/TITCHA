'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type CourseDocument = { id: string; title: string; processing_status: string };
type Task = 'answer' | 'explain' | 'summarize' | 'generate_quiz';

const tasks: { id: Task; label: string }[] = [
  { id: 'answer', label: 'Question' },
  { id: 'explain', label: 'Expliquer' },
  { id: 'summarize', label: 'Résumer' },
  { id: 'generate_quiz', label: 'Créer un quiz' },
];

export default function ProfIAPage() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [task, setTask] = useState<Task>('answer');
  const [question, setQuestion] = useState('');
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage('Connecte-toi pour utiliser le Prof IA.'); return; }
      const { data, error } = await supabase.from('course_documents')
        .select('id,title,processing_status')
        .eq('owner_id', user.id)
        .eq('processing_status', 'processed')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) setMessage(error.message);
      const rows = (data ?? []) as CourseDocument[];
      setDocuments(rows);
      const requested = searchParams.get('document');
      setDocumentId(requested && rows.some(row => row.id === requested) ? requested : rows[0]?.id ?? '');
    }
    void load();
    return () => { active = false; };
  }, [searchParams]);

  async function run() {
    if (!documentId) { setMessage('Importe et traite d’abord un cours dans Mes documents.'); return; }
    if (task === 'answer' && !question.trim()) { setMessage('Écris ta question.'); return; }
    setBusy(true); setMessage('Le professeur analyse ton cours…'); setOutput('');
    try {
      const { data, error } = await createClient().functions.invoke('titcha-ai', {
        body: { document_id: documentId, task, question: question.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.output) throw new Error('Le professeur n’a pas retourné de réponse.');
      setOutput(data.output);
      setMessage('Réponse générée à partir de ton document.');
      if (task === 'answer') setQuestion('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Le service IA est momentanément indisponible.');
    } finally { setBusy(false); }
  }

  return (
    <main className="wrap">
      <Link className="brand" href="/tableau-de-bord">TITCHA.</Link>
      <h1>Ton Prof IA 🧑🏽‍🏫</h1>
      <p className="muted">Un accompagnement fondé sur tes propres cours. Le professeur ne doit pas inventer une réponse lorsque le document ne contient pas l’information.</p>
      <section className="card">
        <label htmlFor="course">Cours à utiliser</label>
        <select id="course" className="field" value={documentId} onChange={event => setDocumentId(event.target.value)}>
          <option value="">Choisir un cours traité</option>
          {documents.map(document => <option key={document.id} value={document.id}>{document.title}</option>)}
        </select>
        {documents.length === 0 && <p className="muted">Aucun cours traité. <Link href="/documents">Importer un document →</Link></p>}
        <div className="nav" role="group" aria-label="Type d'aide">
          {tasks.map(item => <button key={item.id} className={task === item.id ? 'btn' : 'btn alt'} onClick={() => setTask(item.id)}>{item.label}</button>)}
        </div>
        {task === 'answer' && <textarea className="field" rows={4} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Pose ta question sur le cours…"/>}
        {task !== 'answer' && <p className="muted">{task === 'explain' ? 'Le professeur va reprendre les notions difficiles étape par étape.' : task === 'summarize' ? 'Le professeur va produire une fiche de synthèse fidèle au cours.' : 'Le professeur va créer 10 questions pour vérifier ta compréhension.'}</p>}
        <button className="btn" disabled={busy || !documentId} onClick={run}>{busy ? 'Analyse en cours…' : 'Envoyer au professeur'}</button>
        {message && <p className="notice" role="status">{message}</p>}
      </section>
      {output && <section className="card"><h2>{task === 'generate_quiz' ? 'Ton quiz' : 'Réponse du professeur'}</h2><div className="ai-output">{output}</div></section>}
      <p className="muted">Les réponses sont générées par Gemini à partir du cours sélectionné. Vérifie les éléments importants avec ton enseignant.</p>
    </main>
  );
}
