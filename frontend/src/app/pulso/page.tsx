"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CloudSun,
  Droplets,
  Leaf,
  RefreshCw,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  ContextoTerritorial,
  Idioma,
  IndicadorCapacidadDestino,
  obtenerContextoTerritorial,
  obtenerIndicadoresCapacidad,
} from "@/lib/api";

const IMAGEN_POR_ZONA: Record<string, string> = {
  "Parque Nacional Natural Tayrona": "/images/destinos/tayrona.jpg",
  "Sierra Nevada de Santa Marta": "/images/destinos/teyuna.jpg",
  "Minca / Corregimiento de Bonda": "/images/destinos/minca.jpg",
  "Taganga / Bahía de Granate": "/images/destinos/taganga.jpg",
};

const IMAGEN_POR_DEFECTO = "/images/destinos/dondiego.jpg";

function etiquetaFlujo(estado: IndicadorCapacidadDestino["estadoAlerta"]) {
  if (estado === "CRITICA") {
    return { texto: "Alto flujo", clase: "bg-terracotta text-white", barra: "bg-terracotta" };
  }
  if (estado === "MODERADA") {
    return { texto: "Flujo medio", clase: "bg-amber-400 text-black", barra: "bg-amber-400" };
  }
  return { texto: "Flujo sereno", clase: "bg-emerald-400 text-black", barra: "bg-emerald-400" };
}

