"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie } from "lucide-react";
import {
  guardarConsentimientoCookies,
  obtenerConsentimientoCookies,
  registrarEventoAnalitica,
} from "@/lib/analytics";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const actual = obtenerConsentimientoCookies();
    if (!actual) {
      setVisible(true);
    }
  }, []);

  const manejarAceptarTodas = () => {
    guardarConsentimientoCookies("ALL");
    registrarEventoAnalitica("PAGE_VIEW", { consent: "ALL" });
    setVisible(false);
  };

  const manejarSoloEsenciales = () => {
    guardarConsentimientoCookies("ESSENTIAL_ONLY");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Aviso de Privacidad y Cookies (Ley 1581 de 2012)"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sand/25 bg-obsidian/95 p-4 md:px-8 md:py-5 backdrop-blur-md shadow-2xl"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
            <Cookie className="h-4 w-4" />
            <span>
              CONSENTIMIENTO DE COOKIES &amp; HABEAS DATA (LEY 1581 DE 2012)
            </span>
          </div>
          <p className="mt-1.5 font-mono text-xs text-sand/80 leading-relaxed">
            Utilizamos cookies técnicas esenciales para garantizar la reserva
            segura de cupos y analíticas anónimas para optimizar el aforo
            ecológico en los senderos de Santa Marta. Consulta nuestra{" "}
            <Link
              href="/privacidad"
              className="text-terracotta underline hover:text-sand"
            >
              Política de Tratamiento de Datos Personales
            </Link>{" "}
            y los{" "}
            <Link
              href="/terminos"
              className="text-terracotta underline hover:text-sand"
            >
              Términos y Condiciones RNT
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={manejarSoloEsenciales}
            className="border border-sand/30 bg-obsidian px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-sand/80 hover:border-sand transition-colors"
          >
            SOLO ESENCIALES
          </button>
          <button
            type="button"
            onClick={manejarAceptarTodas}
            className="inline-flex items-center gap-2 bg-terracotta px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>ACEPTAR Y CONTINUAR</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
