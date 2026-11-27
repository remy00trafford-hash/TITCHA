'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Globe2,Dna,PenLine} from 'lucide-react';

const guides = {
 hg: {
  title: 'Dissertation en histoire-géographie',
  intro: 'La dissertation est une démonstration organisée : analyser le sujet, poser une problématique et construire une réponse argumentée avec des connaissances précises.',
  steps: [
   ['Analyser le sujet','Repère les mots-clés, définis les notions et identifie les limites chronologiques en histoire ou spatiales en géographie. Reformule le sujet pour vérifier que tu l’as compris.'],
   ['Construire la problématique','Transforme le sujet en une question directrice qui fait apparaître le problème à résoudre.'],
   ['Préparer le plan détaillé','Classe tes connaissances en deux ou trois grandes parties équilibrées. Pour chaque idée, prévois une explication et un exemple précis : date, acteur, lieu ou fait vérifiable.'],
   ['Rédiger l’introduction','Présente le contexte, définis et délimite le thème, formule la problématique puis annonce les axes du devoir.'],
   ['Rédiger le développement','Développe une idée principale par paragraphe. Appuie-la par des faits précis et explique leur lien avec le sujet. Fais une transition logique entre les parties.'],
   ['Conclure et relire','Réponds à la problématique par un bilan synthétique. Relis les dates, les noms et la cohérence du raisonnement.']
  ],
  example: 'Sujet : « Les conséquences de la Seconde Guerre mondiale ».\nProblématique possible : comment la guerre a-t-elle bouleversé les équilibres politiques, économiques et humains ?\nPlan possible : I. Un bilan humain et matériel considérable ; II. Un nouvel ordre politique mondial ; III. Des transformations économiques et sociales durables.',
  avoid: ['Réciter le cours sans répondre au sujet','Oublier les limites du sujet','Accumuler des dates sans expliquer leur importance','Présenter un plan déséquilibré','Inventer un fait ou une statistique']
 },
 svt: {
  title: 'Rédaction scientifique argumentée en SVT',
  intro: 'En SVT, la réponse construite suit une démarche scientifique. Selon la consigne de l’enseignant, elle peut prendre la forme d’une composition ou d’une dissertation scientifique : le raisonnement et l’exploitation des données priment.',
  steps: [
   ['Observer et relever les faits','Pars de la situation proposée. Relève les données et faits significatifs sans les interpréter trop tôt.'],
   ['Formuler le problème scientifique','Transforme les faits observés en une ou plusieurs questions scientifiques précises.'],
   ['Proposer des hypothèses','Énonce des explications provisoires qui peuvent être confrontées aux données ou vérifiées.'],
   ['Prévoir une démarche','Propose les actions, expériences, comparaisons ou recherches qui permettraient de tester les hypothèses.'],
   ['Exploiter les résultats','Présente les résultats ou documents utiles, décris les observations et interprète-les avec les connaissances du cours.'],
   ['Construire la réponse et conclure','Organise les arguments dans un texte scientifiquement juste. Réponds au problème et précise ce que les résultats permettent réellement d’affirmer.']
  ],
  example: 'Observation : après suppression d’une structure, le phénomène étudié diminue.\nInterprétation : cette structure intervient dans le mécanisme, mais cette observation seule ne prouve pas qu’elle en est l’unique cause.\nConclusion : les résultats soutiennent son rôle ; il faut confronter cette conclusion aux autres données disponibles.',
  avoid: ['Réciter des définitions sans les relier au problème','Confondre observation et interprétation','Décrire un graphique sans exploiter ses tendances','Affirmer une causalité à partir d’une simple corrélation','Oublier les unités, axes ou conditions expérimentales']
 }
};

type Subject = keyof typeof guides;

export default function MethodologiePage(){
 const [subject,setSubject]=useState<Subject>('hg'); const [open,setOpen]=useState(0); const guide=guides[subject];
 return <main className="wrap methodology-page">
  <section className="methodology-hero"><span className="welcome-eyebrow">APPRENDRE À RÉDIGER AVEC MÉTHODE</span><h1>Découvrir les méthodologies</h1><p>Des guides progressifs pour construire un devoir clair, organisé et argumenté.</p><Link href="/tableau-de-bord" className="method-back">← Mon espace</Link></section>
  <div className="method-tabs" role="tablist" aria-label="Choisir une matière"><button role="tab" aria-selected={subject==='hg'} className={subject==='hg'?'active':''} onClick={()=>{setSubject('hg');setOpen(0);}}><Globe2 size={17} aria-hidden="true"/> Histoire-Géographie</button><button role="tab" aria-selected={subject==='svt'} className={subject==='svt'?'active':''} onClick={()=>{setSubject('svt');setOpen(0);}}><Dna size={17} aria-hidden="true"/> SVT</button></div>
  <section className="method-intro"><span className="method-subject-icon">{subject==='hg'?<Globe2 size={30}/>:<Dna size={30}/>}</span><div><h2>{guide.title}</h2><p>{guide.intro}</p></div></section>
  <section className="method-learning"><div className="method-steps"><div className="method-section-heading"><span>GUIDE PAS À PAS</span><h2>Construire ton devoir</h2></div>{guide.steps.map(([title,description],i)=><article className={'method-step '+(open===i?'expanded':'')} key={title}><button onClick={()=>setOpen(open===i?-1:i)} aria-expanded={open===i}><span className="method-number">{String(i+1).padStart(2,'0')}</span><b>{title}</b><span className="method-chevron">{open===i?'−':'+'}</span></button>{open===i&&<p>{description}</p>}</article>)}</div>
   <aside className="method-aside"><span><PenLine size={25}/></span><h3>Exemple de raisonnement</h3><pre>{guide.example}</pre><h3>Erreurs à éviter</h3><ul>{guide.avoid.map(item=><li key={item}>{item}</li>)}</ul></aside></section>
  <p className="method-note">Ces fiches sont un guide de travail. Les consignes de ton professeur et les exigences de ton programme restent prioritaires.</p>
 </main>;
}