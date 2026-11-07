'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {createClient} from '@/lib/supabase/client';

export default function AuthForm({mode}:{mode:'login'|'signup'}) {
 const [email,setEmail]=useState(''); const [pw,setPw]=useState(''); const [name,setName]=useState('');
 const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false); const router=useRouter(); const signup=mode==='signup';
 const emailValid=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
 const passwordValid=pw.length>=8;
 async function submit(e:React.FormEvent) {
  e.preventDefault(); setMsg('');
  if(!emailValid){setMsg('Adresse e-mail invalide. Vérifie le format, par exemple nom@domaine.com.');return;}
  if(!passwordValid){setMsg('Le mot de passe doit contenir au moins 8 caractères.');return;}
  if(signup&&!name.trim()){setMsg('Renseigne ton prénom pour continuer.');return;}
  setBusy(true);
  try {const sb=createClient();if(signup){const{data,error}=await sb.auth.signUp({email:email.trim(),password:pw,options:{data:{full_name:name.trim()}}});if(error)throw error;setMsg(data.session?'Compte créé.':'Compte créé : vérifie ton e-mail pour confirmer ton adresse.');if(data.session)router.push('/tableau-de-bord');}else{const{error}=await sb.auth.signInWithPassword({email:email.trim(),password:pw});if(error)throw error;router.push('/tableau-de-bord');router.refresh();}}
  catch(e){setMsg(e instanceof Error?e.message:'Une erreur est survenue. Réessaie.');}finally{setBusy(false);}
 }
 return <main className="wrap"><div className="card form"><Link href="/" className="logo-link"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={170} height={42} priority/></Link><h1>{signup?'Créer mon compte':'Connexion'}</h1><p className="muted">{signup?'Rejoins ton espace d’apprentissage.':'Retrouve ton espace et continue à apprendre.'}</p>
 <form onSubmit={submit} noValidate>{signup&&<><label htmlFor="name">Prénom</label><input id="name" className="field" autoComplete="given-name" value={name} onChange={e=>setName(e.target.value)} required/></>}
 <label htmlFor="email">Adresse e-mail</label><input id="email" className="field" type="email" inputMode="email" autoComplete="email" value={email} aria-invalid={email.length>0&&!emailValid} aria-describedby="email-help" onChange={e=>setEmail(e.target.value)} required/><small id="email-help" style={{display:'block',marginTop:-9,marginBottom:13,color:email.length===0?'#77829a':emailValid?'#21886d':'#c44d3c'}}>{email.length===0?'Exemple : nom@domaine.com':emailValid?'Format d’adresse valide':'Format invalide — vérifie ton adresse e-mail.'}</small>
 <label htmlFor="password">Mot de passe (8 caractères minimum)</label><input id="password" className="field" type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} value={pw} onChange={e=>setPw(e.target.value)} required/>
 <button className="btn" disabled={busy||!emailValid||!passwordValid||(signup&&!name.trim())}>{busy?'Patiente…':signup?'Créer mon compte':'Se connecter'}</button></form>
 {msg&&<p className="notice" role="alert">{msg}</p>}<p className="muted">{signup?'Déjà inscrit ? ':'Pas encore de compte ? '}<Link style={{color:'#315cff',fontWeight:700}} href={signup?'/connexion':'/inscription'}>{signup?'Connexion':'Inscription'}</Link></p><p className="muted"><Link href="/">← Retour à l’accueil</Link></p>
 </div></main>;
}