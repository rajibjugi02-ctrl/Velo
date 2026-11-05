import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { VeloProvider } from '@/context/VeloContext';
import { GoogleAuthProvider } from '@/components/auth/GoogleAuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Velo — Minimal Spatial Social',
  description: 'Pure noir glassmorphism social platform with integrated real-time audio, stories, and chat.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Blocking Theme Initializer: executes synchronously before render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var saved = localStorage.getItem('velo_theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300 ease-in-out selection:bg-zinc-800 selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <VeloProvider>
              <GoogleAuthProvider>
                <AppShell>{children}</AppShell>
              </GoogleAuthProvider>
            </VeloProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
