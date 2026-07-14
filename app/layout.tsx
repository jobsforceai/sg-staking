import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
