import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Panel de Administración | Agencia de Viajes",
  description: "Panel de administración de tours y reservas",
};

import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans bg-[#F1F1F1]", inter.variable)} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen font-sans bg-[#F1F1F1] text-slate-900`} suppressHydrationWarning>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
