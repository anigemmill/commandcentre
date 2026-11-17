import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Centre",
  description: "AI-powered business growth and marketing operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
