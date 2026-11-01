"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  Sun,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Globe,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Radio,
  Wind,
} from "lucide-react";
import {
  ACTORES_SESION,
  ActividadTuristica,
  ContextoTerritorial,
  DisponibilidadHorario,
  Idioma,
  IndicadorCapacidadDestino,
  RespuestaCrearReserva,
  ResultadoRecomendacionIa,
  SEED_ACTIVIDADES,
  crearReservaTransaccional,
  ejecutarRecomendacionIa,
  obtenerCatalogoOfertas,
  obtenerContextoTerritorial,
  obtenerDisponibilidades,
  obtenerIndicadoresCapacidad,
} from "@/lib/api";

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function TyronaWildsCommercialStorefront() {
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [altoContraste, setAltoContraste] = useState<boolean>(false);

  const [actividades, setActividades] =
    useState<ActividadTuristica[]>(SEED_ACTIVIDADES);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [soloBajaCarga, setSoloBajaCarga] = useState<boolean>(false);
  const [contexto, setContexto] = useState<ContextoTerritorial | null>(null);
  const [disponibilidades, setDisponibilidades] = useState<
    DisponibilidadHorario[]
  >([]);
  const [indicadores, setIndicadores] = useState<IndicadorCapacidadDestino[]>(
    []
  );

  // Modal de Reserva Comercial
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<ActividadTuristica | null>(null);
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] =
    useState<string>("");
  const [cantidadCupos, setCantidadCupos] = useState<number>(2);
  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);
  const [resultadoReserva, setResultadoReserva] =
    useState<RespuestaCrearReserva | null>(null);

  // Recomendaciones editoriales
  const [interesesIa, setInteresesIa] = useState<string>(
    "trekking, sierra-nevada, sostenible, cascadas, minca"
  );
  const [resultadoIa, setResultadoIa] =
    useState<ResultadoRecomendacionIa | null>(null);
  const [ejecutandoIa, setEjecutandoIa] = useState<boolean>(false);

  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [altoContraste]);

  const cargarStorefront = useCallback(async () => {
    const [resOfertas, resContexto, resDisp, resInd, resIa] = await Promise.all(
      [
        obtenerCatalogoOfertas(),
        obtenerContextoTerritorial(),
        obtenerDisponibilidades(),
        obtenerIndicadoresCapacidad(),
        ejecutarRecomendacionIa(
          ACTORES_SESION.TURISTA,
          "trekking, sierra-nevada, sostenible, cascadas, minca",
          true,
          false,
          "PERSONALIZADO"
        ),
      ]
    );

    setActividades(resOfertas.data);
    setContexto(resContexto.data);
    setDisponibilidades(resDisp.data);
    setIndicadores(resInd.data);
    setResultadoIa(resIa.data);
  }, []);

  useEffect(() => {
    cargarStorefront();
  }, [cargarStorefront]);

  const abrirModalReserva = async (actividad: ActividadTuristica) => {
    setActividadSeleccionada(actividad);
    setResultadoReserva(null);
    setCantidadCupos(2);
    const resDisp = await obtenerDisponibilidades(actividad.id);
    const horariosActividad = resDisp.data;
    setDisponibilidades((prev) => {
      const otros = prev.filter((d) => d.actividadId !== actividad.id);
      return [...otros, ...horariosActividad];
    });
    if (horariosActividad.length > 0) {
      setHorarioSeleccionadoId(horariosActividad[0].id);
    }
  };

  const manejarConfirmarReserva = async () => {
    if (!actividadSeleccionada) return;
    const horariosAct = disponibilidades.filter(
      (d) => d.actividadId === actividadSeleccionada.id
    );
    const disp =
      horariosAct.find((d) => d.id === horarioSeleccionadoId) ||
      horariosAct[0];
    if (!disp) return;

    setProcesandoReserva(true);
    const respuesta = await crearReservaTransaccional(
      ACTORES_SESION.TURISTA,
      disp,
      cantidadCupos
    );
    setResultadoReserva(respuesta);

    if (respuesta.exito && respuesta.reserva) {
      setDisponibilidades((prev) =>
        prev.map((item) =>
          item.id === disp.id
            ? {
                ...item,
                cuposDisponibles: Math.max(
                  0,
                  item.cuposDisponibles - cantidadCupos
                ),
              }
            : item
        )
      );
    }
    setProcesandoReserva(false);
  };

  const manejarEjecutarIa = async () => {
    setEjecutandoIa(true);
    const res = await ejecutarRecomendacionIa(
      ACTORES_SESION.TURISTA,
      interesesIa,
      true,
      false,
      "PERSONALIZADO"
    );
    setResultadoIa(res.data);
    setEjecutandoIa(false);
  };

  const actividadesFiltradas = actividades.filter((a) => {
    if (filtroCategoria !== "TODAS" && a.categoria !== filtroCategoria) {
      return false;
    }
    if (soloBajaCarga && a.nivelOcupacionActual >= 80) {
      return false;
    }
    return true;
  });

  const horariosModal = actividadSeleccionada
    ? disponibilidades.filter(
        (d) => d.actividadId === actividadSeleccionada.id
      )
    : [];

  const tempActual = contexto ? Math.round(contexto.clima.temperaturaCelsius) : 29;
  const humedadActual = contexto ? contexto.clima.humedadRelativaPorcentaje : 78;

  return (
    <div className="min-h-screen bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* =====================================================================
          BARRA SUPERIOR EDITORIAL Y HUD DE EXPEDICIÓN
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-sand/15 bg-obsidian/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-4">
            <a
              href="#hero"
              className="font-display text-2xl tracking-[0.14em] text-sand hover:text-terracotta transition-colors"
            >
              TYRONAWILDS<span className="text-terracotta">™</span>
            </a>
            <div className="hidden sm:flex items-center gap-2 border border-sand/20 bg-obsidian px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-sand/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>SANTA MARTA · SIERRA NEVADA &amp; CARIBE</span>
            </div>
          </div>

          <nav
            aria-label="Navegación Principal"
            className="hidden lg:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.18em] text-sand/75"
          >
            <a
              href="#expediciones"
              className="hover:text-terracotta transition-colors"
            >
              01 // {idioma === "es" ? "EXPEDICIONES" : "EXPEDITIONS"}
            </a>
            <a
              href="#concierge-ia"
              className="hover:text-terracotta transition-colors"
            >
              02 // {idioma === "es" ? "CURADURÍA A MEDIDA" : "BESPOKE CURATION"}
            </a>
            <a
              href="#sostenibilidad"
              className="hover:text-terracotta transition-colors"
            >
              03 //{" "}
              {idioma === "es"
                ? "PULSO DEL TERRITORIO"
                : "TERRITORIAL PULSE"}
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIdioma(idioma === "es" ? "en" : "es")}
              className="flex items-center gap-1.5 border border-sand/25 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider hover:border-terracotta hover:text-terracotta transition-colors"
              title="Idioma / Language"
            >
              <Globe className="h-3.5 w-3.5 text-terracotta" />
              <span>{idioma.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={() => setAltoContraste(!altoContraste)}
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                altoContraste
                  ? "border-sand bg-sand text-obsidian font-bold"
                  : "border-sand/25 text-sand hover:border-terracotta"
              }`}
              title="Modo de lectura de alto contraste"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {altoContraste ? "ALTO CONTRASTE" : "LECTURA"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          SECCIÓN 1: HERO EDITORIAL INMERSIVO "PIERDE EL MAPA"
      ====================================================================== */}
      <section
        id="hero"
        className="relative min-h-[88vh] w-full overflow-hidden border-b border-sand/15 flex flex-col justify-between"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2000&q=85"
            alt="Sierra Nevada de Santa Marta y Parque Tayrona"
            className="h-full w-full object-cover object-center scale-105 opacity-55"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 60% 35%, rgba(13, 38, 28, 0.35) 0%, rgba(10, 10, 10, 0.94) 85%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
        </div>

        {/* Fila Superior del HUD de Expedición */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 pt-8 font-mono text-xs uppercase tracking-[0.16em] text-sand/80">
          <div className="flex items-center gap-3">
            <Compass className="h-4 w-4 text-terracotta" />
            <span>11°14&apos;27&quot;N 74°11&apos;56&quot;W // SANTA MARTA, CO</span>
            <span className="hidden md:inline text-sand/40">//</span>
            <span className="hidden md:inline text-sand/65">
              ALTITUD: 0m — 5.775m MSNM (PICO CRISTÓBAL COLÓN)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 border border-sand/20 bg-obsidian/80 px-3.5 py-1.5 backdrop-blur-md">
            <Sun className="h-4 w-4 text-terracotta" />
            <span>
              {idioma === "es"
                ? `SIERRA NEVADA ${tempActual}°C · HUMEDAD ${humedadActual}% · VIENTO 14 KM/H`
                : `SIERRA NEVADA ${tempActual}°C · HUMIDITY ${humedadActual}% · WIND 14 KM/H`}
            </span>
            <Wind className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Titular Monumental Escalonado */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-[1440px] px-6 py-12">
          <div className="mb-4 inline-flex items-center gap-2 border border-terracotta/50 bg-terracotta/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>
              {idioma === "es"
                ? "EXPEDICIONES DE CONSERVACIÓN Y ALTA MONTAÑA · SANTA MARTA"
                : "CONSERVATION & HIGH-MOUNTAIN EXPEDITIONS · SANTA MARTA"}
            </span>
          </div>

          <h1 className="font-display uppercase leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[clamp(4.4rem,11.5vw,10.5rem)] text-sand">
              {idioma === "es" ? "PIERDE" : "LOSE"}
            </span>
            <span className="block pl-[6vw] text-[clamp(4.4rem,11.5vw,10.5rem)] text-terracotta">
              {idioma === "es" ? "EL MAPA" : "THE MAP"}
            </span>
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6 lg:col-start-2 border-l-2 border-terracotta pl-5">
              <p className="text-base md:text-lg text-sand/85 leading-relaxed">
                {idioma === "es"
                  ? "Desde los arrecifes coralinos del Parque Tayrona hasta las terrazas líticas de Teyuna a 1.200 metros sobre el nivel del mar. Travesías curadas junto a comunidades indígenas y guías locales con cupos diarios estrictamente limitados para proteger cada ecosistema."
                  : "From the coral reefs of Tayrona National Park to the ancient stone terraces of Teyuna at 1,200 meters above sea level. Expeditions curated alongside indigenous elders and local guides with strictly limited daily departures to protect every ecosystem."}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center gap-4 lg:justify-end">
              <a
                href="#expediciones"
                className="inline-flex items-center gap-3 bg-terracotta px-7 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors"
              >
                <span>
                  {idioma === "es"
                    ? "EXPLORAR EXPEDICIONES"
                    : "EXPLORE EXPEDITIONS"}
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#concierge-ia"
                className="inline-flex items-center gap-2 border border-sand/30 bg-obsidian/80 px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-sand hover:border-terracotta transition-colors"
              >
                <Sparkles className="h-4 w-4 text-terracotta" />
                <span>
                  {idioma === "es" ? "DISEÑAR MI RUTA" : "DESIGN MY ROUTE"}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Barra Inferior del Hero */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-sand/15 px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-sand/70">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 bg-terracotta" />
            <span>SCROLL TO EXPLORE // SIERRA NEVADA &amp; CARIBE</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[11px]">
            <span>TEMPORADA SECA · VISIBILIDAD ÓPTIMA EN CUMBRES</span>
          </div>

          <div className="font-bold text-sand">
            01 <span className="text-terracotta">/</span> 06
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 2: CATÁLOGO DE EXPEDICIONES Y AFORO DEL ECOSISTEMA
      ====================================================================== */}
      <section
        id="expediciones"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // 01 · COLECCIÓN DE EXPEDICIONES CERTIFICADAS
            </div>
            <h2 className="mt-2 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "TRAVESÍAS & ESTADO DEL SENDERO"
                : "EXPEDITIONS & TRAIL CONDITIONS"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: "TODAS", labelEs: "TODAS (06)", labelEn: "ALL (06)" },
              {
                id: "ALTA_MONTANA_ANCESTRAL",
                labelEs: "ALTA MONTAÑA",
                labelEn: "HIGH MOUNTAIN",
              },
              {
                id: "COSTA_PARQUE_NACIONAL",
                labelEs: "PARQUE TAYRONA",
                labelEn: "TAYRONA PARK",
              },
              {
                id: "BOSQUE_NIEBLA_SOSTENIBLE",
                labelEs: "MINCA / BONDA",
                labelEn: "MINCA / BONDA",
              },
              {
                id: "TURISMO_COMUNITARIO",
                labelEs: "ANFITRIONES LOCALES",
                labelEn: "LOCAL HOSTS",
              },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFiltroCategoria(cat.id)}
                className={`border px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  filtroCategoria === cat.id
                    ? "border-terracotta bg-terracotta text-sand font-bold"
                    : "border-sand/20 bg-obsidian text-sand/75 hover:border-sand/50"
                }`}
              >
                {idioma === "es" ? cat.labelEs : cat.labelEn}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSoloBajaCarga(!soloBajaCarga)}
              className={`border px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                soloBajaCarga
                  ? "border-emerald-400 bg-emerald-950/60 text-emerald-300 font-bold"
                  : "border-sand/20 bg-obsidian text-sand/75 hover:border-emerald-400/50"
              }`}
            >
              {idioma === "es"
                ? "RUTAS DE BAJO FLUJO"
                : "QUIET TRAILS ONLY"}
            </button>
          </div>
        </div>

        {/* Grilla Brutalista de Expediciones */}
        <div className="mt-10 grid grid-cols-1 gap-0 border-t border-l border-sand/15 md:grid-cols-2 lg:grid-cols-3">
          {actividadesFiltradas.map((act, index) => {
            const altaCongestion = act.nivelOcupacionActual >= 80;
            return (
              <article
                key={act.id}
                className="group relative flex flex-col justify-between border-r border-b border-sand/15 bg-obsidian p-6 transition-colors hover:bg-jungle/25"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-sand/65">
                    <span>0{index + 1} // EXPEDICIÓN GUIADA</span>
                    <span className="flex items-center gap-1 text-terracotta">
                      <Mountain className="h-3.5 w-3.5" />
                      {act.altitudMsnm} MSNM
                    </span>
                  </div>

                  <div className="relative mt-4 h-56 w-full overflow-hidden border border-sand/15 bg-jungle/30">
                    <img
                      src={act.imagenUrl}
                      alt={idioma === "es" ? act.nombreEs : act.nombreEn}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />

                    <div className="absolute bottom-2.5 left-2.5 bg-obsidian/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-sand border border-sand/20">
                      {act.coordenadasHud}
                    </div>

                    {altaCongestion ? (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-terracotta px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sand shadow-lg">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>
                          AFORO DEL ECOSISTEMA AL {act.nivelOcupacionActual}%
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-950/90 border border-emerald-400/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                        FLUJO ECOLÓGICO SERENO
                      </div>
                    )}
                  </div>

                  <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-terracotta">
                    {act.ubicacion}
                  </div>
                  <h3 className="mt-1 font-display text-3xl uppercase leading-none tracking-wide text-sand">
                    {idioma === "es" ? act.nombreEs : act.nombreEn}
                  </h3>
                  <p className="mt-3 text-sm text-sand/75 leading-relaxed">
                    {idioma === "es" ? act.descripcionEs : act.descripcionEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-sand/15">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                    <span className="text-sand/70">
                      {idioma === "es"
                        ? "AFORO ACTUAL DEL SENDERO"
                        : "CURRENT TRAIL FLOW"}
                    </span>
                    <span
                      className={
                        altaCongestion
                          ? "font-bold text-terracotta"
                          : "text-emerald-400"
                      }
                    >
                      {act.nivelOcupacionActual}% · GRUPOS DE MÁX{" "}
                      {act.capacidadMaxima}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-sand/10 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        altaCongestion ? "bg-terracotta" : "bg-emerald-500"
                      }`}
                      style={{ width: `${act.nivelOcupacionActual}%` }}
                    />
                  </div>

                  {altaCongestion && (
                    <div className="mt-3 border border-terracotta/40 bg-terracotta/10 p-2.5 font-mono text-[11px] text-sand/90">
                      <span className="font-bold text-terracotta">
                        AFORO DEL ECOSISTEMA AL {act.nivelOcupacionActual}% —
                        SUGERIMOS RUTA DE BAJO IMPACTO:
                      </span>{" "}
                      {idioma === "es"
                        ? "Considera la Expedición Bioclimática en Minca y Cascadas de Marinka (28% de aforo actual)."
                        : "Consider the Minca Bioclimatic Expedition & Marinka Waterfalls (28% current trail occupancy)."}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-sand/50">
                        {idioma === "es"
                          ? "INVERSIÓN POR VIAJERO"
                          : "RATE PER TRAVELER"}
                      </span>
                      <span className="font-mono text-lg font-bold text-sand">
                        {formatearCop(act.precioCop)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirModalReserva(act)}
                      className="inline-flex items-center gap-2 bg-sand px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
                    >
                      <span>
                        {idioma === "es" ? "RESERVAR CUPO" : "BOOK EXPEDITION"}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          MODAL DE RESERVA DE EXPEDICIÓN
      ====================================================================== */}
      {actividadSeleccionada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-reserva"
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-2xl border border-sand/30 bg-obsidian p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-sand/15 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
                  // RESERVA DE CUPO GARANTIZADO · {actividadSeleccionada.ubicacion}
                </span>
                <h3
                  id="titulo-modal-reserva"
                  className="mt-1 font-display text-4xl uppercase text-sand"
                >
                  {idioma === "es"
                    ? actividadSeleccionada.nombreEs
                    : actividadSeleccionada.nombreEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActividadSeleccionada(null)}
                className="border border-sand/25 px-3 py-1 font-mono text-xs uppercase text-sand hover:border-terracotta hover:text-terracotta"
              >
                CERRAR [X]
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-sand/75">
                  1. SELECCIONA TU SALIDA PROGRAMADA:
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {horariosModal.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setHorarioSeleccionadoId(h.id);
                        setResultadoReserva(null);
                      }}
                      className={`border p-3 text-left font-mono text-xs transition-colors ${
                        horarioSeleccionadoId === h.id
                          ? "border-terracotta bg-terracotta/15 text-sand"
                          : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-terracotta" />
                          {h.fecha}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-terracotta" />
                          {h.horaInicio.slice(0, 5)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span>
                          CUPOS DISPONIBLES:{" "}
                          <strong className="text-emerald-400">
                            {h.cuposDisponibles}
                          </strong>{" "}
                          / {h.capacidadTotal}
                        </span>
                        <span>{formatearCop(h.precioUnitarioCop)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="input-cupos"
                    className="block font-mono text-xs uppercase tracking-wider text-sand/75"
                  >
                    2. NÚMERO DE EXPEDICIONARIOS:
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-terracotta" />
                    <input
                      id="input-cupos"
                      type="number"
                      min={1}
                      max={16}
                      value={cantidadCupos}
                      onChange={(e) =>
                        setCantidadCupos(
                          Math.max(1, parseInt(e.target.value || "1", 10))
                        )
                      }
                      className="w-full border border-sand/30 bg-obsidian px-3 py-2 font-mono text-sm text-sand focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-sand/15 bg-jungle/20 p-3 font-mono text-xs">
                  <span className="block text-sand/60">RESUMEN DE RESERVA:</span>
                  <span className="mt-1 block font-bold text-sand">
                    {cantidadCupos}{" "}
                    {cantidadCupos === 1 ? "Expedicionario" : "Expedicionarios"}
                  </span>
                  <span className="mt-1 block text-terracotta">
                    TOTAL:{" "}
                    {formatearCop(
                      actividadSeleccionada.precioCop * cantidadCupos
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={procesandoReserva}
                  onClick={manejarConfirmarReserva}
                  className="w-full bg-terracotta px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember disabled:opacity-50"
                >
                  {procesandoReserva
                    ? "VERIFICANDO DISPONIBILIDAD EN EL SENDERO..."
                    : "CONFIRMAR RESERVA DE EXPEDICIÓN"}
                </button>
              </div>

              {resultadoReserva && (
                <div
                  className={`mt-4 border p-4 font-mono text-xs ${
                    resultadoReserva.exito
                      ? "border-emerald-400/50 bg-emerald-950/30 text-emerald-200"
                      : "border-terracotta bg-terracotta/15 text-sand"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold uppercase">
                    <span className="flex items-center gap-2">
                      {resultadoReserva.exito ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-terracotta" />
                      )}
                      {resultadoReserva.exito
                        ? `EXPEDICIÓN CONFIRMADA · PASAPORTE ${resultadoReserva.reserva?.codigoReserva}`
                        : "CUPOS COMPLETOS PARA ESTA SALIDA"}
                    </span>
                  </div>

                  {resultadoReserva.exito && resultadoReserva.reserva ? (
                    <div className="mt-2 space-y-1 text-sand/85">
                      <p>
                        Cupos reservados: {resultadoReserva.reserva.cantidadCupos}{" "}
                        · Total:{" "}
                        {formatearCop(resultadoReserva.reserva.montoTotalCop)}
                      </p>
                      <p className="text-emerald-300">
                        Tu permiso de ingreso y coordenadas de encuentro con el
                        guía local han sido emitidos.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      <p>{resultadoReserva.errorMensaje}</p>
                      <p className="text-amber-300">
                        <strong>PRÓXIMA SALIDA DISPONIBLE:</strong>{" "}
                        {resultadoReserva.horariosAlternativos}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECCIÓN 3: CURADURÍA INTELIGENTE DE EXPEDICIONES
      ====================================================================== */}
      <section
        id="concierge-ia"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // 02 · CONCIERGE DE EXPEDICIONES EN TIEMPO REAL
            </div>
            <h2 className="mt-2 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "RUTAS CURADAS SEGÚN CLIMA & PERFIL"
                : "ROUTES CURATED BY WEATHER & PROFILE"}
            </h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 border border-sand/20 bg-jungle/15 p-6">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
              <Sparkles className="h-4 w-4" />
              <span>PREFERENCIAS DEL VIAJERO</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="input-intereses-ia"
                  className="block font-mono text-xs uppercase text-sand/75"
                >
                  TERRENO, RITMO Y EXPERIENCIA BUSCADA:
                </label>
                <input
                  id="input-intereses-ia"
                  type="text"
                  value={interesesIa}
                  onChange={(e) => setInteresesIa(e.target.value)}
                  className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-xs text-sand focus:border-terracotta focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={ejecutandoIa}
                onClick={manejarEjecutarIa}
                className="w-full flex items-center justify-center gap-2 bg-sand px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${ejecutandoIa ? "animate-spin" : ""}`}
                />
                <span>
                  {ejecutandoIa
                    ? "ANALIZANDO CLIMA Y SENDEROS..."
                    : "ACTUALIZAR RECOMENDACIONES"}
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {(resultadoIa?.recomendaciones || []).slice(0, 3).map((rec, idx) => (
              <div
                key={rec.actividadId}
                className="flex flex-col justify-between border border-sand/20 bg-obsidian p-5"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="bg-terracotta px-2.5 py-0.5 font-bold text-sand">
                      SELECCIÓN #{idx + 1} · {rec.puntajeAfinidad}%
                    </span>
                    <span className="text-sand/65">
                      AFORO: {rec.nivelOcupacionActual}%
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-3xl uppercase text-sand">
                    {idioma === "es" ? rec.nombreEs : rec.nombreEn}
                  </h3>
                  <div className="mt-1 font-mono text-[11px] text-terracotta">
                    {rec.ubicacion} · {rec.coordenadasHud}
                  </div>

                  <div className="mt-4 border-l-2 border-emerald-400 bg-jungle/30 p-3.5 font-mono text-xs leading-relaxed text-sand/90">
                    {idioma === "es" ? rec.explicacionEs : rec.explicacionEn}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-sand/15 pt-3 font-mono text-xs">
                  <span className="font-bold text-sand">
                    {formatearCop(rec.precioCop)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const act = actividades.find(
                        (a) => a.id === rec.actividadId
                      );
                      if (act) abrirModalReserva(act);
                    }}
                    className="text-terracotta hover:underline uppercase font-bold"
                  >
                    {idioma === "es" ? "RESERVAR ->" : "BOOK ->"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 4: PULSO DEL TERRITORIO Y CONSERVACIÓN DE ECOSISTEMAS
      ====================================================================== */}
      <section
        id="sostenibilidad"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-sand/15 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // 03 · COMPROMISO DE CONSERVACIÓN · SIERRA NEVADA &amp; PARQUE TAYRONA
            </div>
            <h2 className="mt-2 font-display text-5xl uppercase tracking-tight text-sand">
              PULSO DE LOS ECOSISTEMAS EN VIVO
            </h2>
          </div>
          <div className="font-mono text-xs text-sand/70">
            MONITOREO SATELITAL Y EN SENDERO PARA UN TURISMO REGENERATIVO
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((ind) => (
            <div
              key={ind.id}
              className="border border-sand/20 bg-obsidian p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-sand/60">{ind.zona}</span>
                  <span
                    className={`px-2 py-0.5 font-bold ${
                      ind.estadoAlerta === "CRITICA"
                        ? "bg-terracotta text-sand"
                        : ind.estadoAlerta === "MODERADA"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {ind.estadoAlerta === "CRITICA"
                      ? "ALTO FLUJO"
                      : ind.estadoAlerta === "MODERADA"
                      ? "FLUJO MEDIO"
                      : "FLUJO SERENO"}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-2xl uppercase text-sand">
                  {ind.nombreDestino}
                </h3>

                <div className="mt-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span>AFORO DEL DÍA:</span>
                    <strong className="text-sand">
                      {ind.porcentajeOcupacion}%
                    </strong>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-sand/10">
                    <div
                      className={`h-full ${
                        ind.estadoAlerta === "CRITICA"
                          ? "bg-terracotta"
                          : ind.estadoAlerta === "MODERADA"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${ind.porcentajeOcupacion}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/75">
                <span className="block text-[10px] uppercase text-terracotta">
                  RUTA RECOMENDADA DE BAJO IMPACTO:
                </span>
                {ind.alternativaSostenibleSugerida}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          FOOTER COMERCIAL + ENLACE DISCRETO SYSTEM STATUS // LAB
      ====================================================================== */}
      <footer className="mx-auto max-w-[1440px] border-x border-sand/15 px-6 py-10 font-mono text-xs text-sand/60">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-bold text-sand">TYRONAWILDS™</span> // SANTA
            MARTA, COLOMBIA · EXPEDICIONES DE ALTA MONTAÑA Y CARIBE
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span>RNT CERTIFICADO · SOSTENIBILIDAD TAYRONA &amp; TEYUNA</span>
            <Link
              href="/lab"
              className="border border-sand/15 px-2.5 py-1 text-[10px] uppercase tracking-widest text-sand/45 hover:border-terracotta hover:text-terracotta transition-colors"
            >
              SYSTEM STATUS // LAB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
