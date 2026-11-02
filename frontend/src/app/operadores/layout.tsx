import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal de Operadores RNT & Sostenibilidad | TYRONAWILDS™",
  description:
    "Consola empresarial B2B para Operadores Turísticos Certificados RNT y Autoridades Ambientales del Distrito de Santa Marta: gestión de oferta, control de cupos y monitoreo de capacidad ecológica.",
};

export default function OperadoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
