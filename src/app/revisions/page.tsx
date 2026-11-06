'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Doc = { id: string; title: string };
type Question = { id: string; position: number; prompt: string; options: {id?:string;text?:string;label?:string}[]; points: number };
type Quiz = { id: string; title: string; questions: Question[] };
type Correction = { question_id:string; prompt:string; answer:unknown; correct_answer:unknown; is_correct:boolean; explanation:string };

export default function RevisionsPage() {
  const [docs,setDocs]=useState<Doc[]>([]);
  const [docId,setDocId]=useState('');
  const [quiz,setQuiz]=useState<Quiz|null>(null);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [result,setResult]=useState<{score:number;max_score:number;percent:number;corrections:Correction[]}|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{let active=true;(async()=>{
    const sb=createClient();const {data:{user}}=await sb.auth.getUser();
    if(!user){setMessage('Connecte-toi pour retrouver tes cours et tes quiz.');return;}
    const {data,error}=await sb.from('course_documents').select('id,title').eq('owner_id',user.id).eq('processing_status','processed').order('created_at',{ascending:false});
    if(!active)return;if(error)setMessage(error.message);
    const rows=(data??[]) as Doc[];setDocs(rows);if(rows[0])setDocId(rows[0].id);
  })();return()=>{active=false}},[]);

  async function generate(){
    if(!docId){setMessage('Importe et traite un cours avant de créer un quiz.');return}
    setBusy(true);setMessage('Gemini prépare 10 questions à partir de ton cours…');setQuiz(null);setResult(null);setAnswers({});
    try{
      const {data,error}=await createClient().functions.invoke('titcha-ai',{body:{document_id:docId,task:'generate_quiz'}});
      if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);
      if(!data?.quiz_id||!Array.isArray(data.questions))throw new Error('Le quiz reçu est incomplet.');
      setQuiz({id:data.quiz_id,title:data.title,questions:data.questions});setMessage('Quiz enregistré. Réponds aux questions puis valide.');
    }catch(e){setMessage(e instanceof Error?e.message:'Génération impossible.')}finally{setBusy(false)}
  }

  async function submit(){
    if(!quiz)return;
    if(quiz.questions.some(q=>!answers[q.id])){setMessage('Réponds à toutes les questions avant de valider.');return}
    setBusy(true);setMessage('Correction en cours…');
    try{
      const {data,error}=await createClient().functions.invoke('titcha-ai',{body:{task:'grade_quiz',quiz_id:quiz.id,answers:quiz.questions.map(q=>({question_id:q.id,answer:answers[q.id]}))}});
      if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);
      setResult(data);setMessage('Quiz corrigé et résultat enregistré dans ton compte.');
    }catch(e){setMessage(e instanceof Error?e.message:'Correction impossible.')}finally{setBusy(false)}
  }

  return <main className="wrap">
    <Link className="brand" href="/tableau-de-bord">TITCHA.</Link>
    <h1>Mes révisions</h1>
    <p className="muted">Travaille à partir de tes propres cours, puis vérifie tes acquis avec un quiz corrigé.</p>
    <section className="card">
      <h2>Créer un quiz de révision</h2>
      <label htmlFor="revision-course">Cours</label>
      <select id="revision-course" className="field" value={docId} onChange={e=>setDocId(e.target.value)}>
        <option value="">Sélectionner un cours</option>{docs.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
      {docs.length===0&&<p className="muted">Aucun cours traité. <Link href="/documents">Importer un cours →</Link></p>}
      <button className="btn" disabled={busy||!docId} onClick={generate}>{busy?'Préparation…':'Générer 10 questions'}</button>
    </section>
    {quiz&&<section className="card">
      <h2>{quiz.title}</h2>
      <p className="muted">{quiz.questions.length} questions · Choisis une réponse par question.</p>
      {quiz.questions.map((q,i)=><fieldset className="quiz-question" key={q.id}>
        <legend><b>{i+1}. {q.prompt}</b></legend>
        {q.options.map((option,j)=>{const value=String(option.id??option.label??String.fromCharCode(65+j));const label=String(option.text??option.label??option.id??'');return <label className="quiz-option" key={value}><input type="radio" name={q.id} value={value} checked={answers[q.id]===value} disabled={!!result} onChange={()=>setAnswers(prev=>({...prev,[q.id]:value}))}/><span>{value}. {label}</span></label>})}
      </fieldset>)}
      {!result&&<button className="btn" disabled={busy} onClick={submit}>Valider mes réponses</button>}
    </section>}
    {result&&<section className="card">
      <h2>Ton résultat</h2><p className="stat">{result.score}/{result.max_score} points</p><h3>{result.percent}% de réussite</h3>
      {result.corrections.map((c,i)=><article className="quiz-question" key={c.question_id}>
        <b>{i+1}. {c.prompt}</b><p>{c.is_correct?'✅ Bonne réponse':'❌ Réponse incorrecte'}</p>
        <p className="muted">Bonne réponse : {typeof c.correct_answer==='string'?c.correct_answer:JSON.stringify(c.correct_answer)}</p>
        {c.explanation&&<p>{c.explanation}</p>}
      </article>)}
      <button className="btn" onClick={()=>{setQuiz(null);setResult(null);setAnswers({});}}>Créer un autre quiz</button>
    </section>}
    {message&&<p className="notice" role="status">{message}</p>}
    <section className="grid">
      <Link className="card" href="/documents"><h2>📄 Mes documents</h2><p className="muted">Gérer mes cours et leurs extractions</p></Link>
      <Link className="card" href="/points"><h2>⭐ Mes points</h2><p className="muted">Consulter mon historique de progression</p></Link>
    </section>
  </main>;
}
