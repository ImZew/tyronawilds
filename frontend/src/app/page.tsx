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
  ChevronDown,
  Radio,
  Wind,
  ShieldCheck,
  MapPin,
  Award,
  Check,
  CreditCard,
  Lock,
  LogOut,
  Compass as CompassIcon,
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
  SesionAutenticada,
  cerrarSesion,
  crearReservaTransaccional,
  ejecutarRecomendacionIa,
  obtenerCatalogoOfertas,
  obtenerContextoTerritorial,
  obtenerDisponibilidades,
  obtenerFichaTecnicaExpedicion,
  obtenerIndicadoresCapacidad,
  obtenerSesionActual,
} from "@/lib/api";
import { registrarEventoAnalitica } from "@/lib/analytics";

type EstiloViajeId =
  | "AVENTURA_EXTREMA"
  | "CONEXION_ANCESTRAL"
  | "BIODIVERSIDAD_CALMA"
  | "INMERSION_CARIBE";

type PresupuestoId = "ESENCIAL" | "COMPLETO" | "SIGNATURE";
type RitmoId = "CONTEMPLATIVO" | "ACTIVO" | "DESAFIO";

interface ErroresFormularioCheckout {
  cupos?: string;
  nombre?: string;
  documento?: string;
  email?: string;
  habeasData?: string;
}

const ESTILOS_BAQUIANO: Record<
  EstiloViajeId,
  {
    tituloEs: string;
    tituloEn: string;
    subEs: string;
    subEn: string;
    tags: string;
    notaEditorialEs: string;
    notaEditorialEn: string;
  }
