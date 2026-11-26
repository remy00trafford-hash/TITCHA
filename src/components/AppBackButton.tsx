'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AppBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/' || pathname === '/connexion' || pathname === '/inscription') return null;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/tableau-de-bord');
  }

  return <button type="button" className="app-back-button" onClick={goBack} aria-label="Revenir à la page précédente" title="Retour"><ArrowLeft size={19} strokeWidth={2.2} /><span>Retour</span></button>;
}
