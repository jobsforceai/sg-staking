import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sagenex Staking | SGCOIN Routes",
  description: "Sagenex Staking maps every supported route from Sagenex, offline assistance, or SGChain to the SGCOIN ecosystem.",
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