> = {
  AVENTURA_EXTREMA: {
    tituloEs: "Aventura Extrema",
    tituloEn: "Extreme Adventure",
    subEs: "Alta montaña, selva húmeda y ascenso vertical",
    subEn: "High mountain, rainforest & vertical ascent",
    tags: "trekking, sierra-nevada, selva, arqueologia, senderismo",
    notaEditorialEs:
      "Priorizamos rutas de desnivel pronunciado en la Sierra Nevada donde las mañanas despejadas favorecen el ascenso bajo dosel selvático.",
    notaEditorialEn:
      "Prioritizing steep elevation trails in the Sierra Nevada where clear mornings favor ascents beneath the rainforest canopy.",
  },
  CONEXION_ANCESTRAL: {
    tituloEs: "Conexión Ancestral",
    tituloEn: "Ancestral Connection",
    subEs: "Territorios Kogui, Arhuacos y legado histórico",
    subEn: "Kogui & Arhuaco territories and living heritage",
    tags: "ancestral, arhuaco, comunitario, rio, cultura, historia",
    notaEditorialEs:
      "Seleccionamos travesías guiadas por sabedores locales y cuencas sagradas que conectan los picos nevados con la historia colonial.",
    notaEditorialEn:
      "Curating journeys led by indigenous stewards and historians across sacred river basins and colonial heritage sites.",
  },
  BIODIVERSIDAD_CALMA: {
    tituloEs: "Biodiversidad & Calma",
    tituloEn: "Biodiversity & Calm",
    subEs: "Bosque de niebla, aves endémicas y aguas glaciares",
    subEn: "Cloud forest, endemic birds & glacier pools",
    tags: "minca, bonda, cascadas, cafe, avistamiento-aves, sostenible",
    notaEditorialEs:
      "Enfocamos tu recorrido en los pisos térmicos frescos de Minca y Bonda (650 msnm), lejos de las zonas de alto flujo costero.",
    notaEditorialEn:
      "Focusing your journey on the cool cloud-forest elevations of Minca and Bonda (650 masl), away from high-traffic coastal trails.",
  },
  INMERSION_CARIBE: {
    tituloEs: "Inmersión Caribe",
    tituloEn: "Caribbean Immersion",
    subEs: "Arrecifes coralinos, apnea y bahías graníticas",
    subEn: "Coral reefs, freediving & granitic bays",
    tags: "playa, tayrona, buceo, taganga, coral, marino, caribe",
    notaEditorialEs:
      "Aprovechamos la visibilidad submarina actual entre Isla Aguja y las bahías del Parque Tayrona con brisa suave del noreste.",
    notaEditorialEn:
      "Leveraging today's underwater visibility between Isla Aguja and Tayrona's granitic bays with gentle northeast trade winds.",
  },
};

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
  const [sesionUsuario, setSesionUsuario] = useState<SesionAutenticada | null>(
    null
  );

  useEffect(() => {
    const actualizarSesion = () => setSesionUsuario(obtenerSesionActual());
    actualizarSesion();
    window.addEventListener("tyronawilds-auth-change", actualizarSesion);
    return () =>
      window.removeEventListener("tyronawilds-auth-change", actualizarSesion);
  }, []);

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

  // Drawer de Producto Completo + Checkout Comercial con Validación de Campos
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<ActividadTuristica | null>(null);
  const [indiceFotoActiva, setIndiceFotoActiva] = useState<number>(0);
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] =
    useState<string>("");
  const [cantidadCupos, setCantidadCupos] = useState<number>(2);
  const [nombreViajero, setNombreViajero] = useState<string>("Valeria Mejía");
  const [emailViajero, setEmailViajero] = useState<string>(
    "valeria@expedicion.co"
  );
  const [documentoViajero, setDocumentoViajero] =
    useState<string>("CC 1082940122");
  const [aceptaHabeasData, setAceptaHabeasData] = useState<boolean>(true);
  const [erroresCheckout, setErroresCheckout] =
    useState<ErroresFormularioCheckout>({});
  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);
  const [resultadoReserva, setResultadoReserva] =
    useState<RespuestaCrearReserva | null>(null);

  // BAQUIANO AI — Concierge de Expediciones
  const [estiloViaje, setEstiloViaje] = useState<EstiloViajeId>(
    "BIODIVERSIDAD_CALMA"
  );
  const [presupuesto, setPresupuesto] = useState<PresupuestoId>("SIGNATURE");
  const [ritmo, setRitmo] = useState<RitmoId>("ACTIVO");
  const [resultadoIa, setResultadoIa] =
    useState<ResultadoRecomendacionIa | null>(null);
  const [ejecutandoIa, setEjecutandoIa] = useState<boolean>(false);
  const [mostrarRazonamientoMotor, setMostrarRazonamientoMotor] =
    useState<boolean>(false);

  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [altoContraste]);

  const cargarStorefront = useCallback(async () => {
    registrarEventoAnalitica("PAGE_VIEW", { page: "/" });
    const [resOfertas, resContexto, resDisp, resInd, resIa] = await Promise.all(
      [
        obtenerCatalogoOfertas(),
        obtenerContextoTerritorial(),
        obtenerDisponibilidades(),
        obtenerIndicadoresCapacidad(),
        ejecutarRecomendacionIa(
          ACTORES_SESION.TURISTA,
          ESTILOS_BAQUIANO.BIODIVERSIDAD_CALMA.tags,
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

  // Abrir Drawer de Expedición Completa y Checkout
  const abrirDrawerExpedicion = async (actividad: ActividadTuristica) => {
    setActividadSeleccionada(actividad);
    setIndiceFotoActiva(0);
    setResultadoReserva(null);
    setErroresCheckout({});
    setCantidadCupos(2);

    registrarEventoAnalitica("EXPEDITION_DRAWER_OPEN", {
      codigoServicio: actividad.codigoServicio,
      slug: actividad.slug,
      precioCop: actividad.precioCop,
    });

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

  // Validación estricta campo por campo del formulario de Checkout
  const validarFormularioCheckout = (): boolean => {
    const nuevosErrores: ErroresFormularioCheckout = {};
    const nombreLimpio = nombreViajero.trim();
    const docLimpio = documentoViajero.trim();
    const emailLimpio = emailViajero.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!Number.isInteger(cantidadCupos) || cantidadCupos < 1 || cantidadCupos > 16) {
      nuevosErrores.cupos =
        "Ingresa entre 1 y 16 viajeros por reserva grupal.";
    }
    if (nombreLimpio.length < 4 || /[<>]/.test(nombreLimpio)) {
      nuevosErrores.nombre =
        "Ingresa el nombre y apellido válidos del expedicionario titular.";
    }
    if (docLimpio.length < 5 || /[<>]/.test(docLimpio)) {
      nuevosErrores.documento =
        "Documento o pasaporte requerido para póliza PNN / ICANH.";
    }
    if (!regexEmail.test(emailLimpio)) {
      nuevosErrores.email =
        "Ingresa un correo electrónico válido para recibir el pasaporte.";
    }
    if (!aceptaHabeasData) {
      nuevosErrores.habeasData =
        "Debes autorizar el tratamiento de datos (Ley 1581 de 2012) y aceptar los términos RNT.";
    }

    setErroresCheckout(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Ejecutar Checkout conectado al backend
  const manejarConfirmarCheckout = async () => {
    if (!actividadSeleccionada) return;
    if (!validarFormularioCheckout()) {
      registrarEventoAnalitica("CHECKOUT_VALIDATION_ERROR", {
        codigoServicio: actividadSeleccionada.codigoServicio,
      });
      return;
    }

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
      registrarEventoAnalitica("CHECKOUT_CONVERSION", {
        codigoReserva: respuesta.reserva.codigoReserva,
        montoTotalCop: respuesta.reserva.montoTotalCop,
        cupos: cantidadCupos,
      });
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

  // Ejecutar Baquiano AI Concierge
  const manejarConsultarBaquiano = async (
    nuevoEstilo: EstiloViajeId = estiloViaje,
    nuevoPresupuesto: PresupuestoId = presupuesto,
    nuevoRitmo: RitmoId = ritmo
  ) => {
    setEstiloViaje(nuevoEstilo);
    setPresupuesto(nuevoPresupuesto);
    setRitmo(nuevoRitmo);
    setEjecutandoIa(true);

    registrarEventoAnalitica("BAQUIANO_AI_QUERY", {
      estilo: nuevoEstilo,
      presupuesto: nuevoPresupuesto,
      ritmo: nuevoRitmo,
    });

    const tagsRitmo =
      nuevoRitmo === "DESAFIO"
        ? "trekking, sierra-nevada, senderismo"
        : nuevoRitmo === "CONTEMPLATIVO"
        ? "minca, rio, historia, sostenible"
        : "naturaleza, caribe";

    const tagsCombinados = `${ESTILOS_BAQUIANO[nuevoEstilo].tags}, ${tagsRitmo}`;

    const res = await ejecutarRecomendacionIa(
      ACTORES_SESION.TURISTA,
      tagsCombinados,
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

  const recomendacionesFiltradasPorPresupuesto = (
    resultadoIa?.recomendaciones || []
  ).filter((rec) => {
    if (presupuesto === "ESENCIAL") return rec.precioCop <= 260000;
    if (presupuesto === "COMPLETO") return rec.precioCop <= 400000;
    return true;
  });

  const recomendacionesVisibles =
    recomendacionesFiltradasPorPresupuesto.length > 0
      ? recomendacionesFiltradasPorPresupuesto.slice(0, 3)
      : (resultadoIa?.recomendaciones || []).slice(0, 3);

  const horariosModal = actividadSeleccionada
    ? disponibilidades.filter(
        (d) => d.actividadId === actividadSeleccionada.id
      )
    : [];

  const fichaActiva = actividadSeleccionada
    ? obtenerFichaTecnicaExpedicion(actividadSeleccionada.codigoServicio)
    : null;

  const tempActual = contexto
    ? Math.round(contexto.clima.temperaturaCelsius)
    : 29;
  const humedadActual = contexto
    ? contexto.clima.humedadRelativaPorcentaje
    : 78;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* =====================================================================
          BARRA SUPERIOR EDITORIAL Y TELEMETRÍA CLIMÁTICA REAL
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-sand/15 bg-obsidian/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#hero"
              className="font-display text-xl sm:text-2xl tracking-[0.14em] text-sand hover:text-terracotta transition-colors"
            >
              TYRONAWILDS<span className="text-terracotta">™</span>
            </a>
            <div className="hidden md:flex items-center gap-2 border border-sand/20 bg-obsidian px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-sand/75">
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
              href="#baquiano-ai"
              className="hover:text-terracotta transition-colors"
            >
              02 // {idioma === "es" ? "BAQUIANO AI" : "BAQUIANO AI"}
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
            <Link
              href="/operadores"
              className="border border-terracotta/50 bg-terracotta/10 px-2.5 py-1 text-[11px] font-bold text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
            >
              {idioma === "es" ? "PORTAL OPERADORES" : "OPERATOR PORTAL"}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {sesionUsuario ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/operadores"
                  className="inline-flex items-center gap-1.5 border border-emerald-500/45 bg-emerald-950/35 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:border-terracotta hover:text-sand transition-colors"
                  title="Ir al panel operativo"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="max-w-[140px] truncate">
                    {sesionUsuario.nombre}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    cerrarSesion();
                    setSesionUsuario(null);
                  }}
                  className="inline-flex items-center gap-1 border border-sand/25 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-sand/75 hover:border-terracotta hover:text-terracotta transition-colors"
                  title="Cerrar sesión JWT"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {idioma === "es" ? "SALIR" : "LOGOUT"}
                  </span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-terracotta px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{idioma === "es" ? "INICIAR SESIÓN" : "SIGN IN"}</span>
              </Link>
            )}
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
        className="relative min-h-[86vh] w-full overflow-hidden border-b border-sand/15 flex flex-col justify-between"
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
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pt-6 sm:px-6 sm:pt-8 font-mono text-[11px] sm:text-xs uppercase tracking-[0.14em] text-sand/80">
          <div className="flex items-center gap-2 sm:gap-3">
            <Compass className="h-4 w-4 shrink-0 text-terracotta" />
            <span>11°14&apos;27&quot;N 74°11&apos;56&quot;W // SANTA MARTA, CO</span>
            <span className="hidden md:inline text-sand/40">//</span>
            <span className="hidden md:inline text-sand/65">
              ALTITUD: 0m — 5.775m MSNM (PICO CRISTÓBAL COLÓN)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 border border-sand/20 bg-obsidian/80 px-3 py-1.5 backdrop-blur-md">
            <Sun className="h-4 w-4 shrink-0 text-terracotta" />
            <span>
              {idioma === "es"
                ? `SIERRA NEVADA ${tempActual}°C · HUMEDAD ${humedadActual}% · VIENTO 14 KM/H`
                : `SIERRA NEVADA ${tempActual}°C · HUMIDITY ${humedadActual}% · WIND 14 KM/H`}
            </span>
            <Wind className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          </div>
        </div>

        {/* Titular Monumental Escalonado */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12">
          <div className="mb-4 inline-flex items-center gap-2 border border-terracotta/50 bg-terracotta/10 px-3 py-1 font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] text-terracotta">
            <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse" />
            <span>
              {idioma === "es"
                ? "EXPEDICIONES DE CONSERVACIÓN Y ALTA MONTAÑA · SANTA MARTA"
                : "CONSERVATION & HIGH-MOUNTAIN EXPEDITIONS · SANTA MARTA"}
            </span>
          </div>

          <h1 className="font-display uppercase leading-[0.86] tracking-[-0.02em]">
            <span className="block text-[clamp(3.6rem,11.5vw,10.5rem)] text-sand">
              {idioma === "es" ? "PIERDE" : "LOSE"}
            </span>
            <span className="block pl-[4vw] sm:pl-[6vw] text-[clamp(3.6rem,11.5vw,10.5rem)] text-terracotta">
              {idioma === "es" ? "EL MAPA" : "THE MAP"}
            </span>
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6 lg:col-start-2 border-l-2 border-terracotta pl-4 sm:pl-5">
              <p className="text-sm sm:text-base md:text-lg text-sand/85 leading-relaxed">
                {idioma === "es"
                  ? "Desde los arrecifes coralinos del Parque Tayrona hasta las terrazas líticas de Teyuna a 1.200 metros sobre el nivel del mar. Travesías curadas junto a comunidades indígenas y guías locales con cupos diarios estrictamente limitados para proteger cada ecosistema."
                  : "From the coral reefs of Tayrona National Park to the ancient stone terraces of Teyuna at 1,200 meters above sea level. Expeditions curated alongside indigenous elders and local guides with strictly limited daily departures to protect every ecosystem."}
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap items-center gap-3 sm:gap-4 lg:justify-end">
              <a
                href="#expediciones"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-3 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors"
              >
                <span>
                  {idioma === "es"
                    ? "EXPLORAR EXPEDICIONES"
                    : "EXPLORE EXPEDITIONS"}
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#baquiano-ai"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 border border-sand/30 bg-obsidian/80 px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-sand hover:border-terracotta transition-colors"
              >
                <Sparkles className="h-4 w-4 text-terracotta" />
                <span>
                  {idioma === "es"
                    ? "CONSULTAR A BAQUIANO AI"
                    : "ASK BAQUIANO AI"}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Barra Inferior del Hero */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-sand/15 px-4 py-4 sm:px-6 font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-sand/70">
          <div className="flex items-center gap-2.5">
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
          SECCIÓN 2: CATÁLOGO DE EXPEDICIONES CON ACCESO A FICHA TÉCNICA COMPLETA
      ====================================================================== */}
      <section
        id="expediciones"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // 01 · COLECCIÓN DE EXPEDICIONES CERTIFICADAS
            </div>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "TRAVESÍAS & ESTADO DEL SENDERO"
                : "EXPEDITIONS & TRAIL CONDITIONS"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
                className={`border px-3 py-2 font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-colors ${
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
              className={`border px-3 py-2 font-mono text-[11px] sm:text-xs uppercase tracking-wider transition-colors ${
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
            const ficha = obtenerFichaTecnicaExpedicion(act.codigoServicio);
            return (
              <article
                key={act.id}
                onClick={() => abrirDrawerExpedicion(act)}
                className="group relative flex cursor-pointer flex-col justify-between border-r border-b border-sand/15 bg-obsidian p-5 sm:p-6 transition-colors hover:bg-jungle/25"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-sand/65">
                    <span className="truncate">
                      0{index + 1} //{" "}
                      {idioma === "es" ? ficha.duracionEs : ficha.duracionEn}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-terracotta">
                      <Mountain className="h-3.5 w-3.5" />
                      {act.altitudMsnm} MSNM
                    </span>
                  </div>

                  <div className="relative mt-4 h-56 w-full overflow-hidden border border-sand/15 bg-jungle/30">
                    <img
                      src={act.imagenUrl}
                      alt={idioma === "es" ? act.nombreEs : act.nombreEn}
                      loading="lazy"
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

                  <div className="mt-4 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-terracotta">
                    <span className="truncate">{act.ubicacion}</span>
                    <span className="shrink-0 text-sand/55">
                      {ficha.operadorLicenciaRnt.split("·")[0]}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-3xl uppercase leading-none tracking-wide text-sand group-hover:text-terracotta transition-colors">
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

                  <div className="mt-5 flex items-center justify-between gap-3">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDrawerExpedicion(act);
                      }}
                      className="inline-flex items-center gap-1.5 bg-sand px-3.5 py-2.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-obsidian group-hover:bg-terracotta group-hover:text-sand transition-colors"
                    >
                      <span>
                        {idioma === "es"
                          ? "VER FICHA & RESERVAR"
                          : "ITINERARY & BOOK"}
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
          DRAWER / MODAL DE PRODUCTO COMPLETO (GALERÍA, FICHA TÉCNICA Y CHECKOUT)
      ====================================================================== */}
      {actividadSeleccionada && fichaActiva && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-drawer-expedicion"
          className="fixed inset-0 z-50 flex justify-end bg-obsidian/85 backdrop-blur-sm"
          onClick={() => setActividadSeleccionada(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-full max-w-4xl overflow-y-auto border-l border-sand/25 bg-obsidian p-4 sm:p-6 md:p-10 shadow-2xl"
          >
            {/* Barra Superior del Drawer */}
            <div className="flex items-start justify-between gap-4 border-b border-sand/15 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-terracotta">
                  <span>{actividadSeleccionada.ubicacion}</span>
                  <span>·</span>
                  <span>{actividadSeleccionada.coordenadasHud}</span>
                </div>
                <h2
                  id="titulo-drawer-expedicion"
                  className="mt-1 font-display text-3xl sm:text-4xl md:text-5xl uppercase leading-none text-sand"
                >
                  {idioma === "es"
                    ? actividadSeleccionada.nombreEs
                    : actividadSeleccionada.nombreEn}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActividadSeleccionada(null)}
                className="shrink-0 border border-sand/30 px-3 py-2 font-mono text-xs uppercase text-sand hover:border-terracotta hover:text-terracotta transition-colors"
              >
                {idioma === "es" ? "CERRAR [X]" : "CLOSE [X]"}
              </button>
            </div>

            {/* Galería Visual Interactiva */}
            <div className="mt-6">
              <div className="relative h-60 sm:h-72 md:h-96 w-full overflow-hidden border border-sand/20 bg-jungle/20">
                <img
                  src={
                    fichaActiva.galeriaImagenes[indiceFotoActiva] ||
                    actividadSeleccionada.imagenUrl
                  }
                  alt={actividadSeleccionada.nombreEs}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-obsidian/85 border border-sand/20 px-3 py-1 font-mono text-[11px] sm:text-xs uppercase text-sand truncate">
                  {fichaActiva.operadorNombre} ·{" "}
                  {fichaActiva.operadorLicenciaRnt}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {fichaActiva.galeriaImagenes.map((imgUrl, idx) => (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    onClick={() => setIndiceFotoActiva(idx)}
                    className={`relative h-16 sm:h-20 overflow-hidden border transition-all ${
                      indiceFotoActiva === idx
                        ? "border-terracotta ring-1 ring-terracotta"
                        : "border-sand/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vista ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Ficha Técnica de la Expedición */}
            <div className="mt-8 grid grid-cols-2 gap-3 border border-sand/20 bg-jungle/15 p-4 font-mono text-xs sm:grid-cols-4">
              <div className="border-r border-sand/15 pr-3">
                <span className="block text-[10px] uppercase text-sand/55">
                  ALTITUD MÁXIMA
                </span>
                <strong className="mt-1 flex items-center gap-1 text-sm text-sand">
                  <Mountain className="h-3.5 w-3.5 text-terracotta" />
                  {actividadSeleccionada.altitudMsnm} MSNM
                </strong>
              </div>
              <div className="sm:border-r border-sand/15 pr-3">
                <span className="block text-[10px] uppercase text-sand/55">
                  DURACIÓN
                </span>
                <strong className="mt-1 block text-sand">
                  {idioma === "es"
                    ? fichaActiva.duracionEs
                    : fichaActiva.duracionEn}
                </strong>
              </div>
              <div className="border-r border-sand/15 pr-3">
                <span className="block text-[10px] uppercase text-sand/55">
                  EXIGENCIA
                </span>
                <strong className="mt-1 block text-sand">
                  {idioma === "es"
                    ? fichaActiva.dificultadEs
                    : fichaActiva.dificultadEn}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-sand/55">
                  OPERADOR LOCAL
                </span>
                <strong className="mt-1 flex items-center gap-1 text-emerald-400">
                  <Award className="h-3.5 w-3.5" />
                  {fichaActiva.operadorLicenciaRnt.split("·")[0]}
                </strong>
              </div>
            </div>

            {/* Itinerario y Qué Incluye */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border border-sand/15 bg-obsidian p-5">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                  // HITOS DEL ITINERARIO
                </h3>
                <ul className="mt-3 space-y-2.5 font-mono text-xs text-sand/85">
                  {(idioma === "es"
                    ? fichaActiva.hitosItinerarioEs
                    : fichaActiva.hitosItinerarioEn
                  ).map((hito, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">
                        0{i + 1}.
                      </span>
                      <span>{hito}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/70">
                  <span className="flex items-center gap-1.5 text-sand font-bold">
                    <MapPin className="h-3.5 w-3.5 text-terracotta" />
                    PUNTO DE ENCUENTRO:
                  </span>
                  <span className="mt-1 block">
                    {idioma === "es"
                      ? fichaActiva.puntoEncuentroEs
                      : fichaActiva.puntoEncuentroEn}
                  </span>
                </div>
              </div>

              <div className="border border-sand/15 bg-obsidian p-5">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  // QUÉ INCLUYE TU EXPEDICIÓN
                </h3>
                <ul className="mt-3 space-y-2.5 font-mono text-xs text-sand/85">
                  {(idioma === "es"
                    ? fichaActiva.incluyeEs
                    : fichaActiva.incluyeEn
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bloque de Checkout Comercial y Selección de Salida */}
            <div className="mt-8 border-t-2 border-terracotta bg-jungle/15 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-2xl sm:text-3xl uppercase text-sand">
                  {idioma === "es"
                    ? "CHECKOUT & EMISIÓN DE PERMISO DE INGRESO"
                    : "EXPEDITION CHECKOUT & PERMIT ISSUANCE"}
                </h3>
                <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  CUPO GARANTIZADO EN TIEMPO REAL
                </span>
              </div>

              {/* Paso 1: Fecha y Horario */}
              <div className="mt-5">
                <label className="block font-mono text-xs uppercase tracking-wider text-sand/75">
                  1. SELECCIONA FECHA DE SALIDA PROGRAMADA:
                </label>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {horariosModal.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setHorarioSeleccionadoId(h.id);
                        setResultadoReserva(null);
                      }}
                      className={`border p-3.5 text-left font-mono text-xs transition-colors ${
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
                          CUPOS RESTANTES:{" "}
                          <strong className="text-emerald-400">
                            {h.cuposDisponibles}
                          </strong>{" "}
                          DE {h.capacidadTotal}
                        </span>
                        <span>{formatearCop(h.precioUnitarioCop)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paso 2: Datos del Expedicionario Principal con Validación Visual */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="checkout-cupos"
                    className="block font-mono text-[11px] uppercase text-sand/70"
                  >
                    VIAJEROS
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Users className="h-4 w-4 text-terracotta" />
                    <input
                      id="checkout-cupos"
                      type="number"
                      min={1}
                      max={16}
                      value={cantidadCupos}
                      onChange={(e) => {
                        setCantidadCupos(
                          Math.max(1, parseInt(e.target.value || "1", 10))
                        );
                        setErroresCheckout((prev) => ({
                          ...prev,
                          cupos: undefined,
                        }));
                      }}
                      className={`w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                        erroresCheckout.cupos
                          ? "border-terracotta"
                          : "border-sand/30 focus:border-terracotta"
                      }`}
                    />
                  </div>
                  {erroresCheckout.cupos && (
                    <span className="mt-1 block font-mono text-[10px] text-terracotta">
                      {erroresCheckout.cupos}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-nombre"
                    className="block font-mono text-[11px] uppercase text-sand/70"
                  >
                    EXPEDICIONARIO TITULAR
                  </label>
                  <input
                    id="checkout-nombre"
                    type="text"
                    value={nombreViajero}
                    onChange={(e) => {
                      setNombreViajero(e.target.value);
                      setErroresCheckout((prev) => ({
                        ...prev,
                        nombre: undefined,
                      }));
                    }}
                    className={`mt-1.5 w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                      erroresCheckout.nombre
                        ? "border-terracotta"
                        : "border-sand/30 focus:border-terracotta"
                    }`}
                  />
                  {erroresCheckout.nombre && (
                    <span className="mt-1 block font-mono text-[10px] text-terracotta">
                      {erroresCheckout.nombre}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-doc"
                    className="block font-mono text-[11px] uppercase text-sand/70"
                  >
                    DOCUMENTO / PASAPORTE
                  </label>
                  <input
                    id="checkout-doc"
                    type="text"
                    value={documentoViajero}
                    onChange={(e) => {
                      setDocumentoViajero(e.target.value);
                      setErroresCheckout((prev) => ({
                        ...prev,
                        documento: undefined,
                      }));
                    }}
                    className={`mt-1.5 w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                      erroresCheckout.documento
                        ? "border-terracotta"
                        : "border-sand/30 focus:border-terracotta"
                    }`}
                  />
                  {erroresCheckout.documento && (
                    <span className="mt-1 block font-mono text-[10px] text-terracotta">
                      {erroresCheckout.documento}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block font-mono text-[11px] uppercase text-sand/70"
                  >
                    EMAIL DE CONFIRMACIÓN
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={emailViajero}
                    onChange={(e) => {
                      setEmailViajero(e.target.value);
                      setErroresCheckout((prev) => ({
                        ...prev,
                        email: undefined,
                      }));
                    }}
                    className={`mt-1.5 w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                      erroresCheckout.email
                        ? "border-terracotta"
                        : "border-sand/30 focus:border-terracotta"
                    }`}
                  />
                  {erroresCheckout.email && (
                    <span className="mt-1 block font-mono text-[10px] text-terracotta">
                      {erroresCheckout.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Casilla de Consentimiento Habeas Data (Ley 1581 de 2012) */}
              <div className="mt-4">
                <label className="flex items-start gap-2.5 font-mono text-xs text-sand/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaHabeasData}
                    onChange={(e) => {
                      setAceptaHabeasData(e.target.checked);
                      setErroresCheckout((prev) => ({
                        ...prev,
                        habeasData: undefined,
                      }));
                    }}
                    className="mt-0.5 h-4 w-4 accent-terracotta"
                  />
                  <span>
                    Autorizo el tratamiento de mis datos personales conforme a la{" "}
                    <Link
                      href="/privacidad"
                      className="text-terracotta underline hover:text-sand"
                    >
                      Ley 1581 de 2012 (Política de Privacidad)
                    </Link>{" "}
                    y acepto los{" "}
                    <Link
                      href="/terminos"
                      className="text-terracotta underline hover:text-sand"
                    >
                      Términos y Condiciones RNT
                    </Link>
                    .
                  </span>
                </label>
                {erroresCheckout.habeasData && (
                  <span className="mt-1 block font-mono text-[11px] text-terracotta">
                    {erroresCheckout.habeasData}
                  </span>
                )}
              </div>

              {/* Resumen de Pago */}
              <div className="mt-5 border border-sand/20 bg-obsidian p-4 font-mono text-xs">
                <div className="flex justify-between text-sand/75">
                  <span>
                    Expedición ({cantidadCupos} x{" "}
                    {formatearCop(actividadSeleccionada.precioCop)})
                  </span>
                  <span>
                    {formatearCop(
                      actividadSeleccionada.precioCop * cantidadCupos
                    )}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between text-emerald-400">
                  <span>
                    Tasa Ambiental Parques Nacionales / Contribución Comunitaria
                  </span>
                  <span>INCLUIDA ($0 COP)</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-sand/15 pt-3 text-sm font-bold text-sand">
                  <span>TOTAL A PAGAR</span>
                  <span className="text-lg text-terracotta">
                    {formatearCop(
                      actividadSeleccionada.precioCop * cantidadCupos
                    )}
                  </span>
                </div>
              </div>

              {/* Botón de Confirmación */}
              <button
                type="button"
                disabled={procesandoReserva}
                onClick={manejarConfirmarCheckout}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>
                  {procesandoReserva
                    ? "EMITIENDO CÓDIGO DE RESERVA Y PERMISOS..."
                    : "CONFIRMAR Y EMITIR RESERVA DE EXPEDICIÓN"}
                </span>
              </button>

              {/* Voucher / Resultado de Reserva */}
              {resultadoReserva && (
                <div
                  className={`mt-5 border p-5 font-mono text-xs ${
                    resultadoReserva.exito
                      ? "border-emerald-400 bg-emerald-950/35 text-sand"
                      : "border-terracotta bg-terracotta/15 text-sand"
                  }`}
                >
                  {resultadoReserva.exito && resultadoReserva.reserva ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/30 pb-3">
                        <span className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                          <CheckCircle2 className="h-5 w-5" />
                          RESERVA CONFIRMADA · CÓDIGO{" "}
                          {resultadoReserva.reserva.codigoReserva}
                        </span>
                        <span className="bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                          ESTADO: {resultadoReserva.reserva.estadoReserva}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px] text-sand/85">
                        <div>
                          <span className="block text-sand/50">TITULAR:</span>
                          <strong>
                            {nombreViajero} ({documentoViajero})
                          </strong>
                        </div>
                        <div>
                          <span className="block text-sand/50">
                            CUPOS ASEGURADOS:
                          </span>
                          <strong>
                            {resultadoReserva.reserva.cantidadCupos}{" "}
                            Expedicionarios
                          </strong>
                        </div>
                        <div>
                          <span className="block text-sand/50">
                            MONTO TOTAL:
                          </span>
                          <strong>
                            {formatearCop(
                              resultadoReserva.reserva.montoTotalCop
                            )}
                          </strong>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-emerald-300">
                        Hemos enviado las coordenadas GPS de encuentro y tu
                        póliza de ingreso a <strong>{emailViajero}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 font-bold text-terracotta">
                        <XCircle className="h-4 w-4" />
                        <span>CUPO COMPLETO EN LA FECHA SELECCIONADA</span>
                      </div>
                      <p className="mt-1.5 text-sand/85">
                        {resultadoReserva.errorMensaje}
                      </p>
                      <p className="mt-2 text-amber-300">
                        <strong>SALIDA ALTERNATIVA DISPONIBLE:</strong>{" "}
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
          SECCIÓN 3: BAQUIANO AI — CONCIERGE DE EXPEDICIONES
      ====================================================================== */}
      <section
        id="baquiano-ai"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              <CompassIcon className="h-4 w-4" />
              <span>// 02 · BAQUIANO AI — CONCIERGE DE EXPEDICIONES</span>
            </div>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "CURADURÍA INTELIGENTE DE TRAVESÍAS"
                : "BESPOKE EXPEDITION CONCIERGE"}
            </h2>
          </div>

          <p className="max-w-md font-mono text-xs text-sand/70 leading-relaxed">
            {idioma === "es"
              ? "Nuestro baquiano digital cruza tu estilo de exploración con el clima actual en la Sierra Nevada y el flujo real de cada sendero."
              : "Our digital concierge matches your exploration style with live Sierra Nevada weather and real-time trail occupancy."}
          </p>
        </div>

        {/* Selector de Perfil de Viajero: Estilo, Presupuesto y Ritmo */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6 border border-sand/20 bg-jungle/15 p-4 sm:p-6">
            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                1. ELIGE TU ESTILO DE EXPEDICIÓN
              </span>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {(Object.keys(ESTILOS_BAQUIANO) as EstiloViajeId[]).map(
                  (id) => {
                    const item = ESTILOS_BAQUIANO[id];
                    const activo = estiloViaje === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          manejarConsultarBaquiano(id, presupuesto, ritmo)
                        }
                        className={`border p-3.5 text-left transition-colors ${
                          activo
                            ? "border-terracotta bg-terracotta/15 text-sand"
                            : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                        }`}
                      >
                        <div className="font-mono text-xs font-bold uppercase">
                          {idioma === "es" ? item.tituloEs : item.tituloEn}
                        </div>
                        <div className="mt-1 font-mono text-[10px] text-sand/60 leading-snug">
                          {idioma === "es" ? item.subEs : item.subEn}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Presupuesto por Viajero */}
            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                2. RANGO DE INVERSIÓN POR VIAJERO
              </span>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                {[
                  {
                    id: "ESENCIAL" as PresupuestoId,
                    labelEs: "ESENCIAL (<$260K)",
                    labelEn: "ESSENTIAL (<$260K)",
                  },
                  {
                    id: "COMPLETO" as PresupuestoId,
                    labelEs: "JORNADA (<$400K)",
                    labelEn: "FULL DAY (<$400K)",
                  },
                  {
                    id: "SIGNATURE" as PresupuestoId,
                    labelEs: "SIGNATURE / TEYUNA",
                    labelEn: "SIGNATURE / ALL",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      manejarConsultarBaquiano(estiloViaje, p.id, ritmo)
                    }
                    className={`border py-2.5 px-2 uppercase transition-colors ${
                      presupuesto === p.id
                        ? "border-sand bg-sand text-obsidian font-bold"
                        : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                    }`}
                  >
                    {idioma === "es" ? p.labelEs : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Ritmo de Marcha */}
            <div>
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                3. RITMO DE MARCHA EN TERRENO
              </span>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                {[
                  {
                    id: "CONTEMPLATIVO" as RitmoId,
                    labelEs: "CONTEMPLATIVO",
                    labelEn: "RELAXED",
                  },
                  {
                    id: "ACTIVO" as RitmoId,
                    labelEs: "PASO ACTIVO",
                    labelEn: "ACTIVE PACE",
                  },
                  {
                    id: "DESAFIO" as RitmoId,
                    labelEs: "DESAFÍO CUMBRE",
                    labelEn: "SUMMIT TREK",
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      manejarConsultarBaquiano(estiloViaje, presupuesto, r.id)
                    }
                    className={`border py-2.5 px-2 uppercase transition-colors ${
                      ritmo === r.id
                        ? "border-terracotta bg-terracotta text-sand font-bold"
                        : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                    }`}
                  >
                    {idioma === "es" ? r.labelEs : r.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={ejecutandoIa}
              onClick={() =>
                manejarConsultarBaquiano(estiloViaje, presupuesto, ritmo)
              }
              className="w-full flex items-center justify-center gap-2 bg-sand px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${ejecutandoIa ? "animate-spin" : ""}`}
              />
              <span>
                {ejecutandoIa
                  ? "CONSULTANDO BAQUIANO AI..."
                  : "RECALCULAR RUTA IDEAL"}
              </span>
            </button>
          </div>

          {/* Resultados Curados por Baquiano AI */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Nota Editorial de Contexto Climático */}
              <div className="border border-sand/20 bg-obsidian p-4 font-mono text-xs text-sand/85">
                <div className="flex flex-wrap items-center justify-between gap-2 text-terracotta font-bold uppercase">
                  <span>NOTA DEL BAQUIANO AI · CLIMA ACTUAL {tempActual}°C</span>
                  <span>HUMEDAD {humedadActual}%</span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  {idioma === "es"
                    ? ESTILOS_BAQUIANO[estiloViaje].notaEditorialEs
                    : ESTILOS_BAQUIANO[estiloViaje].notaEditorialEn}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                {recomendacionesVisibles.map((rec, idx) => (
                  <div
                    key={rec.actividadId}
                    className="flex flex-col justify-between border border-sand/20 bg-obsidian p-5 hover:border-terracotta/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="bg-terracotta px-2.5 py-0.5 font-bold text-sand">
                          #{idx + 1} · {rec.puntajeAfinidad}% AFINIDAD
                        </span>
                        <span className="text-sand/60">
                          {rec.altitudMsnm}m
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl uppercase text-sand">
                        {idioma === "es" ? rec.nombreEs : rec.nombreEn}
                      </h3>
                      <div className="mt-1 font-mono text-[11px] text-terracotta">
                        {rec.ubicacion}
                      </div>

                      <div className="mt-4 border-l-2 border-emerald-400 bg-jungle/25 p-3 font-mono text-[11px] leading-relaxed text-sand/90">
                        {idioma === "es"
                          ? rec.explicacionEs
                          : rec.explicacionEn}
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
                          if (act) abrirDrawerExpedicion(act);
                        }}
                        className="text-terracotta hover:underline uppercase font-bold"
                      >
                        {idioma === "es" ? "ABRIR FICHA ->" : "OPEN ->"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acordeón Opcional Discreto: "Ver razonamiento del motor" */}
            <div className="mt-6 border-t border-sand/15 pt-4">
              <button
                type="button"
                onClick={() =>
                  setMostrarRazonamientoMotor(!mostrarRazonamientoMotor)
                }
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-sand/50 hover:text-sand transition-colors"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    mostrarRazonamientoMotor ? "rotate-180" : ""
                  }`}
                />
                <span>
                  {idioma === "es"
                    ? "Ver razonamiento del motor"
                    : "View engine reasoning"}
                </span>
              </button>

              {mostrarRazonamientoMotor && resultadoIa && (
                <div className="mt-3 border border-sand/15 bg-obsidian p-4 font-mono text-[11px] text-sand/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sand/10">
                    <span>
                      PIPELINE DE DECISIÓN VECTORIAL ({resultadoIa.correlacionId})
                    </span>
                    <span className="text-emerald-400">
                      MODO: {resultadoIa.nivelIaAplicado}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {resultadoIa.trazaEstados.map((estado, i) => (
                      <React.Fragment key={estado}>
                        <span className="border border-sand/20 bg-jungle/20 px-2.5 py-1 text-[10px] text-sand">
                          {estado}
                        </span>
                        {i < resultadoIa.trazaEstados.length - 1 && (
                          <span className="text-terracotta">-&gt;</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 4: PULSO DEL TERRITORIO Y CONSERVACIÓN DE ECOSISTEMAS
      ====================================================================== */}
      <section
        id="sostenibilidad"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-sand/15 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // 03 · COMPROMISO DE CONSERVACIÓN · SIERRA NEVADA &amp; PARQUE TAYRONA
            </div>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl uppercase tracking-tight text-sand">
              PULSO DE LOS ECOSISTEMAS EN VIVO
            </h2>
          </div>
          <div className="font-mono text-xs text-sand/70">
            MONITOREO SATELITAL Y EN SENDERO PARA UN TURISMO REGENERATIVO
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          FOOTER COMERCIAL CON PÁGINAS LEGALES (LEY 1581) + ENLACE DISCRETO /LAB
      ====================================================================== */}
      <footer className="mx-auto max-w-[1440px] border-x border-sand/15 px-4 py-10 sm:px-6 font-mono text-xs text-sand/60">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="font-bold text-sand">TYRONAWILDS™</span> // SANTA
            MARTA D.T.C.H., COLOMBIA · EXPEDICIONES DE ALTA MONTAÑA Y CARIBE
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/operadores"
              className="font-bold text-sand hover:text-terracotta transition-colors"
            >
              Portal de Operadores RNT
            </Link>
            <Link
              href="/privacidad"
              className="hover:text-terracotta transition-colors"
            >
              Privacidad &amp; Habeas Data (Ley 1581)
            </Link>
            <Link
              href="/terminos"
              className="hover:text-terracotta transition-colors"
            >
              Términos RNT &amp; PNN
            </Link>
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
