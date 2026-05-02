import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'BoxIA — caixinhas no seu tom',
  description: 'PWA para ler caixinhas do Instagram com IA personalizada (BoxIA + RAG histórico).',
  manifest: '/manifest.webmanifest',
  applicationName: 'BoxIA',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'BoxIA' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: '/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="notranslate" translate="no" suppressHydrationWarning>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                  // Em dev: desregistra qualquer SW antigo e limpa caches pra evitar conteúdo velho.
                  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
                  if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
                } else {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
