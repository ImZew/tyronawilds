import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control de Acceso & Identidad RNT | TYRONAWILDS™",
  description:
    "Autenticación corporativa JWT, validación de Registro Nacional de Turismo (RNT) y acceso a la consola de operadores y gobernanza ambiental de Santa Marta.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
