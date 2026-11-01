import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "TYRONAWILDS™ | Pierde el Mapa — Sierra Nevada, Tayrona & Caribe",
  description:
    "Plataforma Digital para la Gestión Integrada y Sostenible del Turismo en Santa Marta (PlataformaTurismoSM - Universidad del Magdalena).",
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
      <body className="bg-obsidian text-sand font-sans antialiased selection:bg-terracotta selection:text-sand">
        {children}
      </body>
    </html>
  );
}
