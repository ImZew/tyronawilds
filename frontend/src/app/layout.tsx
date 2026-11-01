import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tyronawilds.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "TYRONAWILDS™ | Pierde el Mapa — Expediciones Santa Marta, Sierra Nevada & Tayrona",
    template: "%s | TYRONAWILDS™ — Expediciones Santa Marta",
  },
  description:
    "Expediciones certificadas de alta montaña y conservación en Santa Marta, Ciudad Perdida (Teyuna), Parque Nacional Natural Tayrona y Minca. Curaduría Baquiano AI y cupo garantizado en tiempo real.",
  keywords: [
    "Santa Marta",
    "Ciudad Perdida",
    "Teyuna",
    "Parque Tayrona",
    "Minca",
    "Sierra Nevada de Santa Marta",
    "Turismo Sostenible Colombia",
    "TyronaWilds",
  ],
  authors: [{ name: "TYRONAWILDS™ Expedition Team" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "TYRONAWILDS™",
    title:
      "TYRONAWILDS™ // PIERDE EL MAPA — Sierra Nevada, Parque Tayrona & Caribe",
    description:
      "Desde los arrecifes coralinos del Tayrona hasta las terrazas sagradas de Teyuna a 1.200 msnm. Reserva tu cupo garantizado junto a operadores locales certificados.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TYRONAWILDS™ // PIERDE EL MAPA — Expediciones Santa Marta",
    description:
      "Travesías curadas en la Sierra Nevada de Santa Marta, Parque Tayrona y Minca con control de aforo ecológico en tiempo real.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${jakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="overflow-x-hidden bg-obsidian text-sand font-sans antialiased selection:bg-terracotta selection:text-sand">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
