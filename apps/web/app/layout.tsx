import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WhatsappButton } from '@/components/ui/whatsapp-button';
import { CookieBanner } from '@/components/ui/cookie-banner';
import { ScrollToTopOnNavigation } from '@/components/common/scroll-to-top';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'], 
  variable: '--font-poppins' 
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://incabound.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Inca Bound | Agencia de Viajes y Tours en Perú",
    template: "%s | Inca Bound",
  },
  description: "Descubre la magia de los Andes, Machu Picchu, Laguna Humantay, Vinicunca y traslados privados en Cusco con Inca Bound.",
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: siteUrl,
    siteName: "Inca Bound",
    title: "Inca Bound | Agencia de Viajes y Tours en Perú",
    description: "Experiencias únicas y auténticas en Perú con guías expertos locales y atención 24/7.",
    images: [
      {
        url: "https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/Hero-Home.webp",
        width: 1200,
        height: 630,
        alt: "Inca Bound Tours en Perú",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inca Bound | Tours en Perú",
    description: "Descubre los Andes y Machu Picchu con Inca Bound.",
    images: ["https://pub-f6310552a1b646efb46a653a7f05720c.r2.dev/assets/Hero-Home.webp"],
  },
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
        <CookieBanner />
      </body>
    </html>
  );
}
