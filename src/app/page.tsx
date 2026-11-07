import Image from 'next/image';
import Link from 'next/link';

const features = [
  { number: '01', icon: '📚', title: 'Tes cours, au même endroit', text: 'Retrouve tes documents et supports de cours dans un espace simple à organiser.' },
  { number: '02', icon: '🧠', title: 'Un professeur IA à portée de main', text: 'Pose tes questions, demande une explication et avance à ton rythme.' },
  { number: '03', icon: '✍️', title: 'Des révisions qui te font progresser', text: 'Entraîne-toi avec des exercices, vérifie tes réponses et comprends tes erreurs.' },
];

export default function Home() {
  return <main className="landing">
    <header className="site-header">
      <Link href="/" className="logo-link" aria-label="TITCHA, accueil"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={186} height={45} priority /></Link>
      <nav className="site-nav" aria-label="Navigation principale">
        <a href="#fonctionnalites">Fonctionnalités</a><a href="#methode">Notre approche</a><a href="#faq">FAQ</a>
      </nav>
      <div className="header-actions"><Link href="/connexion" className="login-link">Connexion</Link><Link href="/inscription" className="nav-cta">Créer un compte <span>↗</span></Link></div>
    </header>

    <section className="hero-section">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> L'APPRENTISSAGE PREND UNE NOUVELLE DIMENSION</div>
        <h1>Comprends tes cours.<br/><span>Réussis avec confiance.</span></h1>
        <p className="hero-lead">TITCHA réunit tes cours, un professeur IA et tes outils de révision dans un seul espace conçu pour t'aider à progresser.</p>
        <div className="hero-actions"><Link href="/inscription" className="primary-cta">Commencer gratuitement <span>→</span></Link><a href="#fonctionnalites" className="text-cta">Découvrir TITCHA <span>↓</span></a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>É</span><span>✦</span><span>+</span></div><p><strong>Apprends à ton rythme.</strong><br/>Une méthode plus claire, une étape à la fois.</p></div>
      </div>
      <div className="hero-art" aria-label="Illustration des outils d’apprentissage TITCHA">
        <div className="art-glow" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="floating-note note-top"><span className="note-icon">✦</span><div><b>Bien joué !</b><small>Tu progresses chaque jour</small></div></div>
        <div className="study-board">
          <div className="board-top"><span className="board-pill">TON ESPACE</span><span className="board-dots">•••</span></div>
          <div className="board-title">Prêt à apprendre ?</div><p className="board-sub">Tout ce qu'il te faut pour avancer.</p>
          <div className="board-course"><div className="course-symbol purple">⌘</div><div><b>Mes cours</b><small>Documents & leçons</small></div><span>↗</span></div>
          <div className="board-course"><div className="course-symbol orange">✦</div><div><b>Prof IA</b><small>Comprendre autrement</small></div><span>↗</span></div>
          <div className="board-course"><div className="course-symbol mint">✓</div><div><b>Mes révisions</b><small>Exercices & progrès</small></div><span>↗</span></div>
          <div className="board-progress"><div><b>Ton prochain objectif</b><small>Une notion après l'autre</small></div><div className="progress-ring">◎</div></div>
        </div>
        <div className="floating-note note-bottom"><span className="sparkle">✧</span><div><b>À ton rythme</b><small>Ta progression, tes objectifs</small></div></div>
      </div>
      <div className="hero-decoration">T.</div>
    </section>

    <section className="trust-strip"><span>UN ESPACE POUR APPRENDRE</span><i /> <b>Documents</b><i /> <b>Intelligence artificielle</b><i /> <b>Révisions</b><i /> <b>Progression</b></section>

    <section className="intro-section" id="methode">
      <div className="section-kicker">POURQUOI TITCHA ?</div>
      <div className="intro-grid"><h2>Moins de dispersion.<br/><span>Plus de compréhension.</span></h2><p>Réviser ne devrait pas être une lutte pour retrouver ses documents ou comprendre une notion difficile. TITCHA rassemble l'essentiel pour t'aider à apprendre avec méthode et autonomie.</p></div>
    </section>

    <section className="features-section" id="fonctionnalites">
      <div className="section-heading"><div><div className="section-kicker">TON KIT POUR PROGRESSER</div><h2>Tout commence ici.</h2></div><p>Trois outils complémentaires.<br/>Un seul objectif : te faire avancer.</p></div>
      <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><div className="feature-top"><span>{feature.number}</span><span className="feature-icon">{feature.icon}</span></div><h3>{feature.title}</h3><p>{feature.text}</p><a href="/inscription">Découvrir <span>↗</span></a></article>)}</div>
    </section>

    <section className="quote-section"><div className="quote-mark">“</div><div><div className="section-kicker">NOTRE CONVICTION</div><h2>Tu n'as pas besoin d'aller plus vite. Tu as besoin de <span>mieux comprendre.</span></h2><p>TITCHA t'accompagne dans ton parcours, sans remplacer tes efforts : il t'aide à les rendre plus efficaces.</p></div><div className="quote-stamp">APPRENDRE<br/>✳ AUTREMENT</div></section>

    <section className="steps-section"><div className="section-kicker">SIMPLE DÈS LE PREMIER JOUR</div><h2>Tu peux commencer en trois étapes.</h2><div className="steps-grid"><div><span>1</span><h3>Crée ton espace</h3><p>Inscris-toi en quelques instants pour accéder à ton environnement personnel.</p></div><div><span>2</span><h3>Retrouve tes cours</h3><p>Ajoute tes supports et explore les outils disponibles pour apprendre.</p></div><div><span>3</span><h3>Passe à l'action</h3><p>Pose tes questions, révise et avance progressivement vers tes objectifs.</p></div></div></section>

    <section className="faq-section" id="faq"><div><div className="section-kicker">QUESTIONS FRÉQUENTES</div><h2>Tu veux en savoir plus ?</h2><p>Voici l'essentiel pour te lancer sereinement.</p></div><div className="faq-list"><details><summary>À qui s'adresse TITCHA ?</summary><p>TITCHA est conçu pour les élèves qui souhaitent mieux organiser leurs apprentissages, comprendre leurs cours et réviser plus efficacement.</p></details><details><summary>Est-ce que TITCHA remplace un professeur ?</summary><p>Non. TITCHA est un outil d'accompagnement. Il complète le travail en classe et tes efforts personnels.</p></details><details><summary>Comment créer mon compte ?</summary><p>Clique sur « Créer un compte », renseigne ton prénom, ton adresse e-mail et un mot de passe valide. Tu recevras les instructions de confirmation par e-mail.</p></details></div></section>

    <section className="final-cta"><div className="cta-orb">✳</div><div className="section-kicker">TON PROCHAIN CHAPITRE COMMENCE ICI</div><h2>Prêt à apprendre<br/>avec plus de clarté ?</h2><p>Crée ton espace TITCHA et donne une nouvelle dynamique à tes révisions.</p><Link href="/inscription" className="primary-cta light-cta">Créer mon compte <span>→</span></Link></section>

    <footer className="site-footer"><Link href="/" className="footer-logo"><Image src="/brand/titcha-logo.svg" alt="TITCHA" width={150} height={37}/></Link><p>Apprendre avec confiance, un pas après l'autre.</p><div><Link href="/connexion">Connexion</Link><Link href="/inscription">Inscription</Link></div><small>© {new Date().getFullYear()} TITCHA. Tous droits réservés.</small></footer>
  </main>;
}