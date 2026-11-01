import Link from "next/link";
import { Compass, ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian text-sand flex flex-col justify-between p-6 md:p-12">
      {/* Top HUD */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-sand/15 pb-4 font-mono text-xs uppercase tracking-[0.2em] text-sand/70">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-terracotta" />
          <span>TYRONAWILDS™ // SISTEMA DE NAVEGACIÓN TOPOGRÁFICA</span>
        </div>
        <span className="text-terracotta font-bold">STATUS: HTTP 404</span>
      </div>

      {/* Central 404 Brutalist Block */}
      <div className="mx-auto my-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 border border-terracotta bg-terracotta/15 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-terracotta">
          <AlertTriangle className="h-4 w-4" />
          <span>ERROR 404 // COORDENADAS FUERA DEL RADAR</span>
        </div>

        <h1 className="mt-6 font-display text-[clamp(4.5rem,12vw,9rem)] uppercase leading-[0.88] text-sand">
          SENDERO NO <span className="text-terracotta">CARTOGRAFIADO</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl font-mono text-xs md:text-sm text-sand/75 leading-relaxed">
          Has cruzado más allá de la cota de los 5.775 msnm. La ruta o
          coordenada que buscas no existe en nuestros mapas de expedición de la
          Sierra Nevada ni del litoral Caribe.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-terracotta px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>REGRESAR AL CAMPAMENTO BASE</span>
          </Link>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-sand/15 pt-4 font-mono text-xs uppercase tracking-[0.18em] text-sand/50">
        <span>11°14&apos;27&quot;N 74°11&apos;56&quot;W // SANTA MARTA, CO</span>
        <span>PIERDE EL MAPA · ENCUENTRA EL ORIGEN</span>
      </div>
    </div>
  );
}
