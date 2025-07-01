import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lex - AI Contract Reviewer",
  description: "AI-powered contract analysis that identifies risks and provides actionable insights. Analyze contracts in seconds, not hours.",
  keywords: "contract review, legal AI, contract analysis, risk assessment, document review",
  authors: [{ name: "Lex AI" }],
  openGraph: {
    title: "Lex - AI Contract Reviewer",
    description: "AI-powered contract analysis that identifies risks and provides actionable insights",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gray-50`}
      >
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
