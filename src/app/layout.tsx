import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { PinGate } from "@/components/PinGate";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Minimal gym tracker with progressive overload",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="min-h-screen bg-bg text-accent antialiased">
        <PinGate>
          <main className="max-w-lg mx-auto px-4 pt-4 pb-20">{children}</main>
          <Nav />
        </PinGate>
      </body>
    </html>
  );
}
