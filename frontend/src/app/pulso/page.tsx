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
  "Parque Nacional Natural Tayrona":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "Sierra Nevada de Santa Marta":
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  "Minca / Corregimiento de Bonda":
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  "Taganga / Bahía de Granate":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
};

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80";

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
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14">
        {/* ENCABEZADO */}
        <section className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-sand/85 backdrop-blur-md">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pulso del Territorio · Sostenibilidad ambiental</span>
            </div>
            <h1 className="mt-4 font-display text-5xl sm:text-6xl md:text-7xl uppercase leading-none tracking-tight text-white">
              {idioma === "es"
                ? "Así respiran hoy los ecosistemas"
                : "How the ecosystems breathe today"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-sand/75 leading-relaxed">
              Aforo en tiempo real del Parque Tayrona, Ciudad Perdida, Minca/Bonda
              e Isla Aguja, clima de la Sierra Nevada y rutas de desconcentración
              ecológica para viajar sin saturar el territorio.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] uppercase">
            <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-sand/75">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              Lectura {ultimaLectura || "--:--"}
            </span>
            <button
              type="button"
              onClick={cargarPulso}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-semibold normal-case text-black hover:bg-sand transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </section>

        {/* RESUMEN TERRITORIAL */}
        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <span className="mt-3 block font-display text-5xl text-white">
              {ocupacionPromedio}%
            </span>
            <span className="font-mono text-[11px] uppercase text-sand/55">
              Aforo promedio del territorio
            </span>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <AlertTriangle className="h-5 w-5 text-terracotta" />
            <span className="mt-3 block font-display text-5xl text-white">
              {criticos.length}
            </span>
            <span className="font-mono text-[11px] uppercase text-sand/55">
              Ecosistemas en alto flujo
            </span>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Thermometer className="h-5 w-5 text-amber-300" />
            <span className="mt-3 block font-display text-5xl text-white">
              {temperatura}°
            </span>
            <span className="font-mono text-[11px] uppercase text-sand/55">
              Temperatura Sierra Nevada
            </span>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Droplets className="h-5 w-5 text-sky-300" />
            <span className="mt-3 block font-display text-5xl text-white">
              {humedad}%
            </span>
            <span className="font-mono text-[11px] uppercase text-sand/55">
              Humedad relativa
            </span>
          </div>
        </section>

        {/* ECOSISTEMAS EN TIEMPO REAL */}
        <section className="mt-10">
          <h2 className="font-display text-4xl uppercase text-white">
            Estado de los ecosistemas
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {indicadores.map((ind) => {
              const flujo = etiquetaFlujo(ind.estadoAlerta);
              return (
                <article
                  key={ind.id}
                  className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-obsidian"
                >
                  <div className="relative h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={IMAGEN_POR_ZONA[ind.zona] || IMAGEN_POR_DEFECTO}
                      alt={ind.nombreDestino}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${flujo.clase}`}
                    >
                      {flujo.texto}
                    </span>
                    <span className="absolute bottom-3 left-4 font-mono text-[11px] text-sand/80">
                      {ind.zona}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-display text-2xl uppercase leading-none text-white">
                        {ind.nombreDestino}
                      </h3>
                      <div className="mt-4 flex justify-between font-mono text-xs">
                        <span className="text-sand/60">
                          {ind.ocupacionActual} / {ind.capacidadMaxima} visitantes
                        </span>
                        <strong className="text-white">{ind.porcentajeOcupacion}%</strong>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${flujo.barra}`}
                          style={{ width: `${Math.min(100, ind.porcentajeOcupacion)}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-3 font-mono text-[11px] text-sand/75">
                      <span className="block text-[10px] uppercase text-terracotta">
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
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-jungle/60 to-obsidian p-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-emerald-300">
              <CloudSun className="h-4 w-4" />
              Boletín climático · IDEAM Sierra Nevada
            </div>
            <h3 className="mt-3 font-display text-3xl uppercase text-white">
              {contexto?.clima.estacion || "Estación Parque Tayrona & Sierra Nevada"}
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] uppercase text-sand/50">Temperatura</span>
                <strong className="text-white">{temperatura} °C</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-sand/50">Humedad</span>
                <strong className="text-white">{humedad}%</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-sand/50">Prob. lluvia</span>
                <strong className="text-white">{lluvia}%</strong>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-sand/80">
              {contexto?.clima.alertaMeteorologica ||
                "Condiciones óptimas en costa y bosque húmedo de Minca."}
            </p>
            {contexto?.degradado && (
              <p className="mt-2 font-mono text-[10px] uppercase text-amber-300">
                Datos servidos desde caché de contingencia.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-950/60 to-obsidian p-6">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-sky-300">
              <Waves className="h-4 w-4" />
              Alerta marina · DIMAR Capitanía de Santa Marta
            </div>
            <h3 className="mt-3 font-display text-3xl uppercase text-white">
              Bahías de Taganga, Isla Aguja &amp; Tayrona
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <span className="block text-[10px] uppercase text-sand/50">Oleaje</span>
                <strong className="text-white">0,8 – 1,2 m</strong>
              </div>
              <div>
                <span className="flex items-center gap-1 text-[10px] uppercase text-sand/50">
                  <Wind className="h-3 w-3" /> Viento
                </span>
                <strong className="text-white">NE 14 km/h</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-sand/50">Bandera</span>
                <strong className="text-amber-300">Amarilla</strong>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-sand/80">
              Navegación menor permitida con precaución. Buceo recomendado en
              horario matutino (06:00–11:00) por mejor visibilidad submarina.
            </p>
          </div>
        </section>

        {/* LLAMADO A LA ACCIÓN */}
        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-3xl uppercase text-white">
              Viaja donde el territorio respira tranquilo
            </h3>
            <p className="mt-1 text-sm text-sand/70">
              Filtra el catálogo por rutas de bajo flujo y protege los ecosistemas
              que visitas.
            </p>
          </div>
          <Link
            href="/expediciones"
            className="inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-5 pr-1.5 text-sm font-semibold text-black hover:bg-sand transition-colors"
          >
            Ver expediciones
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] border-t border-white/10 px-4 py-8 sm:px-6 font-mono text-xs text-sand/55">
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
