'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {createClient} from '@/lib/supabase/client';

export default function AuthForm({mode}:{mode:'login'|'signup'}) {
 const [email,setEmail]=useState(''); const [pw,setPw]=useState(''); const [name,setName]=useState('');
 const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false); const [resending,setResending]=useState(false); const [sent,setSent]=useState(false);
 const router=useRouter(); const signup=mode==='signup';
 const emailValid=/^[a-zA-Z0-9.!#$%&'*+/=?^`_{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
 const passwordValid=pw.length>=8;
 async function submit(e:React.FormEvent) {
  e.preventDefault(); setMsg(''); setSent(false);
  if(!emailValid){setMsg('Adresse e-mail invalide. Vérifie le format, par exemple nom@domaine.com.');return;}
  if(!passwordValid){setMsg('Le mot de passe doit contenir au moins 8 caractères.');return;}
  if(signup&&!name.trim()){setMsg('Renseigne ton prénom pour continuer.');return;}
  setBusy(true);
  try {
   const sb=createClient();
   if(signup){
    const{data,error}=await sb.auth.signUp({email:email.trim(),password:pw,options:{data:{full_name:name.trim()}}});
    if(error)throw error;
    if(data.session){setMsg('Compte créé. Ouverture de ton espace…');window.location.assign('/tableau-de-bord');}
    else {setSent(true);setMsg('Compte créé ! Un e-mail de confirmation vient de t’être envoyé. Ouvre-le et clique sur le lien « Confirmer mon adresse e-mail ». Tu reviendras ensuite sur TITCHA : connecte-toi avec la même adresse et le même mot de passe.');}
   } else {
    const{error}=await sb.auth.signInWithPassword({email:email.trim(),password:pw});
    if(error){
     const m=error.message.toLowerCase();
     if(m.includes('email not confirmed')) throw new Error('Ton adresse e-mail n’est pas encore confirmée. Ouvre le message de confirmation reçu par e-mail, clique sur son lien, puis reviens ici pour te connecter.');
     if(m.includes('invalid login credentials')) throw new Error('Adresse e-mail ou mot de passe incorrect. Vérifie tes informations ou crée un compte si tu n’en as pas encore.');
     throw error;
    }
    window.location.assign('/tableau-de-bord');
   }
  } catch(e){setMsg(e instanceof Error?e.message:'Une erreur est survenue. Réessaie.');}
  finally{setBusy(false);}
 }
 async function resend(){
  if(!emailValid){setMsg('Saisis d’abord une adresse e-mail valide dans le champ ci-dessus.');return;}
  setResending(true);
  try{const{error}=await createClient().auth.resend({type:'signup',email:email.trim()});if(error)throw error;setMsg('Un nouvel e-mail de confirmation a été demandé. Vérifie ta boîte de réception et tes courriers indésirables.');}
  catch(e){setMsg(e instanceof Error?e.message:'Impossible de renvoyer le message pour le moment. Réessaie plus tard.');}
  finally{setResending(false);}
 }
 return <main className="auth-page">
  <header className="auth-header"><Link href="/" className="logo-link"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={170} height={42} priority/></Link><Link href="/" className="auth-home">← Retour à l’accueil</Link></header>
  <div className="auth-layout">
   <aside className="auth-guide">
    <div className="section-kicker">BIENVENUE SUR TITCHA</div>
    <h1>{signup?'Crée ton espace pour apprendre.':'Heureux de te retrouver.'}</h1>
    <p className="auth-guide-lead">{signup?'Quelques informations suffisent. Nous te guidons ensuite pour confirmer ton adresse et accéder à ton espace.':'Connecte-toi avec l’adresse e-mail et le mot de passe utilisés lors de ton inscription.'}</p>
    <div className="auth-guide-card"><span className="guide-icon">✉</span><div><b>{signup?'Après ton inscription':'Première connexion ?'}</b><p>{signup?'Nous envoyons un message à ton adresse e-mail. Ouvre-le et clique sur le lien de confirmation.':'Si tu n’as pas encore confirmé ton adresse, retrouve le message de confirmation dans ta boîte e-mail.'}</p></div></div>
    <div className="auth-guide-card"><span className="guide-icon">↩</span><div><b>Comment revenir sur TITCHA ?</b><p>Après avoir cliqué sur le lien reçu, reviens sur ce site et ouvre « Connexion ». Utilise la même adresse e-mail et le même mot de passe.</p></div></div>
    <div className="auth-guide-card"><span className="guide-icon">🔒</span><div><b>Un problème ?</b><p>Vérifie les courriers indésirables, l’orthographe de ton adresse et ton mot de passe. Le lien de confirmation ne remplace pas ton mot de passe.</p></div></div>
    <div className="auth-mini-faq"><b>À quoi sert TITCHA ?</b><p>TITCHA rassemble tes documents de cours, un professeur IA pour t’aider à comprendre et des outils pour réviser.</p></div>
   </aside>
   <section className="card auth-card">
    <div className="auth-card-heading"><h2>{signup?'Créer mon compte':'Connexion'}</h2><p className="muted">{signup?'Renseigne les champs ci-dessous pour commencer.':'Entre tes identifiants pour retrouver ton espace.'}</p></div>
    <form onSubmit={submit} noValidate>
     {signup&&<><label htmlFor="name">Prénom</label><input id="name" className="field" autoComplete="given-name" value={name} onChange={e=>setName(e.target.value)} required placeholder="Ton prénom"/></>}
     <label htmlFor="email">Adresse e-mail</label><input id="email" className="field" type="email" inputMode="email" autoComplete="email" value={email} aria-invalid={email.length>0&&!emailValid} aria-describedby="email-help" onChange={e=>setEmail(e.target.value)} required placeholder="nom@domaine.com"/><small id="email-help" className="field-help">{email.length===0?'Exemple : nom@domaine.com':emailValid?'Format d’adresse valide':'Format invalide — vérifie ton adresse e-mail.'}</small>
     <label htmlFor="password">Mot de passe (8 caractères minimum)</label><input id="password" className="field" type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} value={pw} onChange={e=>setPw(e.target.value)} required placeholder="8 caractères minimum"/>
     <button className="btn auth-submit" disabled={busy||!emailValid||!passwordValid||(signup&&!name.trim())}>{busy?'Patiente…':signup?'Créer mon compte':'Se connecter'} <span>→</span></button>
    </form>
    {msg&&<div className={sent?'auth-success':'notice'} role="status" aria-live="polite">{msg}</div>}
    {sent&&<button type="button" className="resend-button" onClick={resend} disabled={resending}>{resending?'Envoi en cours…':'Je n’ai pas reçu l’e-mail — Renvoyer'}</button>}
    <p className="auth-switch">{signup?'Déjà inscrit ? ':'Pas encore de compte ? '}<Link href={signup?'/connexion':'/inscription'}>{signup?'Se connecter':'Créer un compte'}</Link></p>
    <div className="auth-help-note"><b>À retenir</b><p>La confirmation se fait depuis le message envoyé à ton adresse e-mail. Après confirmation, reviens sur cette page et connecte-toi normalement. Aucun code à recopier n’est demandé dans le formulaire actuel.</p></div>
   </section>
  </div>
  <footer className="auth-footer"><span>© {new Date().getFullYear()} TITCHA</span><Link href="/#faq">Consulter toutes les FAQ</Link></footer>
 </main>;
}