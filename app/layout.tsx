import type { Metadata } from "next";
import "./globals.css";
import { LanguageManager } from "./LanguageManager";

export const metadata: Metadata = {
  title: "Sagenex Staking | SGCOIN Member Portal",
  description: "Activate SGCOIN stakes, submit crypto deposits, track interest, and request eligible withdrawals from your Sagenex Staking dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar-AE" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}<LanguageManager /></body>
    </html>
  );
}
