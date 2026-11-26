import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const tools = [
  { href: '/documents', icon: '📂', title: 'Mes cours', text: 'Importe tes supports et retrouve-les au même endroit.', tone: 'violet', action: 'Gérer mes cours' },
  { href: '/prof-ia', icon: '🧑🏾‍🏫', title: 'Professeur IA', text: 'Pose une question et obtiens une explication fondée sur ton cours.', tone: 'peach', action: 'Parler au professeur' },
  { href: '/revisions', icon: '🎯', title: 'Révisions & quiz', text: 'Entraîne-toi, réponds et consulte tes corrections.', tone: 'mint', action: 'Lancer une révision' },
  { href: '/matieres', icon: '📚', title: 'Mes matières', text: 'Accède aux matières disponibles dans ton espace.', tone: 'blue', action: 'Voir mes matières' },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');
  const name = user.user_metadata?.full_name?.split(' ')[0] || 'élève';
  const [{ count: documentCount }, { data: points }] = await Promise.all([
    supabase.from('course_documents').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('points_ledger').select('points').eq('student_id', user.id),
  ]);
  const totalPoints = (points ?? []).reduce((sum, item) => sum + (item.points || 0), 0);

  return <main className="wrap dashboard-page">
    <header className="dashboard-header"><Link className="brand" href="/tableau-de-bord">TITCHA<span>.</span></Link><div className="dashboard-user"><span className="user-avatar">{name.slice(0, 1).toUpperCase()}</span><span>Mon espace</span></div></header>
    <section className="dashboard-welcome">
      <div className="welcome-copy"><span className="welcome-eyebrow">TON ESPACE PERSONNEL</span><h1>Bonjour {name} <span className="wave-hand">👋</span></h1><p>Prêt à faire progresser tes connaissances aujourd’hui ? Choisis une activité et avance à ton rythme.</p>
        <div className="welcome-actions"><Link className="btn dashboard-primary" href="/revisions">Commencer à réviser <span>→</span></Link><Link className="dashboard-secondary" href="/documents">Importer un cours</Link></div>
      </div>
      <div className="welcome-illustration" aria-hidden="true"><div className="welcome-orbit orbit-a" /><div className="welcome-orbit orbit-b" /><div className="welcome-note"><span>✦</span><div><b>Chaque progrès compte</b><small>Un pas après l’autre</small></div></div><div className="welcome-book">📖</div><div className="welcome-spark">✧</div></div>
    </section>
    <section className="dashboard-stats" aria-label="Résumé de ton activité">
      <article className="stat-tile"><span className="stat-icon stat-violet">📄</span><div><strong>{documentCount ?? 0}</strong><span>Cours importés</span></div></article>
      <article className="stat-tile"><span className="stat-icon stat-gold">⭐</span><div><strong>{totalPoints}</strong><span>Points gagnés</span></div></article>
      <article className="stat-tile"><span className="stat-icon stat-mint">🚀</span><div><strong>{(documentCount ?? 0) > 0 ? 'En route' : 'À démarrer'}</strong><span>Ton parcours</span></div></article>
    </section>
    <section className="dashboard-tools-section"><div className="dashboard-section-heading"><div><span className="welcome-eyebrow">TES OUTILS</span><h2>Par quoi veux-tu commencer ?</h2></div><p>Tout est organisé pour t’aider à comprendre et à progresser.</p></div>
      <div className="dashboard-tools-grid">{tools.map(tool => <Link href={tool.href} className="dashboard-tool-card" key={tool.href}><span className={`tool-icon ${tool.tone}`}>{tool.icon}</span><h3>{tool.title}</h3><p>{tool.text}</p><span className="tool-action">{tool.action} <b>↗</b></span></Link>)}</div>
    </section>
    <section className="dashboard-bottom"><div className="dashboard-tip"><span>💡</span><div><b>Un conseil pour mieux apprendre</b><p>Importe d’abord un cours. Le Professeur IA et les quiz pourront ensuite s’appuyer sur son contenu.</p></div></div><Link className="dashboard-method" href="/methodologie">Découvrir la méthodologie <span>→</span></Link></section>
  </main>;
}