export default function PulsoTerritorioPage() {
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [altoContraste, setAltoContraste] = useState<boolean>(false);
  const [indicadores, setIndicadores] = useState<IndicadorCapacidadDestino[]>([]);
  const [contexto, setContexto] = useState<ContextoTerritorial | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ultimaLectura, setUltimaLectura] = useState<string>("");
  const [modoConexion, setModoConexion] = useState<string>("FALLBACK_RESILIENTE");

  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [altoContraste]);

  const cargarPulso = useCallback(async () => {
    setCargando(true);
    const [resInd, resCtx] = await Promise.all([
      obtenerIndicadoresCapacidad(),
      obtenerContextoTerritorial(),
    ]);
    setIndicadores(resInd.data);
    setContexto(resCtx.data);
    setModoConexion(resInd.modoConexion);
    setUltimaLectura(
      new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarPulso();
    const intervalo = window.setInterval(cargarPulso, 60000);
    return () => window.clearInterval(intervalo);
  }, [cargarPulso]);

  const ocupacionPromedio =
    indicadores.length > 0
      ? Math.round(
          indicadores.reduce((acc, i) => acc + i.porcentajeOcupacion, 0) /
            indicadores.length
        )
      : 0;
  const criticos = indicadores.filter((i) => i.estadoAlerta === "CRITICA");
  const temperatura = contexto ? contexto.clima.temperaturaCelsius.toFixed(1) : "29.4";
  const humedad = contexto ? contexto.clima.humedadRelativaPorcentaje : 76;
  const lluvia = contexto ? Math.round(contexto.clima.probabilidadLluviaPorcentaje) : 18;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-terracotta selection:text-white transition-colors duration-300">
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14">
        {/* ENCABEZADO */}
        <section className="flex flex-col justify-between gap-6 border-b border-slate-900/10 dark:border-slate-800 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#065F46]/25 dark:border-emerald-400/30 bg-[#065F46]/10 dark:bg-emerald-500/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#065F46] dark:text-emerald-300 backdrop-blur-md">
              <Activity className="h-3.5 w-3.5 text-[#065F46] dark:text-emerald-400" />
              <span>Pulso del Territorio · Sostenibilidad ambiental</span>
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold uppercase leading-none tracking-tight text-slate-900 dark:text-white">
              {idioma === "es"
                ? "Así respiran hoy los ecosistemas"
                : "How the ecosystems breathe today"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Aforo en tiempo real del Parque Tayrona, Ciudad Perdida, Minca/Bonda
              e Isla Aguja, clima de la Sierra Nevada y rutas de desconcentración
              ecológica para viajar sin saturar el territorio.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] uppercase">
            <span className="flex items-center gap-2 rounded-full border border-slate-900/15 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              Lectura {ultimaLectura || "--:--"}
            </span>
            <button
              type="button"
              onClick={cargarPulso}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#065F46] hover:bg-[#0D9488] px-4 py-1.5 font-bold normal-case text-white shadow-sm transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </section>

        {/* RESUMEN TERRITORIAL (4 KPIs GRANDES CON CONTRASTE NÍTIDO) */}
        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <Leaf className="h-5 w-5 text-[#065F46] dark:text-emerald-400" />
            <span className="mt-3 block font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {ocupacionPromedio}%
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
              Aforo promedio del territorio
            </span>
          </div>
          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-terracotta" />
            <span className="mt-3 block font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {criticos.length}
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
              Ecosistemas en alto flujo
            </span>
          </div>
          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <Thermometer className="h-5 w-5 text-terracotta" />
            <span className="mt-3 block font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {temperatura}°
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
              Temperatura Sierra Nevada
            </span>
          </div>
          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <Droplets className="h-5 w-5 text-[#0284C7] dark:text-sky-400" />
            <span className="mt-3 block font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              {humedad}%
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
              Humedad relativa
            </span>
          </div>
        </section>

        {/* ECOSISTEMAS EN TIEMPO REAL */}
        <section className="mt-10">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-slate-900 dark:text-white">
            Estado de los ecosistemas
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {indicadores.map((ind) => {
              const flujo = etiquetaFlujo(ind.estadoAlerta);
              return (
                <article
                  key={ind.id}
                  className="flex flex-col overflow-hidden rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <div className="relative h-44 overflow-hidden bg-[#F3EFE6] dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={IMAGEN_POR_ZONA[ind.zona] || IMAGEN_POR_DEFECTO}
                      alt={ind.nombreDestino}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== IMAGEN_POR_DEFECTO) {
                          target.src = IMAGEN_POR_DEFECTO;
                        }
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase shadow ${flujo.clase}`}
                    >
                      {flujo.texto}
                    </span>
                    <span className="absolute bottom-3 left-4 font-mono text-[11px] font-bold text-white drop-shadow">
                      {ind.zona}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-display text-xl font-extrabold uppercase leading-tight text-slate-900 dark:text-white">
                        {ind.nombreDestino}
                      </h3>
                      <div className="mt-4 flex justify-between font-mono text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {ind.ocupacionActual} / {ind.capacidadMaxima} visitantes
                        </span>
                        <strong className="font-extrabold text-slate-900 dark:text-white">
                          {ind.porcentajeOcupacion}%
                        </strong>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${flujo.barra}`}
                          style={{ width: `${Math.min(100, ind.porcentajeOcupacion)}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 border-t border-slate-900/10 dark:border-slate-800 pt-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="block text-[10px] font-bold uppercase text-terracotta">
                        Ruta de desconcentración sugerida
                      </span>
                      {ind.alternativaSostenibleSugerida}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* CLIMA IDEAM + ALERTA MARINA DIMAR */}
        <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-gradient-to-br from-[#F3EFE6] to-white dark:from-slate-900 dark:to-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#065F46] dark:text-emerald-400">
              <CloudSun className="h-4 w-4" />
              Boletín climático · IDEAM Sierra Nevada
            </div>
            <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 dark:text-white">
              {contexto?.clima.estacion || "Estación Meteorológica Parque Tayrona & Sierra Nevada"}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Temperatura
                </span>
                <strong className="mt-1 block text-base font-extrabold text-slate-900 dark:text-white">
                  {temperatura} °C
                </strong>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Humedad
                </span>
                <strong className="mt-1 block text-base font-extrabold text-slate-900 dark:text-white">
                  {humedad}%
                </strong>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Prob. lluvia
                </span>
                <strong className="mt-1 block text-base font-extrabold text-slate-900 dark:text-white">
                  {lluvia}%
                </strong>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-[#065F46]/25 dark:border-emerald-500/30 bg-[#065F46]/10 dark:bg-emerald-950/50 p-3.5 text-xs font-semibold text-slate-900 dark:text-emerald-100">
              {contexto?.clima.alertaMeteorologica ||
                "Condiciones óptimas en costa y bosque húmedo de Minca."}
            </p>
            {contexto?.degradado && (
              <p className="mt-2 font-mono text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                Datos servidos desde caché de contingencia.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0284C7] dark:text-sky-400">
              <Waves className="h-4 w-4" />
              Alerta marina · DIMAR Capitanía de Santa Marta
            </div>
            <h3 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 dark:text-white">
              Bahías de Taganga, Isla Aguja &amp; Tayrona
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Oleaje
                </span>
                <strong className="mt-1 block text-base font-extrabold text-slate-900 dark:text-white">
                  0,8 – 1,2 m
                </strong>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <Wind className="h-3 w-3" /> Viento
                </span>
                <strong className="mt-1 block text-base font-extrabold text-slate-900 dark:text-white">
                  NE 14 km/h
                </strong>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Bandera
                </span>
                <strong className="mt-1 block text-base font-extrabold text-amber-700 dark:text-amber-400">
                  Amarilla
                </strong>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-[#0284C7]/30 dark:border-sky-500/30 bg-[#0284C7]/10 dark:bg-sky-950/60 p-3.5 text-xs font-semibold text-slate-900 dark:text-sky-100">
              Navegación menor permitida con precaución. Buceo recomendado en
              horario matutino (06:00–11:00) por mejor visibilidad submarina.
            </p>
          </div>
        </section>

        {/* LLAMADO A LA ACCIÓN */}
        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-900/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:flex-row sm:items-center shadow-sm">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 dark:text-white">
              Viaja donde el territorio respira tranquilo
            </h3>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Filtra el catálogo por rutas de bajo flujo y protege los ecosistemas
              que visitas.
            </p>
          </div>
          <Link
            href="/expediciones"
            className="inline-flex items-center gap-3 rounded-full bg-[#EA580C] hover:bg-[#D97706] py-2 pl-5 pr-2 text-sm font-bold text-white shadow-md transition-colors"
          >
            Ver expediciones
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#EA580C]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] border-t border-slate-900/10 dark:border-slate-800 px-4 py-8 sm:px-6 font-mono text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>TYRONAWILDS™ // PULSO DEL TERRITORIO · SANTA MARTA, CO</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/expediciones" className="hover:text-terracotta">Expediciones</Link>
            <Link href="/baquiano" className="hover:text-terracotta">Baquiano AI</Link>
            <Link href="/privacidad" className="hover:text-terracotta">Privacidad (Ley 1581)</Link>
            <Link href="/terminos" className="hover:text-terracotta">Términos RNT</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
