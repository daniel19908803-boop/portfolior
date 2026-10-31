import './globals.css';
export const metadata = {
  title: 'My Portfolio — Gabriel Fonseca',
  description: 'Engenheiro de software sênior no Brasil. Inteligência artificial, automação e experiências web e mobile, da ideia à produção.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
