import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthTabSync from "./auth-tab-sync";
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
  title: "Zetheta | Financial Research Intelligence",
  description:
    "Autonomous financial research, investment analysis and evidence-backed reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthTabSync />
        {children}
      </body>
    </html>
  );
}
