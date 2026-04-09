import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VPS Ops Dashboard",
  description: "Infrastructure operations dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
