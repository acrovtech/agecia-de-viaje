import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Inca Bound Admin",
  description: "Panel de administración de tours y reservas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full font-sans bg-[#F1F1F1]", inter.variable)} suppressHydrationWarning>
      <body className={`${inter.className} h-full min-h-full font-sans bg-[#F1F1F1] text-slate-900`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
