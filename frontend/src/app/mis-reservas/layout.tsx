import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billetera de Expediciones & Pasaportes QR | TYRONAWILDS™",
  description:
    "Consulta tus pasaportes oficiales de expedición (TW-2026-XXXX), códigos QR de ingreso a Parques Nacionales y comprobantes de pago Wompi Sandbox en Santa Marta.",
};

export default function MisReservasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
