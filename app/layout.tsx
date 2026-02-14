import ThemeProviderClient from "./components/ThemeProviderClient";
import LocaleProvider from "./i18n/LocaleProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning is required for next-themes to work correctly without mismatch warnings */}
      <body
        className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProviderClient>
          <LocaleProvider>
            <Header />
            <main className="flex-1 pt-[var(--header-height)]">
              {children}
            </main>
            <Footer />
          </LocaleProvider>
        </ThemeProviderClient>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
