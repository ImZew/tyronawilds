import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, Award, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Expedición (RNT & Parques Nacionales)",
  description:
    "Términos y condiciones de reserva, operación turística certificada RNT, políticas de cancelación y código de conducta ambiental en la Sierra Nevada y Parque Tayrona.",
};

export default function TerminosPage() {
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
            TYRONAWILDS<span className="text-terracotta">™</span> // TÉRMINOS RNT
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-6 py-14">
        <div className="border border-sand/20 bg-jungle/15 p-6 md:p-10">
          <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand">
            <Award className="h-3.5 w-3.5" />
            <span>REGISTRO NACIONAL DE TURISMO (RNT) &amp; NORMATIVA AMBIENTAL</span>
          </div>

          <h1 className="mt-4 font-display text-5xl md:text-6xl uppercase leading-none text-sand">
            TÉRMINOS Y CONDICIONES DE EXPEDICIÓN
          </h1>
          <p className="mt-3 font-mono text-xs text-sand/70">
            Aplicables a todas las reservas emitidas bajo código{" "}
            <code>TW-2026-XXXX</code> en Santa Marta, Sierra Nevada y Parque
            Nacional Natural Tayrona.
          </p>

          <div className="mt-8 space-y-8 border-t border-sand/15 pt-8 text-sm leading-relaxed text-sand/85">
            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                01 // OPERADORES LOCALES CERTIFICADOS Y RNT
              </h2>
              <p className="mt-2">
                Todas las travesías publicadas en{" "}
                <strong>TYRONAWILDS™</strong> son ejecutadas exclusivamente por
                operadores turísticos con{" "}
                <strong>Registro Nacional de Turismo (RNT)</strong> vigente ante
                el Ministerio de Comercio, Industria y Turismo de Colombia, y
                cuentan con aval de las autoridades indígenas{" "}
                <strong>Kogui, Wiwa y Arhuaca</strong> en los corredores de la
                Sierra Nevada.
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                02 // CONTROL DE CAPACIDAD DE CARGA Y RESERVAS SIN SOBREVENTA
              </h2>
              <p className="mt-2">
                Los ecosistemas del Parque Tayrona y Teyuna (Ciudad Perdida)
                tienen un límite diario estricto de visitantes. Nuestro sistema
                transaccional bloquea en tiempo real los cupos disponibles al
                momento de emitir el pasaporte <code>TW-2026-XXXX</code>. En
                caso de que un horario alcance el 100% de su capacidad, el
                sistema sugerirá automáticamente la siguiente fecha u horario
                con disponibilidad garantizada.
              </p>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                03 // PROTOCOLO DE PRESERVACIÓN ECOLÓGICA Y CULTURAL
              </h2>
              <div className="mt-3 border border-terracotta/40 bg-terracotta/10 p-4 font-mono text-xs">
                <div className="flex items-center gap-2 font-bold text-terracotta">
                  <AlertTriangle className="h-4 w-4" />
                  <span>REGLAS INQUEBRANTABLES EN EL SENDERO</span>
                </div>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sand/85">
                  <li>
                    Prohibido el ingreso de plásticos de un solo uso, aerosoles
                    contaminantes o drones sin permiso especial de PNN/ICANH.
                  </li>
                  <li>
                    Respeto absoluto por los sitios de pagamento sagrado y las
                    comunidades indígenas; las fotografías a miembros de las
                    comunidades requieren su consentimiento expreso.
                  </li>
                  <li>
                    En prevención contra la explotación sexual comercial de
                    niños, niñas y adolescentes (ESCNNA), TYRONAWILDS™ acata
                    estrictamente la <strong>Ley 679 de 2001</strong> y la{" "}
                    <strong>Ley 1336 de 2009</strong>.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-terracotta">
                04 // POLÍTICAS DE REPROGRAMACIÓN Y CLIMA EXTREMO
              </h2>
              <p className="mt-2">
                Las cancelaciones o reprogramaciones solicitadas con más de 48
                horas de anticipación a la hora de zarpe o ascenso no generan
                penalidad. Si las autoridades marítimas (DIMAR) o Parques
                Nacionales decretan cierre preventivo de senderos o playas por
                condiciones meteorológicas, el viajero podrá reprogramar sin
                costo o cambiar su expedición hacia nuestras rutas bioclimáticas
                alternas en Minca y Bonda.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
