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
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-5xl rounded-2xl border border-[#0F172A]/12 bg-white/95 p-5 text-[#0F172A] backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#065F46]">
            <Cookie className="h-4 w-4" />
            <span>Privacidad y Protección de Datos (Ley 1581)</span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#0F172A]/80 leading-relaxed">
            Usamos cookies esenciales para gestionar tus reservas y cuidar el
            aforo natural de cada sendero. Puedes consultar nuestra{" "}
            <Link
              href="/privacidad"
              className="font-semibold text-[#065F46] underline hover:text-[#EA580C]"
            >
              Política de Privacidad
            </Link>{" "}
            y{" "}
            <Link
              href="/terminos"
              className="font-semibold text-[#065F46] underline hover:text-[#EA580C]"
            >
              Términos de Reserva
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={manejarSoloEsenciales}
            className="rounded-full border border-[#0F172A]/15 bg-[#F3EFE6] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#E5DEC9] transition-colors"
          >
            Solo esenciales
          </button>
          <button
            type="button"
            onClick={manejarAceptarTodas}
            className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] px-5 py-2 text-xs font-bold text-white hover:bg-[#D97706] transition-colors shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-white" />
            <span>Aceptar y continuar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
