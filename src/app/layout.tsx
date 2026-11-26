import './globals.css';
import AppBackButton from '@/components/AppBackButton';

export const metadata = {
  title: 'TITCHA — Apprendre avec confiance',
  description: 'Ton espace de cours, de compréhension et de révision.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body><AppBackButton />{children}</body></html>;
}
