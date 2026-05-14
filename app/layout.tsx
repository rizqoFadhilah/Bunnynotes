import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  title: 'Bunnynotes',
  description: 'Organize your home, money, and daily life with joy',
  manifest: '/manifest.json',
  themeColor: '#81515b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bunnynotes',
  },
};

import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={quicksand.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }, function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
                try {
                  const originalFetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    configurable: true,
                    enumerable: true,
                    get: () => originalFetch,
                    set: (val) => {
                      Object.defineProperty(window, 'fetch', {
                        value: val,
                        writable: true,
                        configurable: true,
                        enumerable: true
                      });
                    }
                  });
                } catch (e) {
                  console.error(e);
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-on-background min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
