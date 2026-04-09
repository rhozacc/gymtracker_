import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { PinGate } from "@/components/PinGate";
import { SetupGuide } from "@/components/SetupGuide";
import { Nav } from "@/components/Nav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NavVisibilityProvider } from "@/lib/useNavVisibility";

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

// Inline script to set theme before first paint (prevents flash)
const themeScript = `(function(){var t=localStorage.getItem('gym-theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})()`;

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
        {hasDb ? (
          <NavVisibilityProvider>
            <PinGate>
              <InstallPrompt />
              <main className="max-w-lg mx-auto px-4 pt-4 pb-20">{children}</main>
              <Nav />
            </PinGate>
          </NavVisibilityProvider>
        ) : (
          <SetupGuide />
        )}
      </body>
    </html>
  );
}
