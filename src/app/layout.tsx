import type { Metadata } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

/* Command Centre's typefaces (spec 09 §4), self-hosted at build time: no requests to Google at runtime. */
const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--cc-face-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--cc-face-body", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--cc-face-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Command Centre",
  description: "AI-powered business growth and marketing operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
