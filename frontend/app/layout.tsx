import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Inter_Tight } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Faraday — AI Co-Scientist",
  description: "The AI co-scientist, grounded in real research.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${interTight.variable}`}
    >
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
