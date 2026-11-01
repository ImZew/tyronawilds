import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, FileCheck2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad y Habeas Data (Ley 1581 de 2012)",
  description:
    "Política oficial de Tratamiento y Protección de Datos Personales de TYRONAWILDS™ conforme a la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-obsidian text-sand">
      <header className="border-b border-sand/15 bg-obsidian/95">
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-sand/25 px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-sand hover:border-terracotta hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>VOLVER A EXPEDICIONES</span>
          </Link>
          <div className="font-display text-2xl tracking-[0.14em] text-sand">
            TYRONAWILDS<span className="text-terracotta">™</span> // MARCO LEGAL
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-6 py-14">
        <div className="border border-sand/20 bg-jungle/15 p-6 md:p-10">
          <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>CUMPLIMIENTO NORMATIVO COLOMBIANO · LEY 1581 DE 2012</span>
          </div>

          <h1 className="mt-4 font-display text-5xl md:text-6xl uppercase leading-none text-sand">
            POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES
          </h1>
          <p className="mt-3 font-mono text-xs text-sand/70">
            Última actualización: Noviembre de 2026 · Jurisdicción: Distrito
            Turístico, Cultural e Histórico de Santa Marta, Colombia.
          </p>

          <div className="mt-8 space-y-8 border-t border-sand/15 pt-8 text-sm leading-relaxed text-sand/85">
            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                01 // IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO
              </h2>
              <p className="mt-2">
                <strong>TYRONAWILDS™ (PlataformaTurismoSM)</strong>, con
                domicilio principal en la ciudad de Santa Marta D.T.C.H.,
                Magdalena, Colombia, actúa como Responsable del Tratamiento de
                los datos personales recolectados a través de sus canales
                digitales, en estricto cumplimiento de la{" "}
                <strong>Ley Estatutaria 1581 de 2012</strong>, el{" "}
                <strong>Decreto Único Reglamentario 1074 de 2015</strong> y las
                directrices de la Superintendencia de Industria y Comercio (SIC).
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                02 // FINALIDADES DEL TRATAMIENTO DE DATOS
              </h2>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  Tramitar los permisos nominales de ingreso ante{" "}
                  <strong>Parques Nacionales Naturales de Colombia (PNN Tayrona)</strong>{" "}
                  y el <strong>Instituto Colombiano de Antropología e Historia (ICANH — Ciudad Perdida / Teyuna)</strong>.
                </li>
                <li>
                  Emitir las pólizas individuales de asistencia médica y rescate
                  de alta montaña obligatorias para cada expedicionario.
                </li>
                <li>
                  Generar recomendaciones personalizadas y transparentes a
                  través del motor <strong>Baquiano AI</strong>, priorizando la
                  conservación ecológica de los ecosistemas del Magdalena.
                </li>
                <li>
                  Mantener trazabilidad de seguridad y auditoría forense sobre
                  las transacciones financieras y operativas de la plataforma.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                03 // DERECHOS DE LOS TITULARES (HABEAS DATA)
              </h2>
              <p className="mt-2">
                De conformidad con el artículo 8 de la Ley 1581 de 2012, todo
                viajero o prestador turístico titular de datos personales tiene
                derecho a:
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 font-mono text-xs">
                <div className="border border-sand/15 bg-obsidian p-4">
                  <strong className="flex items-center gap-1.5 text-emerald-400">
                    <FileCheck2 className="h-4 w-4" />
                    ACCESO Y RECTIFICACIÓN
                  </strong>
                  <p className="mt-1.5 text-sand/75">
                    Conocer, actualizar y rectificar sus datos personales frente
                    a datos parciales, inexactos o incompletos sin costo alguno.
                  </p>
                </div>
                <div className="border border-sand/15 bg-obsidian p-4">
                  <strong className="flex items-center gap-1.5 text-terracotta">
                    <Lock className="h-4 w-4" />
                    REVOCATORIA Y SUPRESIÓN
                  </strong>
                  <p className="mt-1.5 text-sand/75">
                    Solicitar la supresión de sus datos o revocar la
                    autorización otorgada cuando no exista un deber legal o
                    contractual de permanecer en la base de datos.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                04 // SEGURIDAD TÉCNICA Y CIFRADO
              </h2>
              <p className="mt-2">
                Las credenciales de acceso se almacenan utilizando funciones de
                hash criptográfico unidireccional (<code>BCrypt</code>), las
                sesiones se autentican mediante tokens firmados digitalmente (
                <code>HMAC-SHA256</code>), las tablas transaccionales cuentan
                con políticas de <strong>Row Level Security (RLS)</strong> en
                PostgreSQL y los eventos de acceso son registrados en una
                bitácora inmutable de auditoría.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
