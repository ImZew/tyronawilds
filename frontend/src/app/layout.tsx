import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tyronawilds.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "TYRONAWILDS™ | Experiencias & Naturaleza Viva — Santa Marta, Tayrona & Sierra Nevada",
    template: "%s | TYRONAWILDS™ — Santa Marta & Caribe",
  },
  description:
    "Explora el Parque Tayrona, Ciudad Perdida (Teyuna), Minca y la Sierra Nevada de Santa Marta con anfitriones locales certificados, cupos garantizados y asistencia inteligente.",
  keywords: [
    "Santa Marta",
    "Ciudad Perdida",
    "Teyuna",
    "Parque Tayrona",
    "Cabo San Juan",
    "Minca",
    "Sierra Nevada de Santa Marta",
    "Turismo Sostenible Colombia",
    "TyronaWilds",
  ],
  authors: [{ name: "TYRONAWILDS™ Collection" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "TYRONAWILDS™",
    title:
      "TYRONAWILDS™ — Experiencias Auténticas en Santa Marta, Tayrona & Sierra Nevada",
    description:
      "Desde Cabo San Juan en el Parque Tayrona hasta las terrazas ancestrales de Ciudad Perdida. Reserva tu experiencia en minutos con cupo garantizado.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TYRONAWILDS™ — Santa Marta, Parque Tayrona & Sierra Nevada",
    description:
      "Experiencias curadas en el Caribe colombiano y la Sierra Nevada de Santa Marta.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={jakartaSans.variable}>
      <body className="overflow-x-hidden bg-[#26211D] text-white font-sans antialiased selection:bg-[#C89D66] selection:text-[#1C1917]">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
