'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!emailValid) return setMessage('Saisis une adresse e-mail valide.');
    if (password.length < 8) return setMessage('Le mot de passe doit contenir au moins 8 caractères.');
    if (signup && !name.trim()) return setMessage('Saisis ton prénom pour continuer.');
    setBusy(true);
    try {
      const supabase = createClient();
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
        if (error) {
          const text = error.message.toLowerCase();
          if (text.includes('already registered') || text.includes('already exists') || text.includes('user already')) throw new Error('Cette adresse possède déjà un compte. Utilise le formulaire de connexion.');
          throw error;
        }
        if (data.session) { window.location.replace('/tableau-de-bord'); return; }
        setMessage('Ton compte est créé. Si une confirmation est demandée, valide ton adresse e-mail puis connecte-toi.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          const text = error.message.toLowerCase();
          if (text.includes('email not confirmed')) throw new Error('Confirme ton adresse e-mail avant de te connecter.');
          if (text.includes('invalid login credentials')) throw new Error('Adresse e-mail ou mot de passe incorrect.');
          throw error;
        }
        window.location.replace('/tableau-de-bord'); return;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <header className="auth-header">
      <Link href="/" className="logo-link"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={170} height={42} priority /></Link>
      <Link href="/" className="auth-home">← Retour à l’accueil</Link>
    </header>
    <div className="auth-layout">
      <aside className="auth-guide">
        <div className="section-kicker">BIENVENUE SUR TITCHA</div>
        <h1>{signup ? 'Crée ton espace pour apprendre.' : 'Heureux de te retrouver.'}</h1>
        <p className="auth-guide-lead">{signup ? 'Quelques informations suffisent pour commencer.' : 'Retrouve tes cours, ton professeur IA et tes révisions.'}</p>
        <div className="auth-guide-card"><span className="guide-icon">📚</span><div><b>Tous tes outils au même endroit</b><p>Documents, explications et exercices réunis dans un seul espace.</p></div></div>
        <div className="auth-guide-card"><span className="guide-icon">🔒</span><div><b>Un espace personnel</b><p>Ton travail et tes documents restent associés à ton compte.</p></div></div>
      </aside>
      <section className="card auth-card">
        <div className="auth-card-heading"><h2>{signup ? 'Créer mon compte' : 'Connexion'}</h2><p className="muted">{signup ? 'Renseigne les champs pour commencer.' : 'Entre tes identifiants pour retrouver ton espace.'}</p></div>
        <form onSubmit={submit} noValidate>
          {signup && <><label htmlFor="name">Prénom</label><input id="name" className="field" autoComplete="given-name" value={name} onChange={event => setName(event.target.value)} required placeholder="Ton prénom" /></>}
          <label htmlFor="email">Adresse e-mail</label>
          <input id="email" className="field" type="email" inputMode="email" autoComplete="email" value={email} aria-invalid={email.length > 0 && !emailValid} onChange={event => setEmail(event.target.value)} required placeholder="nom@domaine.com" />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" className="field" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={event => setPassword(event.target.value)} required placeholder="8 caractères minimum" />
          <button className="btn auth-submit" disabled={busy || !emailValid || password.length < 8 || (signup && !name.trim())}>{busy ? 'Patiente…' : signup ? 'Créer mon compte' : 'Se connecter'} <span>→</span></button>
        </form>
        {message && <div className="notice" role="status" aria-live="polite">{message}</div>}
        <p className="auth-switch">{signup ? 'Déjà inscrit ? ' : 'Pas encore de compte ? '}<Link href={signup ? '/connexion' : '/inscription'}>{signup ? 'Se connecter' : 'Créer un compte'}</Link></p>
      </section>
    </div>
    <footer className="auth-footer"><span>© {new Date().getFullYear()} TITCHA</span><Link href="/#faq">Aide & questions</Link></footer>
  </main>;
}
