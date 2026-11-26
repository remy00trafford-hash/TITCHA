'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type CourseDocument = { id: string; title: string };
type Task = 'answer' | 'explain' | 'summarize' | 'generate_quiz';
type Message = { role: 'student' | 'teacher'; text: string };

const tasks: { id: Task; label: string; icon: string; prompt: string }[] = [
  { id: 'answer', label: 'Poser une question', icon: '💬', prompt: 'Pose ta question sur le cours…' },
  { id: 'explain', label: 'M’expliquer', icon: '💡', prompt: 'Quelle notion veux-tu comprendre ? (facultatif)' },
  { id: 'summarize', label: 'Résumer', icon: '📘', prompt: 'Précise une partie du cours à résumer (facultatif)' },
  { id: 'generate_quiz', label: 'Créer un quiz', icon: '🎯', prompt: 'Quel chapitre veux-tu réviser ? (facultatif)' },
];

export default function ProfIAPage() {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [task, setTask] = useState<Task>('answer');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage('Ta session a expiré. Reconnecte-toi pour continuer.'); return; }
      const { data, error } = await supabase.from('course_documents').select('id,title').eq('owner_id', user.id).eq('processing_status', 'processed').order('created_at', { ascending: false });
      if (!active) return;
      if (error) setMessage('Impossible de charger tes cours pour le moment.');
      const rows = (data ?? []) as CourseDocument[];
      setDocuments(rows);
      const requested = new URLSearchParams(window.location.search).get('document');
      setDocumentId(requested && rows.some(row => row.id === requested) ? requested : rows[0]?.id ?? '');
    })();
    return () => { active = false; window.speechSynthesis?.cancel(); };
  }, []);

  function speak(text: string) {
    if (!('speechSynthesis' in window)) { setMessage('La lecture vocale n’est pas disponible dans ce navigateur.'); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.96;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function run() {
    if (!documentId) { setMessage('Importe et traite d’abord un cours dans Mes documents.'); return; }
    if (task === 'answer' && !question.trim()) { setMessage('Écris ta question avant d’envoyer.'); return; }
    const prompt = question.trim();
    setBusy(true); setMessage('');
    setMessages(prev => [...prev, ...(prompt ? [{ role: 'student' as const, text: prompt }] : []), { role: 'teacher', text: task === 'generate_quiz' ? 'Je prépare ton quiz à partir du cours…' : 'Je relis ton cours et je prépare une explication…' }]);
    try {
      const { data, error } = await createClient().functions.invoke('titcha-ai', { body: { document_id: documentId, task, question: prompt } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (task === 'generate_quiz' && data?.quiz_id) {
        setMessages(prev => [...prev.slice(0, -1), { role: 'teacher', text: `Ton quiz « ${data.title} » est prêt avec ${data.questions?.length ?? 10} questions. Ouvre l’espace Révisions pour répondre et obtenir ta correction.` }]);
        setMessage('Quiz créé et enregistré.');
      } else if (data?.output) {
        setMessages(prev => [...prev.slice(0, -1), { role: 'teacher', text: data.output }]);
      } else throw new Error('Le professeur n’a pas retourné de réponse.');
      setQuestion('');
    } catch (error) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'teacher', text: 'Je n’ai pas pu traiter cette demande. Vérifie le cours sélectionné et réessaie.' }]);
      setMessage(error instanceof Error ? error.message : 'Le service est momentanément indisponible.');
    } finally { setBusy(false); }
  }

  const selectedTask = tasks.find(item => item.id === task)!;
  return <main className="wrap prof-page">
    <div className="prof-heading"><div><span className="welcome-eyebrow">TON ACCOMPAGNEMENT PÉDAGOGIQUE</span><h1>Ton Professeur IA</h1><p className="muted">Un professeur disponible pour t’aider à comprendre, questionner et réviser tes cours.</p></div><Link className="btn alt" href="/documents">Mes cours</Link></div>
    <section className="prof-workspace">
      <aside className="prof-side">
        <div className="prof-character"><div className={`prof-avatar ${speaking || busy ? 'is-active' : ''}`}><span>🧑🏾‍🏫</span></div><div className="prof-presence"><i/> Professeur disponible</div></div>
        <h2>Bonjour !</h2><p>Je suis là pour t’aider à progresser. Choisis ton cours et dis-moi ce que tu souhaites travailler.</p>
        <label htmlFor="prof-course">Ton cours</label>
        <select id="prof-course" className="field" value={documentId} onChange={event => setDocumentId(event.target.value)}><option value="">Sélectionner un cours</option>{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select>
        {documents.length === 0 && <Link className="btn" href="/documents">Importer mon premier cours →</Link>}
        <div className="prof-trust">Les réponses s’appuient sur le document sélectionné.</div>
      </aside>
      <section className="prof-chat">
        <div className="prof-chat-header"><div><b>Conversation pédagogique</b><small>{documents.find(doc => doc.id === documentId)?.title ?? 'Aucun cours sélectionné'}</small></div><span className="chat-online">En ligne</span></div>
        <div className="prof-messages" aria-live="polite">
          {messages.length === 0 && <div className="prof-empty"><span>✦</span><h3>Par quoi veux-tu commencer ?</h3><p>Choisis une action ci-dessous ou écris directement ta question.</p></div>}
          {messages.map((item, index) => <article className={`chat-bubble ${item.role}`} key={index}><small>{item.role === 'student' ? 'Toi' : 'Professeur IA'}</small><p>{item.text}</p>{item.role === 'teacher' && <button className="speak-button" onClick={() => speak(item.text)}>{speaking ? '■ Arrêter la lecture' : '🔊 Écouter la réponse'}</button>}</article>)}
          {busy && <div className="teacher-thinking"><span/><span/><span/> Le professeur réfléchit…</div>}
        </div>
        <div className="prof-composer">
          <div className="prof-task-list">{tasks.map(item => <button type="button" key={item.id} className={task === item.id ? 'prof-task active' : 'prof-task'} onClick={() => setTask(item.id)}><span>{item.icon}</span>{item.label}</button>)}</div>
          <div className="prof-input-row"><textarea className="field" rows={2} value={question} onChange={event => setQuestion(event.target.value)} placeholder={selectedTask.prompt} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!busy) void run(); } }} /><button className="btn prof-send" onClick={run} disabled={busy || !documentId || (task === 'answer' && !question.trim())}>{busy ? '…' : 'Envoyer →'}</button></div>
          {message && <p className="prof-status" role="status">{message}</p>}
        </div>
      </section>
    </section>
    <div className="prof-footer-links"><Link href="/revisions">Aller aux quiz de révision →</Link><Link href="/tableau-de-bord">Retour à mon espace →</Link></div>
  </main>;
}
