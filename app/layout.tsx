import { Montserrat } from 'next/font/google';
import './globals.css';
import ThemeProviderClient from './components/ThemeProviderClient';
import NextAuthProvider from './components/NextAuthProvider';
import { auth } from '../auth';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NextAuthProvider session={session}>
          <ThemeProviderClient>{children}</ThemeProviderClient>
        </NextAuthProvider>
        <SpeedInsights />
        <Analytics />
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
