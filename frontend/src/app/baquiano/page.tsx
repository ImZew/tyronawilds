"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  CloudSun,
  Compass,
  Droplets,
  RefreshCw,
  Sparkles,
  Wind,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  ACTORES_SESION,
  ContextoTerritorial,
  Idioma,
  ItemRecomendadoIa,
  ResultadoRecomendacionIa,
  ejecutarRecomendacionIa,
  obtenerContextoTerritorial,
} from "@/lib/api";
import { registrarEventoAnalitica } from "@/lib/analytics";

type ResistenciaId = "BAJA" | "MEDIA" | "ALTA";

const RESISTENCIAS: {
  id: ResistenciaId;
  tituloEs: string;
  tituloEn: string;
  subEs: string;
  tags: string;
}[] = [
  {
    id: "BAJA",
    tituloEs: "Contemplativa",
    tituloEn: "Relaxed",
    subEs: "Senderos cortos, miradores y ritmo pausado",
    tags: "minca, rio, historia, sostenible, cafe",
  },
  {
    id: "MEDIA",
    tituloEs: "Paso activo",
    tituloEn: "Active pace",
    subEs: "Jornadas completas de 10–15 km en selva y costa",
    tags: "naturaleza, caribe, tayrona, senderismo",
  },
  {
    id: "ALTA",
    tituloEs: "Desafío cumbre",
    tituloEn: "Summit challenge",
    subEs: "Travesías de varios días y fuerte desnivel",
    tags: "trekking, sierra-nevada, arqueologia, selva",
  },
];

