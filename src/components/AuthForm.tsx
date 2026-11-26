'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const signup = mode === 'signup';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = pw.length >= 8;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg('');
    setSent(false);
    if (!emailValid) return setMsg('Adresse e-mail invalide. Vérifie le format.');
    if (!passwordValid) return setMsg('Le mot de passe doit contenir au moins 8 caractères.');
    if (signup && !name.trim()) return setMsg('Renseigne ton prénom pour continuer.');

    setBusy(true);
    try {
      const supabase = createClient();
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pw,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/tableau-de-bord`,
          },
        });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('already registered') || message.includes('already exists') || message.includes('user already')) {
            throw new Error('Un compte existe déjà avec cette adresse. Connecte-toi plutôt que de créer un nouveau compte.');
          }
          throw error;
        }
        if (data.session) {
          setMsg('Compte créé. Ouverture de ton espace…');
          window.location.replace('/tableau-de-bord');
          return;
        }
        setSent(true);
        setMsg('Le compte a été créé, mais Supabase ne renvoie pas encore de session. Vérifie si la confirmation e-mail est toujours activée dans Supabase, puis confirme ton adresse si un message a été envoyé.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pw,
        });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('email not confirmed')) {
            throw new Error('Ton adresse e-mail doit être confirmée avant la connexion. Ouvre le message reçu puis réessaie.');
          }
          if (message.includes('invalid login credentials')) {
            throw new Error('Adresse e-mail ou mot de passe incorrect. Vérifie tes identifiants.');
          }
          throw error;
        }
        window.location.replace('/tableau-de-bord');
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setMsg('');
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/tableau-de-bord`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Connexion Google impossible.');
      setBusy(false);
    }
  }

  async function resend() {
    if (!emailValid) {
      setMsg('Saisis une adresse e-mail valide dans le champ ci-dessus.');
      return;
    }
    setResending(true);
    try {
      const { error } = await createClient().auth.resend({ type: 'signup', email: email.trim() });
      if (error) throw error;
      setMsg('Demande envoyée. Vérifie ta boîte de réception et tes courriers indésirables.');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Impossible de renvoyer le message pour le moment.');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/" className="logo-link"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={170} height={42} priority /></Link>
        <Link href="/" className="auth-home">← Retour à l’accueil</Link>
      </header>
      <div className="auth-layout">
        <aside className="auth-guide">
          <div className="section-kicker">BIENVENUE SUR TITCHA</div>
          <h1>{signup ? 'Crée ton espace pour apprendre.' : 'Heureux de te retrouver.'}</h1>
          <p className="auth-guide-lead">{signup ? 'Quelques informations suffisent pour commencer.' : 'Connecte-toi pour retrouver tes cours et tes outils de révision.'}</p>
          <div className="auth-guide-card"><span className="guide-icon">📚</span><div><b>Un espace pour apprendre</b><p>Retrouve tes documents, ton professeur IA et tes outils de révision au même endroit.</p></div></div>
          <div className="auth-guide-card"><span className="guide-icon">🔒</span><div><b>Un accès personnel</b><p>Tes documents et ton espace sont associés à ton compte.</p></div></div>
          <div className="auth-mini-faq"><b>À quoi sert TITCHA ?</b><p>TITCHA t’aide à comprendre tes cours, organiser tes documents et préparer tes révisions.</p></div>
        </aside>
        <section className="card auth-card">
          <div className="auth-card-heading"><h2>{signup ? 'Créer mon compte' : 'Connexion'}</h2><p className="muted">{signup ? 'Renseigne les champs ci-dessous pour commencer.' : 'Entre tes identifiants pour retrouver ton espace.'}</p></div>
          <form onSubmit={submit} noValidate>
            {signup && <><label htmlFor="name">Prénom</label><input id="name" className="field" autoComplete="given-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ton prénom" /></>}
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" className="field" type="email" inputMode="email" autoComplete="email" value={email} aria-invalid={email.length > 0 && !emailValid} onChange={e => setEmail(e.target.value)} required placeholder="nom@domaine.com" />
            <label htmlFor="password">Mot de passe (8 caractères minimum)</label>
            <input id="password" className="field" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} value={pw} onChange={e => setPw(e.target.value)} required placeholder="8 caractères minimum" />
            <button className="btn auth-submit" disabled={busy || !emailValid || !passwordValid || (signup && !name.trim())}>{busy ? 'Patiente…' : signup ? 'Créer mon compte' : 'Se connecter'} <span>→</span></button>
          </form>
          <div className="auth-divider"><span>ou</span></div>
          <button type="button" className="btn auth-submit" onClick={signInWithGoogle} disabled={busy}>Continuer avec Google</button>
          {msg && <div className={sent ? 'auth-success' : 'notice'} role="status" aria-live="polite">{msg}</div>}
          {sent && <button type="button" className="resend-button" onClick={resend} disabled={resending}>{resending ? 'Envoi en cours…' : 'Renvoyer l’e-mail de confirmation'}</button>}
          <p className="auth-switch">{signup ? 'Déjà inscrit ? ' : 'Pas encore de compte ? '}<Link href={signup ? '/connexion' : '/inscription'}>{signup ? 'Se connecter' : 'Créer un compte'}</Link></p>
          <div className="auth-help-note"><b>Accès au compte</b><p>Si ton compte existe déjà, utilise « Connexion ». Si la confirmation e-mail est activée dans Supabase, confirme ton adresse avant de te connecter.</p></div>
        </section>
      </div>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} TITCHA</span><Link href="/#faq">Consulter toutes les FAQ</Link></footer>
    </main>
  );
}
