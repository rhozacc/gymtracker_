import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthGuard } from "@/components/AuthGuard";
import { SetupGuide } from "@/components/SetupGuide";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { OrientationLockInit } from "@/components/OrientationLockInit";
import { UpdateSplash } from "@/components/UpdateSplash";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "gymtracker_",
  description: "Minimal gym tracker with progressive overload",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "gymtracker_",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Inline script to set theme + accent before first paint (prevents flash)
// Defaults to dark when nothing stored. Handles "system" by reading OS preference.
const themeScript = `(function(){var p=localStorage.getItem('gym-theme');var t;if(p==='dark'||p==='light'){t=p}else if(p==='system'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}else{t='dark'}document.documentElement.setAttribute('data-theme',t);var ak=t==='dark'?'gym-accent-dark':'gym-accent-light';var ac=localStorage.getItem(ak);if(ac){var r=document.documentElement.style;r.setProperty('--color-accent',ac);r.setProperty('--color-chart-bar-1',ac);r.setProperty('--color-chart-line',ac)}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasDb = !!process.env.POSTGRES_URL;

  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <ServiceWorkerRegistrar />
        <OrientationLockInit />
        {hasDb ? (
          <AuthGuard>
            <UpdateSplash />
            <main className="max-w-lg mx-auto px-4 pt-4 pb-8">{children}</main>
          </AuthGuard>
        ) : (
          <SetupGuide />
        )}
        <Analytics />
      </body>
    </html>
  );
}
