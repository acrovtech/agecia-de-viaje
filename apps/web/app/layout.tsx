import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WhatsappButton } from '@/components/ui/whatsapp-button';
import { ScrollToTopOnNavigation } from '@/components/common/scroll-to-top';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'], 
  variable: '--font-poppins' 
});

export const metadata: Metadata = {
  title: "Incabound - Descubre la Magia de los Andes",
  description: "Tu agencia de viajes de confianza en Perú.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(inter.variable, poppins.variable)} suppressHydrationWarning>
      <head>
        {/* Resource Hints: Preconnect to critical CDNs to reduce critical request chain latency */}
        <link rel="preconnect" href="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://player.vimeo.com" />
        <link rel="preconnect" href="https://f.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://f.vimeocdn.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ScrollToTopOnNavigation />
        {children}
        <WhatsappButton />
      </body>
    </html>
  );
}