const INTERESES: { id: string; es: string; en: string; tags: string }[] = [
  { id: "selva", es: "Selva & montaña", en: "Jungle & mountain", tags: "selva, sierra-nevada, trekking" },
  { id: "playa", es: "Playas del Tayrona", en: "Tayrona beaches", tags: "playa, tayrona, caribe" },
  { id: "arqueologia", es: "Arqueología Tayrona", en: "Tayrona archaeology", tags: "arqueologia, historia, ancestral" },
  { id: "aves", es: "Avistamiento de aves", en: "Birdwatching", tags: "avistamiento-aves, minca, bonda" },
  { id: "buceo", es: "Buceo & arrecifes", en: "Diving & reefs", tags: "buceo, coral, marino, taganga" },
  { id: "cafe", es: "Café de sombra", en: "Shade-grown coffee", tags: "cafe, minca, sostenible" },
  { id: "comunidades", es: "Comunidades Arhuacas & Kogui", en: "Indigenous communities", tags: "arhuaco, comunitario, cultura" },
];

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function BaquianoAiPage() {
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [altoContraste, setAltoContraste] = useState<boolean>(false);

  const [resistencia, setResistencia] = useState<ResistenciaId>("MEDIA");
  const [presupuestoMaxCop, setPresupuestoMaxCop] = useState<number>(450000);
  const [intereses, setIntereses] = useState<string[]>(["selva", "aves"]);
  const [priorizarSostenible, setPriorizarSostenible] = useState<boolean>(true);

  const [contexto, setContexto] = useState<ContextoTerritorial | null>(null);
  const [resultadoIa, setResultadoIa] =
    useState<ResultadoRecomendacionIa | null>(null);
  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [latenciaMs, setLatenciaMs] = useState<number | null>(null);
  const [mostrarTraza, setMostrarTraza] = useState<boolean>(false);

  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [altoContraste]);

  const consultarBaquiano = useCallback(async () => {
    setEjecutando(true);
    const tagsResistencia =
      RESISTENCIAS.find((r) => r.id === resistencia)?.tags || "";
    const tagsIntereses = INTERESES.filter((i) => intereses.includes(i.id))
      .map((i) => i.tags)
      .join(", ");
    const tagsCombinados = [tagsResistencia, tagsIntereses]
      .filter(Boolean)
      .join(", ");

    registrarEventoAnalitica("BAQUIANO_AI_QUERY", {
      estilo: resistencia,
      presupuesto: presupuestoMaxCop,
      ritmo: intereses.join("|"),
    });

    const [resIa, resCtx] = await Promise.all([
      ejecutarRecomendacionIa(
        ACTORES_SESION.TURISTA,
        tagsCombinados,
        priorizarSostenible,
        false,
        "PERSONALIZADO"
      ),
      obtenerContextoTerritorial(),
    ]);
    setResultadoIa(resIa.data);
    setLatenciaMs(resIa.latenciaMs);
    setContexto(resCtx.data);
    setEjecutando(false);
  }, [resistencia, presupuestoMaxCop, intereses, priorizarSostenible]);

  useEffect(() => {
    consultarBaquiano();
    // Consulta inicial única con el perfil por defecto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alternarInteres = (id: string) => {
    setIntereses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const todas: ItemRecomendadoIa[] = resultadoIa?.recomendaciones || [];
  const dentroDePresupuesto = todas.filter(
    (r) => r.precioCop <= presupuestoMaxCop
  );
  const recomendaciones = (
    dentroDePresupuesto.length > 0 ? dentroDePresupuesto : todas
  ).slice(0, 3);
  const fueraDePresupuesto =
    todas.length > 0 && dentroDePresupuesto.length === 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-terracotta selection:text-white transition-colors duration-300">
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14">
        {/* ENCABEZADO EDITORIAL */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-gradient-to-br from-[#F3EFE6] via-[#FAF8F5] to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-10 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-terracotta/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#065F46]/25 dark:border-emerald-400/30 bg-[#065F46]/10 dark:bg-emerald-500/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#065F46] dark:text-emerald-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                <span>Baquiano AI · Concierge inteligente de expediciones</span>
              </div>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase leading-none tracking-tight text-slate-900 dark:text-white">
                {idioma === "es"
                  ? "Tu ruta ideal en Santa Marta"
                  : "Your ideal Santa Marta route"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {idioma === "es"
                  ? "Cuéntale al baquiano tu resistencia física, tu presupuesto y lo que te apasiona. Cruzamos tu perfil con el clima actual de la Sierra Nevada y el aforo real de cada sendero para sugerirte travesías que puedes reservar en un clic."
                  : "Tell our baquiano your fitness level, budget and passions. We match your profile with live Sierra Nevada weather and real trail occupancy to suggest expeditions you can book in one click."}
              </p>
            </div>

            {/* TELEMETRÍA CLIMÁTICA DE ALTO CONTRASTE */}
            <div className="grid grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="rounded-2xl border border-slate-900/15 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
                <CloudSun className="h-4 w-4 text-terracotta" />
                <span className="mt-1.5 block text-xl font-extrabold text-slate-900 dark:text-white">
                  {contexto ? Math.round(contexto.clima.temperaturaCelsius) : 29}°C
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Sierra Nevada
                </span>
              </div>
              <div className="rounded-2xl border border-slate-900/15 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
                <Droplets className="h-4 w-4 text-[#0284C7]" />
                <span className="mt-1.5 block text-xl font-extrabold text-slate-900 dark:text-white">
                  {contexto ? contexto.clima.humedadRelativaPorcentaje : 76}%
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Humedad
                </span>
              </div>
              <div className="rounded-2xl border border-slate-900/15 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
                <Wind className="h-4 w-4 text-[#065F46] dark:text-emerald-400" />
                <span className="mt-1.5 block text-xl font-extrabold text-slate-900 dark:text-white">
                  {contexto ? Math.round(contexto.clima.probabilidadLluviaPorcentaje) : 18}%
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Prob. lluvia
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* CONFIGURADOR DEL PERFIL DEL VIAJERO */}
          <div className="lg:col-span-5 space-y-6 rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                1. Resistencia física
              </span>
              <div className="mt-3 grid grid-cols-1 gap-2.5">
                {RESISTENCIAS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setResistencia(r.id)}
                    className={`rounded-2xl border p-3.5 text-left transition-colors ${
                      resistencia === r.id
                        ? "border-terracotta bg-terracotta/15 text-slate-900 dark:text-white ring-1 ring-terracotta"
                        : "border-slate-900/10 dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 hover:border-slate-900/30 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      {idioma === "es" ? r.tituloEs : r.tituloEn}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {r.subEs}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                  2. Presupuesto por viajero
                </span>
                <span className="rounded-full bg-[#065F46] px-3 py-0.5 font-mono text-xs font-bold text-white">
                  {formatearCop(presupuestoMaxCop)}
                </span>
              </div>
              <input
                type="range"
                min={150000}
                max={2000000}
                step={50000}
                value={presupuestoMaxCop}
                onChange={(e) => setPresupuestoMaxCop(parseInt(e.target.value, 10))}
                className="mt-4 w-full accent-terracotta"
                aria-label="Presupuesto máximo por viajero en COP"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
                <span>$150.000</span>
                <span>$2.000.000 COP</span>
              </div>
            </div>

            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                3. Intereses
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTERESES.map((i) => {
                  const activo = intereses.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => alternarInteres(i.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                        activo
                          ? "border-[#065F46] bg-[#065F46] font-bold text-white shadow-sm"
                          : "border-slate-900/15 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#065F46]"
                      }`}
                    >
                      {idioma === "es" ? i.es : i.en}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={priorizarSostenible}
                onChange={(e) => setPriorizarSostenible(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-terracotta"
              />
              <span>
                Priorizar rutas de bajo impacto y ecosistemas con aforo sereno.
              </span>
            </label>

            <button
              type="button"
              disabled={ejecutando}
              onClick={consultarBaquiano}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#D97706] px-5 py-3.5 text-sm font-bold text-white shadow-md transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${ejecutando ? "animate-spin" : ""}`} />
              <span>
                {ejecutando ? "Consultando al baquiano..." : "Consultar Baquiano AI"}
              </span>
            </button>
          </div>

          {/* RESULTADOS CURADOS */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
              <span>
                {recomendaciones.length} rutas sugeridas ·{" "}
                {resultadoIa?.nivelIaAplicado === "BASICO"
                  ? "Modo reglas"
                  : "Modo personalizado"}
              </span>
              {latenciaMs !== null && <span>{latenciaMs} ms</span>}
            </div>

            {fueraDePresupuesto && (
              <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3 font-mono text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                Ninguna ruta se ajusta a {formatearCop(presupuestoMaxCop)}. Te
                mostramos las más afines a tu perfil.
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
              {recomendaciones.map((rec, idx) => (
                <article
                  key={rec.actividadId}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-terracotta/60 transition-colors"
                >
                  <div className="relative h-40 overflow-hidden bg-[#F3EFE6] dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rec.imagenUrl}
                      alt={rec.nombreEs}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== "/images/destinos/tayrona.jpg") {
                          target.src = "/images/destinos/tayrona.jpg";
                        }
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                      #{idx + 1} · {rec.puntajeAfinidad}% afinidad
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-slate-900 dark:text-white">
                        {idioma === "es" ? rec.nombreEs : rec.nombreEn}
                      </h3>
                      <span className="mt-1 block font-mono text-[11px] font-bold text-terracotta">
                        {rec.ubicacion} · {rec.altitudMsnm} msnm
                      </span>
                      <p className="mt-3 border-l-2 border-[#065F46] dark:border-emerald-400 pl-2.5 text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
                        {idioma === "es" ? rec.explicacionEs : rec.explicacionEn}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-900/10 dark:border-slate-800 pt-3">
                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatearCop(rec.precioCop)}
                      </span>
                      <Link
                        href={`/expediciones?reserva=${encodeURIComponent(rec.actividadId)}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[#EA580C] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#065F46] transition-colors"
                      >
                        Reservar
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!ejecutando && recomendaciones.length === 0 && (
              <div className="mt-4 rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
                <Compass className="mx-auto mb-3 h-6 w-6 text-terracotta" />
                Ajusta tu perfil y consulta al baquiano para recibir rutas.
              </div>
            )}

            {/* TRAZA DEL MOTOR (IA EXPLICABLE) */}
            <div className="mt-6 border-t border-slate-900/10 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setMostrarTraza(!mostrarTraza)}
                className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    mostrarTraza ? "rotate-180" : ""
                  }`}
                />
                <span>Ver razonamiento del motor</span>
              </button>
              {mostrarTraza && resultadoIa && (
                <div className="mt-3 rounded-2xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex flex-wrap justify-between gap-2 border-b border-slate-900/10 dark:border-slate-800 pb-2">
                    <span>Correlación: {resultadoIa.correlacionId}</span>
                    <span className="font-bold text-[#065F46] dark:text-emerald-400">
                      {resultadoIa.contextoDegradado
                        ? "Contexto degradado (caché)"
                        : "Contexto en vivo"}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {resultadoIa.trazaEstados.map((estado, i) => (
                      <React.Fragment key={`${estado}-${i}`}>
                        <span className="rounded-full border border-slate-900/15 dark:border-slate-700 bg-[#F3EFE6] dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-900 dark:text-slate-100">
                          {estado}
                        </span>
                        {i < resultadoIa.trazaEstados.length - 1 && (
                          <span className="text-terracotta">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] border-t border-slate-900/10 dark:border-slate-800 px-4 py-8 sm:px-6 font-mono text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>TYRONAWILDS™ // BAQUIANO AI · SANTA MARTA, CO</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/expediciones" className="hover:text-terracotta">Expediciones</Link>
            <Link href="/pulso" className="hover:text-terracotta">Pulso del Territorio</Link>
            <Link href="/privacidad" className="hover:text-terracotta">Privacidad (Ley 1581)</Link>
            <Link href="/terminos" className="hover:text-terracotta">Términos RNT</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
