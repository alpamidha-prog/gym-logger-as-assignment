import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthContextProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNav from "@/components/BottomNav";

export const dynamic = 'force-dynamic';

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Gym Logger AS — Track Workouts & Diet",
  description: "A premium mobile-first gym logging and diet tracking Progressive Web App. Log exercises, track macros, and monitor your fitness journey.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Logger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <AuthContextProvider>
          <ThemeProvider>
            <SettingsProvider>
              <AuthGuard>
                <ErrorBoundary>
                  <main
                    className="mx-auto max-w-lg px-4 pb-24 min-h-screen"
                    style={{
                      paddingTop: "max(1rem, env(safe-area-inset-top))",
                    }}
                  >
                    <Suspense fallback={<div className="animate-pulse h-screen bg-transparent" />}>
                      <div className="animate-fade-in">
                        {children}
                      </div>
                    </Suspense>
                  </main>
                  <Suspense fallback={null}>
                    <BottomNav />
                  </Suspense>
                </ErrorBoundary>
              </AuthGuard>
            </SettingsProvider>
          </ThemeProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
