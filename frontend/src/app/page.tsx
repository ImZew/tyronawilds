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
  Smartphone,
  Landmark,
  QrCode,
  Zap,
  ShieldAlert,
  RotateCcw,
  Compass as CompassIcon,
  ChevronLeft,
  ArrowRight,
  Layers,
  Play,
  Pause,
  Thermometer,
  Droplets,
  Gauge,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  ACOMPANANTES_DEMO_POOL,
  ACTORES_SESION,
  ActividadTuristica,
  ContextoTerritorial,
  DisponibilidadHorario,
  EscenarioDemoCheckout,
  Idioma,
  IndicadorCapacidadDestino,
  MetodoPagoWompi,
  PasajeroExpedicion,
  RespuestaCrearReserva,
  ResultadoRecomendacionIa,
  SEED_ACTIVIDADES,
  SesionAutenticada,
  cerrarSesion,
  consultarMisReservas,
  convertirSesionAActor,
  crearReservaTransaccional,
  ejecutarRecomendacionIa,
  obtenerCatalogoOfertas,
  obtenerContextoTerritorial,
  obtenerDisponibilidades,
  obtenerFichaTecnicaExpedicion,
  obtenerIndicadoresCapacidad,
  obtenerSesionActual,
  validarIntegridadGrupoPasajeros,
} from "@/lib/api";
import { registrarEventoAnalitica } from "@/lib/analytics";
import PasaporteExpedicionQr from "@/components/PasaporteExpedicionQr";

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
  acompanantes?: Record<number, { nombre?: string; documento?: string }>;
  integridadGrupo?: {
    httpStatus?: number;
    codigo?: string;
    mensaje: string;
  };
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

interface DestinoHeroItem {
  id: string;
  codigoServicio: number;
  nombreSelectorEs: string;
  nombreSelectorEn: string;
  ubicacionAltitudEs: string;
  ubicacionAltitudEn: string;
  tituloEditorialEs: string;
  tituloEditorialEn: string;
  duracionEs: string;
  duracionEn: string;
  climaNivelEs: string;
  climaNivelEn: string;
  precioDesde: string;
  fraseEs: string;
  fraseEn: string;
  imagen: string;
  fallbackImagen: string;
}

const DESTINOS_HERO: DestinoHeroItem[] = [
  {
    id: "01",
    codigoServicio: 102,
    nombreSelectorEs: "Parque Tayrona",
    nombreSelectorEn: "Tayrona Park",
    ubicacionAltitudEs: "CARIBE COLOMBIANO · SANTA MARTA · 0 - 150 MSNM",
    ubicacionAltitudEn: "COLOMBIAN CARIBBEAN · SANTA MARTA · 0 - 150 MASL",
    tituloEditorialEs: "Parque Nacional Tayrona",
    tituloEditorialEn: "Tayrona National Park",
    duracionEs: "1 día completo",
    duracionEn: "1 full day",
    climaNivelEs: "29°C · Caminata suave",
    climaNivelEn: "29°C · Easy walk",
    precioDesde: "Desde $290.000",
    fraseEs:
      "Donde los senderos de piedra ancestral y la selva húmeda tropical desembocan en el azul turquesa cristalino de Cabo San Juan del Guía.",
    fraseEn:
      "Where ancient stone trails and tropical rainforest meet the crystal-clear turquoise waters of Cabo San Juan del Guia.",
    imagen: "/images/destinos/tayrona.jpg",
    fallbackImagen: "/images/destinos/tayrona.jpg",
  },
  {
    id: "02",
    codigoServicio: 9,
    nombreSelectorEs: "Ciudad Perdida",
    nombreSelectorEn: "Lost City",
    ubicacionAltitudEs: "SIERRA NEVADA DE SANTA MARTA · 1.200 MSNM",
    ubicacionAltitudEn: "SIERRA NEVADA DE SANTA MARTA · 1,200 MASL",
    tituloEditorialEs: "Teyuna: Ciudad Perdida",
    tituloEditorialEn: "Teyuna: The Lost City",
    duracionEs: "4 días en selva",
    duracionEn: "4-day trek",
    climaNivelEs: "22°C · Reto de montaña",
    climaNivelEn: "22°C · Mountain trek",
    precioDesde: "Desde $1.850.000",
    fraseEs:
      "Camina junto a baquianos locales y guías indígenas hacia las 169 terrazas sagradas construidas hace más de mil años en el corazón de la Sierra.",
    fraseEn:
      "Walk alongside local and indigenous guides to the 169 sacred stone terraces built over a thousand years ago in the heart of the Sierra.",
    imagen: "/images/destinos/teyuna.jpg",
    fallbackImagen: "/images/destinos/teyuna.jpg",
  },
  {
    id: "03",
    codigoServicio: 103,
    nombreSelectorEs: "Minca",
    nombreSelectorEn: "Minca",
    ubicacionAltitudEs: "PIEDEMONTE DE SANTA MARTA · 650 MSNM",
    ubicacionAltitudEn: "SANTA MARTA FOOTHILLS · 650 MASL",
    tituloEditorialEs: "Minca: Bosque de Niebla",
    tituloEditorialEn: "Minca: Cloud Forest",
    duracionEs: "8 horas",
    duracionEn: "8 hours",
    climaNivelEs: "23°C · Para todos",
    climaNivelEn: "23°C · All levels",
    precioDesde: "Desde $210.000",
    fraseEs:
      "Cascadas de agua pura entre montañas verdes, fincas de café orgánico de sombra y más de trescientas especies de aves al amanecer.",
    fraseEn:
      "Pure mountain waterfalls among lush green hills, organic shade-grown coffee estates, and over three hundred bird species at dawn.",
    imagen: "/images/destinos/minca.jpg",
    fallbackImagen: "/images/destinos/minca.jpg",
  },
  {
    id: "04",
    codigoServicio: 105,
    nombreSelectorEs: "Sierra Nevada",
    nombreSelectorEn: "Sierra Nevada",
    ubicacionAltitudEs: "ALTA MONTAÑA DEL CARIBE · 3.100 MSNM",
    ubicacionAltitudEn: "CARIBBEAN HIGH PEAKS · 3,100 MASL",
    tituloEditorialEs: "Cumbres de la Sierra Nevada",
    tituloEditorialEn: "Peaks of the Sierra Nevada",
    duracionEs: "1 a 2 días",
    duracionEn: "1 to 2 days",
    climaNivelEs: "12°C · Caminata amigable",
    climaNivelEn: "12°C · Friendly hike",
    precioDesde: "Desde $245.000",
    fraseEs:
      "Contempla el amanecer sobre un mar de nubes desde Cerro Kennedy frente a los picos nevados Colón y Bolívar junto al mar Caribe.",
    fraseEn:
      "Watch the sunrise above a sea of clouds from Cerro Kennedy facing the snowcapped Colón and Bolívar peaks right beside the Caribbean Sea.",
    imagen: "/images/destinos/sierra.jpg",
    fallbackImagen: "/images/destinos/sierra.jpg",
  },
];

type PisoTermicoFiltro = "TODOS" | "LITORAL" | "SELVA_HUMEDA" | "ALTA_MONTANA";

interface NodoTopografico {
  id: string;
  codigoServicio: number;
  nombre: string;
  region: string;
  pisoTermico: "LITORAL" | "SELVA_HUMEDA" | "ALTA_MONTANA";
  pisoLabelEs: string;
  pisoLabelEn: string;
  altitudMsnm: number;
  duracionEs: string;
  duracionEn: string;
  nivelEs: string;
  nivelEn: string;
  precioDesde: string;
  svgPos: { x: number; y: number };
  tempCelsius: number;
  cuposDisponibles: number;
  descripcionEs: string;
  descripcionEn: string;
  imagen: string;
  fallbackImagen: string;
}

const PISOS_TERMICOS_OPCIONES: Array<{
  id: PisoTermicoFiltro;
  labelEs: string;
  labelEn: string;
}> = [
  {
    id: "TODOS",
    labelEs: "Todos los destinos",
    labelEn: "All destinations",
  },
  {
    id: "LITORAL",
    labelEs: "Playas y Ríos",
    labelEn: "Beaches & Rivers",
  },
  {
    id: "SELVA_HUMEDA",
    labelEs: "Bosque y Café",
    labelEn: "Forest & Coffee",
  },
  {
    id: "ALTA_MONTANA",
    labelEs: "Alta Montaña",
    labelEn: "High Mountains",
  },
];

const NODOS_TOPOGRAFICOS: NodoTopografico[] = [
  {
    id: "tayrona",
    codigoServicio: 102,
    nombre: "Parque Tayrona · Cabo San Juan",
    region: "Costa Caribe",
    pisoTermico: "LITORAL",
    pisoLabelEs: "Playa y Selva Costera",
    pisoLabelEn: "Beach & Coastal Forest",
    altitudMsnm: 45,
    duracionEs: "1 día completo",
    duracionEn: "1 full day",
    nivelEs: "Caminata suave",
    nivelEn: "Easy walk",
    precioDesde: "$290.000",
    svgPos: { x: 43, y: 27 },
    tempCelsius: 29,
    cuposDisponibles: 18,
    descripcionEs:
      "Senderos sombreados que desembocan en las bahías de aguas turquesa más icónicas del Caribe colombiano.",
    descripcionEn:
      "Shaded trails leading into the most iconic turquoise bays of the Colombian Caribbean.",
    imagen: "/images/destinos/tayrona.jpg",
    fallbackImagen: "/images/destinos/tayrona.jpg",
  },
  {
    id: "don-diego",
    codigoServicio: 105,
    nombre: "Río Don Diego · Encuentro con el Mar",
    region: "Piedemonte Caribe",
    pisoTermico: "LITORAL",
    pisoLabelEs: "Río y Naturaleza",
    pisoLabelEn: "River & Nature",
    altitudMsnm: 80,
    duracionEs: "7 horas",
    duracionEn: "7 hours",
    nivelEs: "Muy suave",
    nivelEn: "Very easy",
    precioDesde: "$245.000",
    svgPos: { x: 78, y: 28 },
    tempCelsius: 28,
    cuposDisponibles: 22,
    descripcionEs:
      "Descenso sereno en kayak por aguas cristalinas rodeadas de monos aulladores hasta tocar las olas del mar.",
    descripcionEn:
      "Serene kayak float down crystal-clear waters surrounded by howler monkeys all the way to the ocean surf.",
    imagen: "/images/destinos/dondiego.jpg",
    fallbackImagen: "/images/destinos/dondiego.jpg",
  },
  {
    id: "minca",
    codigoServicio: 103,
    nombre: "Minca · Cascadas de Marinka",
    region: "Bosque de Niebla",
    pisoTermico: "SELVA_HUMEDA",
    pisoLabelEs: "Cascadas y Café Orgánico",
    pisoLabelEn: "Waterfalls & Organic Coffee",
    altitudMsnm: 650,
    duracionEs: "8 horas",
    duracionEn: "8 hours",
    nivelEs: "Para todos",
    nivelEn: "All levels",
    precioDesde: "$210.000",
    svgPos: { x: 22, y: 55 },
    tempCelsius: 23,
    cuposDisponibles: 28,
    descripcionEs:
      "Pozos naturales de agua fresca, fincas cafeteras tradicionales y avistamiento de tucanes y colibríes.",
    descripcionEn:
      "Refreshing natural waterfall pools, traditional coffee estates, and toucan and hummingbird watching.",
    imagen: "/images/destinos/minca.jpg",
    fallbackImagen: "/images/destinos/minca.jpg",
  },
  {
    id: "teyuna",
    codigoServicio: 9,
    nombre: "Ciudad Perdida · Teyuna",
    region: "Corazón de la Sierra",
    pisoTermico: "SELVA_HUMEDA",
    pisoLabelEs: "Arqueología y Selva",
    pisoLabelEn: "Archaeology & Jungle",
    altitudMsnm: 1200,
    duracionEs: "4 días / 3 noches",
    duracionEn: "4 days / 3 nights",
    nivelEs: "Reto de montaña",
    nivelEn: "Mountain trek",
    precioDesde: "$1.850.000",
    svgPos: { x: 67, y: 56 },
    tempCelsius: 20,
    cuposDisponibles: 12,
    descripcionEs:
      "La gran travesía hacia las 169 terrazas circulares de piedra en el corazón sagrado de la Sierra Nevada.",
    descripcionEn:
      "The iconic multi-day trek to 169 circular stone terraces in the sacred heart of the Sierra Nevada.",
    imagen: "/images/destinos/teyuna.jpg",
    fallbackImagen: "/images/destinos/teyuna.jpg",
  },
  {
    id: "cerro-kennedy",
    codigoServicio: 105,
    nombre: "Sierra Nevada · Cerro Kennedy",
    region: "Mirador de Cumbres",
    pisoTermico: "ALTA_MONTANA",
    pisoLabelEs: "Mirador de Glaciares",
    pisoLabelEn: "Glacier Viewpoint",
    altitudMsnm: 3100,
    duracionEs: "2 días / 1 noche",
    duracionEn: "2 days / 1 night",
    nivelEs: "Caminata media",
    nivelEn: "Moderate hike",
    precioDesde: "$340.000",
    svgPos: { x: 47, y: 80 },
    tempCelsius: 11,
    cuposDisponibles: 14,
    descripcionEs:
      "El balcón natural más imponente del Caribe para contemplar los picos nevados Colón y Bolívar al amanecer.",
    descripcionEn:
      "The most breathtaking natural balcony in the Caribbean facing the snowcapped Colón and Bolívar peaks at dawn.",
    imagen: "/images/destinos/sierra.jpg",
    fallbackImagen: "/images/destinos/sierra.jpg",
  },
];

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
  const [misReservasCount, setMisReservasCount] = useState<number>(0);
  const [destinoHeroIndex, setDestinoHeroIndex] = useState<number>(0);
  const [heroEnPausa, setHeroEnPausa] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);
  const [pisoSeleccionado, setPisoSeleccionado] =
    useState<PisoTermicoFiltro>("TODOS");
  const [nodoActivoId, setNodoActivoId] = useState<string>("tayrona");
  const [vistaMapa3D, setVistaMapa3D] = useState<boolean>(true);
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Barra rápida de reserva debajo del Hero
  const [reservaRapidaCodigo, setReservaRapidaCodigo] = useState<number>(102);
  const [reservaRapidaFecha, setReservaRapidaFecha] =
    useState<string>("2026-11-18");
  const [reservaRapidaViajeros, setReservaRapidaViajeros] =
    useState<number>(2);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (heroEnPausa) return;
    const interval = setInterval(() => {
      setDestinoHeroIndex((prev) => (prev + 1) % DESTINOS_HERO.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [heroEnPausa]);

  useEffect(() => {
    const actualizarSesion = () => setSesionUsuario(obtenerSesionActual());
    actualizarSesion();
    window.addEventListener("tyronawilds-auth-change", actualizarSesion);
    return () =>
      window.removeEventListener("tyronawilds-auth-change", actualizarSesion);
  }, []);

  const sincronizarContadorMisReservas = useCallback(async () => {
    const sesion = obtenerSesionActual();
    if (!sesion || sesion.rol !== "TURISTA") {
      setMisReservasCount(0);
      return;
    }
    const res = await consultarMisReservas();
    setMisReservasCount(res.data.length);
  }, []);

  useEffect(() => {
    sincronizarContadorMisReservas();
    window.addEventListener(
      "tyronawilds-reservas-change",
      sincronizarContadorMisReservas
    );
    return () =>
      window.removeEventListener(
        "tyronawilds-reservas-change",
        sincronizarContadorMisReservas
      );
  }, [sesionUsuario, sincronizarContadorMisReservas]);

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

  // Drawer de Producto Completo + Checkout Comercial en 3 Pasos con Pasarela Wompi Sandbox
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<ActividadTuristica | null>(null);
  const [indiceFotoActiva, setIndiceFotoActiva] = useState<number>(0);
  const [pasoCheckout, setPasoCheckout] = useState<1 | 2 | 3>(1);
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] =
    useState<string>("");
  const [cantidadCupos, setCantidadCupos] = useState<number>(2);
  const [nombreViajero, setNombreViajero] = useState<string>("Sebastián Abaonza");
  const [emailViajero, setEmailViajero] = useState<string>(
    "sebastian@viajero.co"
  );
  const [documentoViajero, setDocumentoViajero] =
    useState<string>("CC 1083019450");
  const [acompanantes, setAcompanantes] = useState<
    Array<{ nombre: string; documento: string }>
  >([{ nombre: "Camila Restrepo", documento: "CC 1083112045" }]);
  const [aceptaHabeasData, setAceptaHabeasData] = useState<boolean>(true);
  const [erroresCheckout, setErroresCheckout] =
    useState<ErroresFormularioCheckout>({});

  // Ajustar dinámicamente el listado de acompañantes (#2..#N) cuando cambia cantidadCupos
  useEffect(() => {
    const numAcompanantes = Math.max(
      0,
      Math.min(15, (Number.isInteger(cantidadCupos) ? cantidadCupos : 1) - 1)
    );
    setAcompanantes((prev) => {
      if (prev.length === numAcompanantes) return prev;
      if (prev.length > numAcompanantes) return prev.slice(0, numAcompanantes);
      const nuevos = [...prev];
      for (let i = prev.length; i < numAcompanantes; i++) {
        const sugerido = ACOMPANANTES_DEMO_POOL[i % ACOMPANANTES_DEMO_POOL.length];
        nuevos.push({
          nombre: sugerido.nombre,
          documento: sugerido.documento,
        });
      }
      return nuevos;
    });
  }, [cantidadCupos]);

  // Estado de Pasarela Wompi Sandbox (Paso 2)
  const [metodoPagoWompi, setMetodoPagoWompi] =
    useState<MetodoPagoWompi>("NEQUI");
  const [celularNequi, setCelularNequi] = useState<string>("3005550199");
  const [estadoPushNequi, setEstadoPushNequi] = useState<
    "IDLE" | "ENVIANDO" | "APROBADO"
  >("IDLE");
  const [bancoPse, setBancoPse] = useState<string>("Nu Colombia");
  const [tipoPersonaPse, setTipoPersonaPse] = useState<"NATURAL" | "JURIDICA">(
    "NATURAL"
  );
  const [documentoPse, setDocumentoPse] = useState<string>("1082940182");
  const [numeroTarjeta, setNumeroTarjeta] = useState<string>(
    "4242 4242 4242 4242"
  );
  const [expiracionTarjeta, setExpiracionTarjeta] = useState<string>("12/28");
  const [cvcTarjeta, setCvcTarjeta] = useState<string>("842");
  const [cuotasTarjeta, setCuotasTarjeta] = useState<string>("1");
  const [escenarioDemo, setEscenarioDemo] =
    useState<EscenarioDemoCheckout>("EXITO_201");
  const [errorPagoWompi, setErrorPagoWompi] = useState<string | null>(null);

  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);
  const [resultadoReserva, setResultadoReserva] =
    useState<RespuestaCrearReserva | null>(null);

  // Sincronizar automáticamente datos del expedicionario si hay sesión JWT activa
  useEffect(() => {
    if (sesionUsuario) {
      setNombreViajero(sesionUsuario.nombre);
      setEmailViajero(sesionUsuario.email);
      if (sesionUsuario.documento) {
        setDocumentoViajero(sesionUsuario.documento);
      }
    }
  }, [sesionUsuario]);

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
    setPasoCheckout(1);
    setResultadoReserva(null);
    setErroresCheckout({});
    setErrorPagoWompi(null);
    setEstadoPushNequi("IDLE");
    setEscenarioDemo("EXITO_201");
    setCantidadCupos(2);
    setAcompanantes([
      {
        nombre: ACOMPANANTES_DEMO_POOL[0].nombre,
        documento: ACOMPANANTES_DEMO_POOL[0].documento,
      },
    ]);

    if (sesionUsuario) {
      setNombreViajero(sesionUsuario.nombre);
      setEmailViajero(sesionUsuario.email);
      if (sesionUsuario.documento) {
        setDocumentoViajero(sesionUsuario.documento);
      }
    }

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

  const nodoActivo =
    NODOS_TOPOGRAFICOS.find((n) => n.id === nodoActivoId) ||
    NODOS_TOPOGRAFICOS[0];

  const manejarReservaHero = () => {
    const dest = DESTINOS_HERO[destinoHeroIndex];
    const act =
      actividades.find((a) => a.codigoServicio === dest.codigoServicio) ||
      actividades[0];
    if (act) {
      abrirDrawerExpedicion(act);
    }
  };

  const manejarReservaNodo = (nodo: NodoTopografico) => {
    const act =
      actividades.find((a) => a.codigoServicio === nodo.codigoServicio) ||
      actividades[0];
    if (act) {
      abrirDrawerExpedicion(act);
    }
  };

  const manejarReservaRapida = () => {
    const act =
      actividades.find((a) => a.codigoServicio === reservaRapidaCodigo) ||
      actividades[0];
    if (act) {
      abrirDrawerExpedicion(act);
      setCantidadCupos(
        Math.max(1, Math.min(16, Number(reservaRapidaViajeros) || 2))
      );
    }
  };

  // Construir arreglo nominal completo de pasajeros (Titular #1 + Acompañantes #2..#N)
  const construirListaPasajerosActual = (): PasajeroExpedicion[] => {
    const titular: PasajeroExpedicion = {
      nombre: (sesionUsuario?.nombre || nombreViajero).trim(),
      documento: (sesionUsuario?.documento || documentoViajero).trim(),
      esTitular: true,
    };
    const numAcompanantes = Math.max(0, cantidadCupos - 1);
    const listaAcomp: PasajeroExpedicion[] = acompanantes
      .slice(0, numAcompanantes)
      .map((a) => ({
        nombre: a.nombre.trim(),
        documento: a.documento.trim(),
        esTitular: false,
      }));
    return [titular, ...listaAcomp];
  };

  // Autocompletar 1-Clic Datos del Viajero Titular y todos los Acompañantes #2..#N (Paso 1)
  const autocompletarDatosViajeroDemo = () => {
    const cuposActuales =
      Number.isInteger(cantidadCupos) && cantidadCupos >= 1 && cantidadCupos <= 16
        ? cantidadCupos
        : 2;
    setCantidadCupos(cuposActuales);
    setNombreViajero(sesionUsuario?.nombre || "Sebastián Abaonza");
    setEmailViajero(sesionUsuario?.email || "sebastian@viajero.co");
    setDocumentoViajero(sesionUsuario?.documento || "CC 1083019450");

    const numAcompanantes = Math.max(0, cuposActuales - 1);
    const nuevosAcompanantes = Array.from(
      { length: numAcompanantes },
      (_, idx) => {
        const demo = ACOMPANANTES_DEMO_POOL[idx % ACOMPANANTES_DEMO_POOL.length];
        return {
          nombre: demo.nombre,
          documento: demo.documento,
        };
      }
    );
    setAcompanantes(nuevosAcompanantes);
    setAceptaHabeasData(true);
    setErroresCheckout({});
  };

  // Autocompletar 1-Clic Datos de Prueba en Pasarela Wompi Sandbox (Paso 2)
  const autocompletarMetodoWompiDemo = (metodo: MetodoPagoWompi) => {
    setMetodoPagoWompi(metodo);
    setErrorPagoWompi(null);
    if (metodo === "NEQUI") {
      setCelularNequi("3005550199");
      setEstadoPushNequi("IDLE");
    } else if (metodo === "PSE") {
      setBancoPse("Nu Colombia");
      setTipoPersonaPse("NATURAL");
      setDocumentoPse("1082940182");
    } else {
      setNumeroTarjeta("4242 4242 4242 4242");
      setExpiracionTarjeta("12/28");
      setCvcTarjeta("842");
      setCuotasTarjeta("1");
    }
  };

  // Validación estricta campo por campo + 3 reglas de integridad de identidad civil (Paso 1)
  const validarFormularioCheckout = (): boolean => {
    const nuevosErrores: ErroresFormularioCheckout = {};
    const nombreLimpio = (sesionUsuario?.nombre || nombreViajero).trim();
    const docLimpio = (sesionUsuario?.documento || documentoViajero).trim();
    const emailLimpio = (sesionUsuario?.email || emailViajero).trim();
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

    const numAcompanantes = Math.max(0, cantidadCupos - 1);
    const erroresAcomp: Record<number, { nombre?: string; documento?: string }> =
      {};
    for (let i = 0; i < numAcompanantes; i++) {
      const item = acompanantes[i] || { nombre: "", documento: "" };
      const nomA = item.nombre.trim();
      const docA = item.documento.trim();
      const errItem: { nombre?: string; documento?: string } = {};
      if (nomA.length < 4 || /[<>]/.test(nomA)) {
        errItem.nombre = `Ingresa el nombre completo del acompañante #${i + 2}.`;
      }
      if (docA.length < 5 || /[<>]/.test(docA)) {
        errItem.documento = `Ingresa un documento válido para el acompañante #${i + 2}.`;
      }
      if (errItem.nombre || errItem.documento) {
        erroresAcomp[i] = errItem;
      }
    }
    if (Object.keys(erroresAcomp).length > 0) {
      nuevosErrores.acompanantes = erroresAcomp;
    }

    // Si los campos básicos están completos, validar las 3 reglas de integridad de dominio
    if (Object.keys(nuevosErrores).length === 0 && actividadSeleccionada) {
      const horariosAct = disponibilidades.filter(
        (d) => d.actividadId === actividadSeleccionada.id
      );
      const dispActual =
        horariosAct.find((d) => d.id === horarioSeleccionadoId) ||
        horariosAct[0] ||
        null;
      const pasajerosGrupo = construirListaPasajerosActual();
      const resultadoIntegridad = validarIntegridadGrupoPasajeros(
        pasajerosGrupo,
        dispActual
      );

      if (!resultadoIntegridad.valido && resultadoIntegridad.mensajeError) {
        nuevosErrores.integridadGrupo = {
          httpStatus: resultadoIntegridad.httpStatus,
          codigo: resultadoIntegridad.codigoError,
          mensaje: resultadoIntegridad.mensajeError,
        };
      }
    }

    setErroresCheckout(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const avanzarAPaso2Wompi = () => {
    if (!actividadSeleccionada) return;
    if (!validarFormularioCheckout()) {
      registrarEventoAnalitica("CHECKOUT_VALIDATION_ERROR", {
        codigoServicio: actividadSeleccionada.codigoServicio,
      });
      return;
    }
    setErrorPagoWompi(null);
    setResultadoReserva(null);
    setPasoCheckout(2);
  };

  // Ejecutar Pago Wompi Sandbox + Reserva ACID conectada al backend (Paso 2 -> Paso 3)
  const manejarConfirmarCheckout = async () => {
    if (!actividadSeleccionada) return;
    if (!validarFormularioCheckout()) {
      setPasoCheckout(1);
      return;
    }

    setErrorPagoWompi(null);
    let detalleInstrumento = "";

    if (metodoPagoWompi === "NEQUI") {
      const celLimpio = celularNequi.replace(/\s+/g, "");
      if (!/^\d{10}$/.test(celLimpio)) {
        setErrorPagoWompi(
          "Ingresa un número celular Nequi de 10 dígitos (ej. 3005550199)."
        );
        return;
      }
      detalleInstrumento = `Nequi Push Aprobado · ${celLimpio}`;
    } else if (metodoPagoWompi === "PSE") {
      if (!documentoPse.trim() || documentoPse.trim().length < 5) {
        setErrorPagoWompi(
          "Ingresa el documento del titular bancario para débito PSE."
        );
        return;
      }
      detalleInstrumento = `PSE Débito · ${bancoPse} (${tipoPersonaPse})`;
    } else {
      const digitosTarjeta = numeroTarjeta.replace(/\s+/g, "");
      if (digitosTarjeta.length < 15 || cvcTarjeta.trim().length < 3) {
        setErrorPagoWompi(
          "Completa los datos de la tarjeta Sandbox (ej. 4242 4242 4242 4242 · CVC 842)."
        );
        return;
      }
      detalleInstrumento = `Tarjeta Sandbox ·••• ${digitosTarjeta.slice(-4)} (${cuotasTarjeta} cuota${cuotasTarjeta === "1" ? "" : "s"})`;
    }

    const horariosAct = disponibilidades.filter(
      (d) => d.actividadId === actividadSeleccionada.id
    );
    const disp =
      horariosAct.find((d) => d.id === horarioSeleccionadoId) ||
      horariosAct[0];
    if (!disp) return;

    setProcesandoReserva(true);
    setResultadoReserva(null);

    if (metodoPagoWompi === "NEQUI") {
      setEstadoPushNequi("ENVIANDO");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setEstadoPushNequi("APROBADO");
    } else {
      await new Promise((resolve) => setTimeout(resolve, 750));
    }

    const actorEfectivo = convertirSesionAActor(sesionUsuario);
    const pasajerosGrupo = construirListaPasajerosActual();
    const respuesta = await crearReservaTransaccional(
      actorEfectivo,
      disp,
      cantidadCupos,
      {
        nombreViajero: pasajerosGrupo[0].nombre,
        documentoViajero: pasajerosGrupo[0].documento,
        emailViajero: (sesionUsuario?.email || emailViajero).trim(),
        pasajeros: pasajerosGrupo,
        metodoPago: metodoPagoWompi,
        detalleMetodoPago: detalleInstrumento,
        escenarioDemo,
        actividad: actividadSeleccionada,
      }
    );
    setResultadoReserva(respuesta);

    if (respuesta.exito && respuesta.reserva) {
      registrarEventoAnalitica("CHECKOUT_CONVERSION", {
        codigoReserva: respuesta.reserva.codigoReserva,
        referenciaWompi: respuesta.reserva.referenciaPagoWompi || "WMP-SANDBOX",
        metodoPago: metodoPagoWompi,
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
      setPasoCheckout(3);
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

  const destActual = DESTINOS_HERO[destinoHeroIndex];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF8F5] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 selection:bg-[#EA580C] selection:text-white font-sans transition-colors duration-300">
      {/* =====================================================================
          BARRA SUPERIOR GLOBAL (CRISTALINA SOBRE EL HERO / BLANCO MARFIL EN SCROLL)
      ====================================================================== */}
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      {/* =====================================================================
          SECCIÓN 1: HERO 100% PANTALLA COMPLETA DE ALTO IMPACTO VISUAL
          Inspirado en colombia.travel/es — Fotografía Real Full-Bleed + 4 Tarjetas Interactivas
      ====================================================================== */}
      <section
        id="hero"
        aria-label="Destinos Emblemáticos de Santa Marta y la Sierra Nevada"
        className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between"
        onMouseEnter={() => setHeroEnPausa(true)}
        onMouseLeave={() => setHeroEnPausa(false)}
      >
        {/* Fondo Fotográfico 100% Full-Bleed con Transición Suave (scale + opacity 700ms) */}
        <div className="absolute inset-0 z-0 bg-[#065F46]">
          {DESTINOS_HERO.map((dest, idx) => {
            const activo = idx === destinoHeroIndex;
            return (
              <div
                key={dest.id}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  activo
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105 pointer-events-none"
                }`}
              >
                <img
                  src={dest.imagen}
                  alt={dest.tituloEditorialEs}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== dest.fallbackImagen) {
                      target.src = dest.fallbackImagen;
                    }
                  }}
                  className="h-full w-full object-cover object-center brightness-105 contrast-[1.03]"
                />
              </div>
            );
          })}

          {/* Degradados Direccionales Suaves para Legibilidad Nítida sin Apagar la Foto */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Contenido Principal del Hero (Izquierda Editorial + Derecha Carrusel de 4 Tarjetas Verticales) */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-4 pt-28 pb-10 sm:px-8 lg:pt-32 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-8 lg:gap-10">
            {/* LADO IZQUIERDO DEL HERO */}
            <div className="lg:col-span-7 space-y-5">
              {/* Etiqueta Tipo Píldora Luminosa con Ubicación y Altitud Amigable */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-md border border-white/25 shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-[#FBBF24]" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                  {idioma === "es"
                    ? destActual.ubicacionAltitudEs
                    : destActual.ubicacionAltitudEn}
                </span>
              </div>

              {/* Título Editorial Grande e Imponente del Destino Activo */}
              <h1
                key={`hero-title-${destActual.id}`}
                className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.02] drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-all duration-500"
              >
                {idioma === "es"
                  ? destActual.tituloEditorialEs
                  : destActual.tituloEditorialEn}
              </h1>

              {/* Descripción Breve e Inspiradora de 2 Líneas */}
              <p className="max-w-2xl text-base sm:text-lg text-white/95 leading-relaxed line-clamp-2 drop-shadow">
                {idioma === "es" ? destActual.fraseEs : destActual.fraseEn}
              </p>

              {/* 3 Insignias Claras: Duración, Clima/Nivel y Precio Desde */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/25 px-4 py-2 text-xs sm:text-sm font-semibold text-white">
                  <Clock className="h-4 w-4 text-[#FBBF24]" />
                  <span>
                    {idioma === "es"
                      ? destActual.duracionEs
                      : destActual.duracionEn}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/25 px-4 py-2 text-xs sm:text-sm font-semibold text-white">
                  <Sun className="h-4 w-4 text-[#38BDF8]" />
                  <span>
                    {idioma === "es"
                      ? destActual.climaNivelEs
                      : destActual.climaNivelEn}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#065F46]/90 backdrop-blur-md border border-[#FBBF24]/50 px-4 py-2 text-xs sm:text-sm font-bold text-[#FBBF24]">
                  <span>{destActual.precioDesde} COP</span>
                </span>
              </div>

              {/* Botón Principal Vibrante Coral/Ámbar (#EA580C) + Botón Secundario Glassmorphism Blanco */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={manejarReservaHero}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-[#EA580C] hover:bg-[#D97706] px-7 py-4 text-sm sm:text-base font-bold text-white shadow-[0_14px_34px_rgba(234,88,12,0.42)] transition-all duration-300"
                >
                  <span>
                    {idioma === "es"
                      ? "Reservar experiencia"
                      : "Book experience"}
                  </span>
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>

                <Link
                  href="/baquiano"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/35 backdrop-blur-md px-6 py-4 text-sm sm:text-base font-bold text-white transition-all"
                >
                  <Sparkles className="h-4 w-4 text-[#FBBF24]" />
                  <span>
                    {idioma === "es"
                      ? "Consultar a Baquiano IA"
                      : "Ask Baquiano AI"}
                  </span>
                </Link>
              </div>
            </div>

            {/* LADO DERECHO INFERIOR DEL HERO (ESTILO COLOMBIA.TRAVEL):
                Carrusel Horizontal de 4 Tarjetas Verticales Interactivas */}
            <div className="lg:col-span-5">
              <div className="mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/90">
                <span>
                  {idioma === "es"
                    ? "Explora los 4 paisajes de Santa Marta"
                    : "Explore Santa Marta's 4 landscapes"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setDestinoHeroIndex(
                        (prev) =>
                          (prev - 1 + DESTINOS_HERO.length) %
                          DESTINOS_HERO.length
                      )
                    }
                    className="rounded-full bg-white/15 hover:bg-white/30 border border-white/25 p-1.5 text-white backdrop-blur-md transition-colors"
                    aria-label="Destino anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDestinoHeroIndex(
                        (prev) => (prev + 1) % DESTINOS_HERO.length
                      )
                    }
                    className="rounded-full bg-white/15 hover:bg-white/30 border border-white/25 p-1.5 text-white backdrop-blur-md transition-colors"
                    aria-label="Siguiente destino"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DESTINOS_HERO.map((card, idx) => {
                  const activa = idx === destinoHeroIndex;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setDestinoHeroIndex(idx)}
                      className={`group relative h-44 sm:h-52 w-full overflow-hidden rounded-2xl text-left transition-all duration-500 ${
                        activa
                          ? "ring-2 ring-[#FBBF24] border-2 border-white scale-[1.03] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                          : "border border-white/25 opacity-80 hover:opacity-100 hover:scale-[1.01]"
                      }`}
                    >
                      <img
                        src={card.imagen}
                        alt={card.nombreSelectorEs}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== card.fallbackImagen) {
                            target.src = card.fallbackImagen;
                          }
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            activa
                              ? "bg-[#EA580C] text-white"
                              : "bg-black/45 text-white/90 backdrop-blur-sm"
                          }`}
                        >
                          {card.id}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <div className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow">
                          {idioma === "es"
                            ? card.nombreSelectorEs
                            : card.nombreSelectorEn}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-[#FBBF24]">
                          {card.precioDesde}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =================================================================
              BASE DEL HERO: BARRA BUSCADORA / RESERVA RÁPIDA FLOTANTE EN BLANCO (#FFFFFF)
          ================================================================== */}
          <div className="mt-8 w-full rounded-3xl bg-white p-4 sm:p-5 text-[#0F172A] shadow-[0_24px_60px_rgba(15,23,42,0.28)] border border-[#0F172A]/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
              {/* Destino */}
              <div className="rounded-2xl bg-[#FAF8F5] px-4 py-2.5 border border-[#0F172A]/10">
                <label
                  htmlFor="quick-destino"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#065F46]"
                >
                  {idioma === "es" ? "Destino a explorar" : "Destination"}
                </label>
                <select
                  id="quick-destino"
                  value={reservaRapidaCodigo}
                  onChange={(e) =>
                    setReservaRapidaCodigo(Number(e.target.value))
                  }
                  className="mt-0.5 w-full bg-transparent text-sm font-bold text-[#0F172A] focus:outline-none"
                >
                  <option value={102}>Parque Tayrona · Cabo San Juan</option>
                  <option value={9}>Ciudad Perdida · Teyuna (4 Días)</option>
                  <option value={103}>Minca · Bosque de Niebla y Café</option>
                  <option value={105}>Río Don Diego &amp; Sierra Nevada</option>
                  <option value={104}>Bahía Concha &amp; Isla Aguja</option>
                </select>
              </div>

              {/* Fecha */}
              <div className="rounded-2xl bg-[#FAF8F5] px-4 py-2.5 border border-[#0F172A]/10">
                <label
                  htmlFor="quick-fecha"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#065F46]"
                >
                  {idioma === "es" ? "Fecha de salida" : "Departure date"}
                </label>
                <input
                  id="quick-fecha"
                  type="date"
                  value={reservaRapidaFecha}
                  onChange={(e) => setReservaRapidaFecha(e.target.value)}
                  className="mt-0.5 w-full bg-transparent text-sm font-bold text-[#0F172A] focus:outline-none"
                />
              </div>

              {/* Viajeros */}
              <div className="rounded-2xl bg-[#FAF8F5] px-4 py-2.5 border border-[#0F172A]/10">
                <label
                  htmlFor="quick-viajeros"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#065F46]"
                >
                  {idioma === "es" ? "Número de viajeros" : "Travelers"}
                </label>
                <div className="mt-0.5 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0D9488]" />
                  <select
                    id="quick-viajeros"
                    value={reservaRapidaViajeros}
                    onChange={(e) =>
                      setReservaRapidaViajeros(Number(e.target.value))
                    }
                    className="w-full bg-transparent text-sm font-bold text-[#0F172A] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "viajero" : "viajeros"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Acción 1 Clic */}
              <button
                type="button"
                onClick={manejarReservaRapida}
                className="h-full min-h-[3.5rem] w-full rounded-2xl bg-[#EA580C] hover:bg-[#D97706] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#EA580C]/25 transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {idioma === "es"
                    ? "Reservar en 1 clic"
                    : "Book in 1 click"}
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 2: TARJETAS EDITORIALES ESTILO REVISTA DE VIAJES (FONDO #FAF8F5)
          Fotografías Reales Verificadas de Santa Marta, Precio Transparente y Reserva Directa
      ====================================================================== */}
      <section
        aria-label="Colección Editorial de Destinos en Santa Marta"
        className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#065F46]/10 dark:bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#065F46] dark:text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              <span>
                {idioma === "es"
                  ? "Revista de Destinos · Caribe & Sierra Nevada"
                  : "Destination Magazine · Caribbean & Sierra Nevada"}
              </span>
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
              {idioma === "es"
                ? "Experiencias reales entre el mar y las cumbres"
                : "Authentic experiences between sea and summits"}
            </h2>
          </div>

          <Link
            href="/expediciones"
            className="inline-flex items-center gap-2 rounded-full bg-[#065F46] hover:bg-[#0D9488] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors self-start md:self-auto"
          >
            <span>
              {idioma === "es"
                ? "Ver catálogo completo de expediciones"
                : "View full expedition catalog"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DESTINOS_HERO.map((dest) => {
            const actAsociada =
              actividades.find(
                (a) => a.codigoServicio === dest.codigoServicio
              ) || actividades[0];

            return (
              <article
                key={`mag-${dest.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-[#0F172A]/10 dark:border-slate-800 shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
              >
                <div>
                  {/* Fotografía Real Verificada de Alta Luminosidad */}
                  <div className="relative h-64 w-full overflow-hidden bg-[#F3EFE6] dark:bg-slate-800">
                    <img
                      src={dest.imagen}
                      alt={dest.tituloEditorialEs}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== dest.fallbackImagen) {
                          target.src = dest.fallbackImagen;
                        }
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-slate-900/95 px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-emerald-400 shadow-sm">
                      {idioma === "es" ? dest.duracionEs : dest.duracionEn}
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-[#0F172A]/85 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      {idioma === "es" ? dest.climaNivelEs : dest.climaNivelEn}
                    </div>
                  </div>

                  {/* Contenido Editorial */}
                  <div className="p-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-teal-400">
                      {idioma === "es"
                        ? dest.ubicacionAltitudEs
                        : dest.ubicacionAltitudEn}
                    </div>
                    <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-white group-hover:text-[#065F46] dark:group-hover:text-emerald-400 transition-colors">
                      {idioma === "es"
                        ? dest.tituloEditorialEs
                        : dest.tituloEditorialEn}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#0F172A]/75 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {idioma === "es" ? dest.fraseEs : dest.fraseEn}
                    </p>
                  </div>
                </div>

                {/* Pie de Tarjeta con Precio Transparente y Reserva Directa */}
                <div className="px-6 pb-6 pt-4 border-t border-[#0F172A]/10 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0F172A]/55 dark:text-slate-400">
                      {idioma === "es" ? "Tarifa oficial" : "Official rate"}
                    </span>
                    <span className="text-lg font-extrabold text-[#065F46] dark:text-emerald-400">
                      {dest.precioDesde}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (actAsociada) abrirDrawerExpedicion(actAsociada);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EA580C] hover:bg-[#D97706] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
                  >
                    <span>{idioma === "es" ? "Reservar" : "Book"}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 3: MAQUETA TOPOGRÁFICA 3D INTERACTIVA DE LA SIERRA NEVADA Y EL CARIBE
          Perspectiva 3D Real (perspective: 1200px, preserve-3d), Capas Z y Pines Elevados
      ====================================================================== */}
      <section
        id="cartografia"
        aria-label="Maqueta Topográfica 3D Interactiva de Santa Marta y la Sierra Nevada"
        className="w-full bg-[#F3EFE6] dark:bg-slate-900/90 py-16 sm:py-20 border-y border-[#0F172A]/10 dark:border-slate-800 transition-colors"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0284C7]/10 dark:bg-sky-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0284C7] dark:text-sky-400">
                <Layers className="h-3.5 w-3.5" />
                <span>
                  {idioma === "es"
                    ? "Maqueta Topográfica 3D Interactiva"
                    : "Interactive 3D Topographic Relief Map"}
                </span>
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                {idioma === "es"
                  ? "Del Arrecife Coralino a las Cumbres Nevadas"
                  : "From Coral Reefs to Snowcapped Summits"}
              </h2>
            </div>

            {/* Selector Amigable por Tipo de Paisaje */}
            <div className="flex flex-wrap items-center gap-2">
              {PISOS_TERMICOS_OPCIONES.map((opc) => {
                const activo = pisoSeleccionado === opc.id;
                return (
                  <button
                    key={opc.id}
                    type="button"
                    onClick={() => {
                      setPisoSeleccionado(opc.id);
                      if (opc.id !== "TODOS") {
                        const primero = NODOS_TOPOGRAFICOS.find(
                          (n) => n.pisoTermico === opc.id
                        );
                        if (primero) setNodoActivoId(primero.id);
                      }
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      activo
                        ? "bg-[#065F46] text-white shadow-sm"
                        : "bg-white dark:bg-slate-800 text-[#0F172A]/80 dark:text-slate-200 hover:bg-[#065F46]/10 border border-[#0F172A]/10 dark:border-slate-700"
                    }`}
                  >
                    {idioma === "es" ? opc.labelEs : opc.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Diorama Topográfico 3D Multicapa de Alta Precisión + Vista Satelital/Híbrida 2D */}
            <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 text-[#0F172A] dark:text-white shadow-lg border border-[#0F172A]/10 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#0F172A]/75 dark:text-slate-300 pb-4 border-b border-[#0F172A]/10 dark:border-slate-800">
                <span>
                  {vistaMapa3D
                    ? idioma === "es"
                      ? "Diorama 3D de 7 cotas topográficas · Inclina con el cursor o elige un nodo"
                      : "7-layer 3D topographic diorama · Tilt with cursor or select a node"
                    : idioma === "es"
                    ? "Cartografía Satelital/Híbrida 2D · Retícula GPS, radios de distancia y tiempos desde Santa Marta"
                    : "2D Satellite/Hybrid Cartography · GPS grid, distance rings & travel times from Santa Marta"}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-[#0284C7] dark:text-sky-400 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0284C7]" />
                    Litoral 0–100m
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#0D9488] dark:text-teal-400 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
                    Bosque 650–1.200m
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#065F46] dark:text-emerald-400 font-bold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#065F46]" />
                    Cumbres 3.100m+
                  </span>
                </div>
              </div>

              {/* Escenario de Perspectiva 3D Real / Cartografía Satelital 2D */}
              <div
                className="relative my-4 w-full aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-b from-[#041E30] via-[#0A2738] to-[#071A14] border border-[#0F172A]/15 dark:border-slate-700 select-none"
                style={{ perspective: "1300px" }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const normX =
                    ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                  const normY =
                    ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                  setMouseTilt({
                    x: Math.round(normX * 8 * 10) / 10,
                    y: Math.round(-normY * 6 * 10) / 10,
                  });
                }}
                onMouseLeave={() => setMouseTilt({ x: 0, y: 0 })}
              >
                <style>{`
                  @keyframes waveFoamDiorama {
                    0%, 100% { stroke-dashoffset: 0; opacity: 0.55; }
                    50% { stroke-dashoffset: -28; opacity: 0.92; }
                  }
                  @keyframes riverFlowDiorama {
                    to { stroke-dashoffset: -140; }
                  }
                  @keyframes routeParticleDiorama {
                    to { stroke-dashoffset: -96; }
                  }
                  @keyframes cloudDriftDiorama {
                    0%, 100% { transform: translate3d(0px, 0px, 95px); }
                    50% { transform: translate3d(20px, -6px, 95px); }
                  }
                `}</style>

                {/* Control en Esquina para Alternar entre "Vista Relieve 3D" y "Vista Satelital/Aérea 2D" */}
                <div className="absolute top-3.5 right-3.5 z-40 flex items-center gap-1.5 rounded-full bg-slate-950/85 p-1 backdrop-blur-md border border-white/20 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setVistaMapa3D(true)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                      vistaMapa3D
                        ? "bg-[#EA580C] text-white shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {idioma === "es" ? "Vista Relieve 3D" : "3D Relief View"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaMapa3D(false)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                      !vistaMapa3D
                        ? "bg-[#0284C7] text-white shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {idioma === "es"
                      ? "Vista Satelital/Aérea 2D"
                      : "2D Satellite/Aerial"}
                  </button>
                </div>

                {/* Indicador de Enfoque e Inclinación en Esquina Superior Izquierda */}
                <div className="pointer-events-none absolute top-3.5 left-3.5 z-40 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 text-[11px] font-bold text-white backdrop-blur-md border border-white/15">
                  <Mountain className="h-3.5 w-3.5 text-[#FBBF24]" />
                  <span>
                    {vistaMapa3D
                      ? `DIORAMA 3D · ${nodoActivo.altitudMsnm} MSNM`
                      : `SATELITAL 2D · 11°14'N 74°12'W · ${nodoActivo.altitudMsnm}M`}
                  </span>
                </div>

                {vistaMapa3D ? (
                  /* =========================================================
                     MODO 1: DIORAMA TOPOGRÁFICO 3D MULTICAPA DE ALTA PRECISIÓN
                     Corte geológico de terreno + Batimetría + 7 cotas SVG + Ríos + Pines Holográficos
                  ========================================================== */
                  (() => {
                    const focusOffsetX = (50 - nodoActivo.svgPos.x) * 0.1;
                    const focusOffsetY = (50 - nodoActivo.svgPos.y) * 0.08;
                    const rotX = 46 + mouseTilt.y;
                    const rotZ = -7 + mouseTilt.x;

                    return (
                      <div
                        className="relative h-full w-full transition-transform duration-500 ease-out"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: `translate3d(${focusOffsetX}%, ${focusOffsetY}%, 0px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(0.91)`,
                        }}
                      >
                        {/* CORTE GEOLÓGICO / GROSOR DE CORTEZA TERRESTRE EN 3D (Bordes inferiores y laterales) */}
                        <div
                          className="pointer-events-none absolute inset-3 rounded-2xl"
                          style={{
                            transform: "translate3d(6px, 14px, -14px)",
                            background:
                              "linear-gradient(135deg, #1E293B 0%, #334155 45%, #475569 75%, #0F172A 100%)",
                            boxShadow:
                              "0 36px 70px rgba(0,0,0,0.85), inset 0 -6px 0 #78350F, inset 0 -12px 0 #451A03",
                          }}
                        />

                        {/* BASE OCEÁNICA Y BATIMETRÍA MARINA + LÍNEA DE COSTA ORGÁNICA (translateZ(0px)) */}
                        <div
                          className="absolute inset-3 rounded-2xl overflow-hidden border border-sky-300/35 border-b-[12px] border-r-[8px] border-b-[#3B2F2F] border-r-[#27272A]"
                          style={{
                            transform: "translateZ(0px)",
                            background:
                              "linear-gradient(180deg, #032B44 0%, #0369A1 22%, #0284C7 38%, #0E7490 50%, #064E3B 100%)",
                          }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full"
                            preserveAspectRatio="none"
                          >
                            {/* Batimetría profunda del Mar Caribe */}
                            <path
                              d="M 0,0 L 1000,0 L 1000,130 C 850,155 720,108 580,128 C 430,148 310,105 180,135 C 95,152 40,175 0,185 Z"
                              fill="#075985"
                              fillOpacity="0.92"
                            />
                            {/* Plataforma de arrecifes coralinos (Taganga, Cabo San Juan, Bahía Concha) */}
                            <path
                              d="M 0,115 C 85,130 140,195 215,172 C 285,150 355,115 435,132 C 510,148 560,118 655,138 C 755,158 860,145 1000,172 L 1000,265 L 0,265 Z"
                              fill="#06B6D4"
                              fillOpacity="0.65"
                            />
                            {/* Masa Continental Base (Playas, Bahía de Santa Marta, Taganga, Ensenadas Tayrona y Desembocadura Don Diego) */}
                            <path
                              d="M 0,248 C 48,242 75,212 108,218 C 138,224 152,188 188,184 C 225,180 250,204 292,190 C 338,174 372,148 422,154 C 468,160 498,182 548,172 C 612,160 668,175 735,168 C 795,162 835,188 892,182 C 942,178 972,192 1000,198 L 1000,620 L 0,620 Z"
                              fill="#115E59"
                            />
                            {/* Espuma de Olas Animada bordeando Bahía de Santa Marta, Taganga y Cabo San Juan */}
                            <path
                              d="M 0,242 C 48,236 75,206 108,212 C 138,218 152,182 188,178 C 225,174 250,198 292,184 C 338,168 372,142 422,148 C 468,154 498,176 548,166 C 612,154 668,169 735,162 C 795,156 835,182 892,176 C 942,172 972,186 1000,192"
                              fill="none"
                              stroke="#E0F2FE"
                              strokeWidth="3.5"
                              strokeDasharray="16 10"
                              style={{
                                animation:
                                  "waveFoamDiorama 4.2s ease-in-out infinite",
                              }}
                            />
                            {/* Etiqueta Marina Ubicada Arriba a la Izquierda lejos de los Pines */}
                            <text
                              x="36"
                              y="44"
                              fill="#BAE6FD"
                              fontSize="13"
                              fontWeight="800"
                              letterSpacing="3"
                            >
                              MAR CARIBE · BATIMETRÍA CORALINA (0 MSNM)
                            </text>
                            <text
                              x="44"
                              y="228"
                              fill="#A7F3D0"
                              fontSize="10"
                              fontWeight="700"
                              letterSpacing="1.5"
                            >
                              BAHÍA STA. MARTA &amp; TAGANGA
                            </text>
                          </svg>
                        </div>

                        {/* ===================================================
                            7 CAPAS SVG DE CURVAS DE NIVEL TOPOGRÁFICAS ORGÁNICAS (translateZ(8px) -> translateZ(85px))
                        ==================================================== */}

                        {/* CAPA TOPOGRÁFICA 1: translateZ(8px) · Piedemonte Costero y Bosque Seco (100m - 300m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(8px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 42,282 C 125,248 210,235 315,212 C 415,190 520,205 635,196 C 745,188 855,212 958,236 C 972,340 964,485 942,592 L 58,592 C 36,490 32,368 42,282 Z"
                              fill="#0F766E"
                              fillOpacity="0.9"
                              stroke="#5EEAD4"
                              strokeWidth="1.6"
                              strokeOpacity="0.55"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 2: translateZ(20px) · Selva Húmeda Baja y Cuencas Fluviales (400m - 750m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(20px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_11px_15px_rgba(0,0,0,0.5)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 88,326 C 175,292 268,265 372,254 C 475,242 585,252 695,246 C 792,240 875,274 914,322 C 928,412 918,505 896,574 L 104,574 C 82,502 74,398 88,326 Z"
                              fill="#0D9488"
                              fillOpacity="0.88"
                              stroke="#99F6E4"
                              strokeWidth="1.6"
                              strokeOpacity="0.6"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 3: translateZ(33px) · Bosque de Niebla Minca y Cañón del Buritaca (900m - 1.400m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(33px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_14px_18px_rgba(0,0,0,0.55)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 142,368 C 228,328 320,304 422,298 C 525,292 632,302 732,312 C 808,320 852,358 862,408 C 870,468 855,522 835,556 L 164,556 C 142,512 128,425 142,368 Z"
                              fill="#047857"
                              fillOpacity="0.92"
                              stroke="#6EE7B7"
                              strokeWidth="1.8"
                              strokeOpacity="0.68"
                            />
                            {/* Terrazas Arqueológicas de Teyuna (Ciudad Perdida) */}
                            <circle
                              cx="670"
                              cy="348"
                              r="34"
                              fill="none"
                              stroke="#FBBF24"
                              strokeWidth="1.8"
                              strokeDasharray="5 4"
                              strokeOpacity="0.8"
                            />
                            <circle
                              cx="670"
                              cy="348"
                              r="19"
                              fill="none"
                              stroke="#FDE68A"
                              strokeWidth="1.8"
                              strokeOpacity="0.9"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 4: translateZ(46px) · Serranía de San Lorenzo y Alto Buritaca (1.800m - 2.400m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(46px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_16px_20px_rgba(0,0,0,0.58)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 205,412 C 282,374 368,352 465,346 C 562,340 658,354 734,382 C 782,400 804,442 792,488 C 782,522 752,542 715,544 L 245,544 C 212,528 192,458 205,412 Z"
                              fill="#065F46"
                              fillOpacity="0.95"
                              stroke="#A7F3D0"
                              strokeWidth="1.9"
                              strokeOpacity="0.72"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 5: translateZ(60px) · Cuchilla de Cerro Kennedy y Páramo de Macotama (2.800m - 3.600m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(60px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.62)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 278,448 C 342,412 415,392 495,388 C 578,384 652,402 698,436 C 724,456 728,492 702,518 C 678,532 622,534 555,534 L 335,534 C 288,524 258,476 278,448 Z"
                              fill="#15803D"
                              fillOpacity="0.95"
                              stroke="#BEF264"
                              strokeWidth="2"
                              strokeOpacity="0.75"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 6: translateZ(73px) · Superpáramo Rocoso de la Sierra Nevada (4.200m - 5.000m) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(73px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_22px_26px_rgba(0,0,0,0.68)]"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M 348,474 C 398,438 452,418 512,416 C 572,414 624,434 648,468 C 662,488 648,512 612,520 L 385,520 C 352,512 332,492 348,474 Z"
                              fill="#334155"
                              fillOpacity="0.96"
                              stroke="#CBD5E1"
                              strokeWidth="2.2"
                              strokeOpacity="0.85"
                            />
                          </svg>
                        </div>

                        {/* CAPA TOPOGRÁFICA 7: translateZ(85px) · Glaciares y Cumbres Nevadas Colón y Bolívar (5.775m MSNM) */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(85px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full drop-shadow-[0_26px_30px_rgba(0,0,0,0.75)]"
                            preserveAspectRatio="none"
                          >
                            {/* Cumbre Pico Cristóbal Colón (5.775m) */}
                            <path
                              d="M 412,492 L 458,428 L 498,464 L 538,422 L 588,492 Z"
                              fill="#F8FAFC"
                              stroke="#38BDF8"
                              strokeWidth="2"
                            />
                            {/* Aristas de Hielo Glaciar */}
                            <path
                              d="M 458,428 L 442,472 L 474,462 Z"
                              fill="#E0F2FE"
                            />
                            <path
                              d="M 538,422 L 518,468 L 556,458 Z"
                              fill="#BAE6FD"
                            />
                          </svg>
                        </div>

                        {/* CAUDALES FLUVIALES SERPENTEANTES ANIMADOS (Río Don Diego y Río Buritaca) + RUTAS DE TREKKING */}
                        <div
                          className="pointer-events-none absolute inset-3"
                          style={{ transform: "translateZ(36px)" }}
                        >
                          <svg
                            viewBox="0 0 1000 620"
                            className="h-full w-full"
                            preserveAspectRatio="none"
                          >
                            {/* Caudal Río Buritaca (Nace cerca de Teyuna y desemboca al Caribe) */}
                            <path
                              d="M 545,455 C 585,410 635,375 652,325 C 668,275 632,225 648,168"
                              fill="none"
                              stroke="#38BDF8"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeOpacity="0.5"
                            />
                            <path
                              d="M 545,455 C 585,410 635,375 652,325 C 668,275 632,225 648,168"
                              fill="none"
                              stroke="#E0F2FE"
                              strokeWidth="2.5"
                              strokeDasharray="9 7"
                              strokeLinecap="round"
                              style={{
                                animation:
                                  "riverFlowDiorama 7.5s linear infinite",
                              }}
                            />

                            {/* Caudal Río Don Diego (Nace en las cumbres orientales y desemboca en Don Diego) */}
                            <path
                              d="M 615,465 C 675,412 728,365 758,295 C 778,245 785,208 792,172"
                              fill="none"
                              stroke="#06B6D4"
                              strokeWidth="6.5"
                              strokeLinecap="round"
                              strokeOpacity="0.55"
                            />
                            <path
                              d="M 615,465 C 675,412 728,365 758,295 C 778,245 785,208 792,172"
                              fill="none"
                              stroke="#ECFEFF"
                              strokeWidth="3"
                              strokeDasharray="11 8"
                              strokeLinecap="round"
                              style={{
                                animation:
                                  "riverFlowDiorama 6.5s linear infinite",
                              }}
                            />

                            {/* Rutas de Trekking Iluminadas con Partículas en Movimiento entre Nodos */}
                            <path
                              d="M 220,342 C 295,255 360,198 430,168 C 555,165 675,170 780,174"
                              fill="none"
                              stroke="#FBBF24"
                              strokeWidth="2.4"
                              strokeDasharray="7 7"
                              strokeOpacity="0.85"
                              style={{
                                animation:
                                  "routeParticleDiorama 8s linear infinite",
                              }}
                            />
                            <path
                              d="M 220,342 C 335,418 405,468 470,496 C 555,442 615,392 670,348"
                              fill="none"
                              stroke="#F97316"
                              strokeWidth="2.8"
                              strokeDasharray="8 6"
                              strokeOpacity="0.9"
                              style={{
                                animation:
                                  "routeParticleDiorama 7s linear infinite",
                              }}
                            />
                          </svg>
                        </div>

                        {/* Nubes Volumétricas Flotantes sobre la Sierra Nevada */}
                        <div
                          className="pointer-events-none absolute left-[16%] top-[46%] h-9 w-24 rounded-full bg-white/15 blur-md"
                          style={{
                            animation:
                              "cloudDriftDiorama 9s ease-in-out infinite",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute left-[54%] top-[68%] h-11 w-32 rounded-full bg-white/20 blur-md"
                          style={{
                            animation:
                              "cloudDriftDiorama 12s ease-in-out infinite reverse",
                          }}
                        />

                        {/* ===================================================
                            PINES VERTICALES 3D CON CONTRARROTACIÓN (transform: translateZ(55px) rotateX(-35deg))
                            Cero deformación y cero solapamiento con MAR CARIBE o entre destinos
                        ==================================================== */}
                        {NODOS_TOPOGRAFICOS.map((nodo) => {
                          const esActivo = nodoActivoId === nodo.id;
                          const visible =
                            pisoSeleccionado === "TODOS" ||
                            nodo.pisoTermico === pisoSeleccionado;

                          const elevacionPinZ =
                            nodo.pisoTermico === "LITORAL"
                              ? 55
                              : nodo.pisoTermico === "SELVA_HUMEDA"
                              ? 68
                              : 92;

                          const nombreCorto = nodo.nombre.split("·")[0].trim();

                          return (
                            <div
                              key={nodo.id}
                              style={{
                                left: `${nodo.svgPos.x}%`,
                                top: `${nodo.svgPos.y}%`,
                                transform: `translate(-50%, -100%) translateZ(${elevacionPinZ}px) rotateX(-35deg)`,
                                transformOrigin: "bottom center",
                                opacity: visible ? 1 : 0.28,
                              }}
                              className={`absolute transition-all duration-300 ${
                                esActivo ? "z-30" : "z-20 hover:z-30"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setNodoActivoId(nodo.id)}
                                className="group relative flex flex-col items-center focus:outline-none"
                              >
                                {/* Etiqueta Holográfica Vertical de Frente a la Cámara */}
                                <span
                                  className={`mb-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-extrabold shadow-[0_10px_25px_rgba(0,0,0,0.55)] transition-all ${
                                    esActivo
                                      ? "bg-[#EA580C] text-white ring-2 ring-white scale-105"
                                      : "bg-slate-950/90 text-white hover:bg-[#065F46] border border-white/25"
                                  }`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      esActivo
                                        ? "bg-white animate-ping"
                                        : nodo.pisoTermico === "LITORAL"
                                        ? "bg-[#38BDF8]"
                                        : nodo.pisoTermico === "SELVA_HUMEDA"
                                        ? "bg-[#2DD4BF]"
                                        : "bg-[#4ADE80]"
                                    }`}
                                  />
                                  <span>{nombreCorto}</span>
                                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-mono text-amber-200">
                                    {nodo.altitudMsnm}m
                                  </span>
                                </span>

                                {/* Pedestal / Vástago Vertical Holográfico */}
                                <span
                                  className={`w-[2px] transition-all ${
                                    esActivo
                                      ? "h-7 bg-gradient-to-b from-[#EA580C] to-amber-300 shadow-[0_0_10px_#EA580C]"
                                      : "h-5 bg-gradient-to-b from-white/90 to-emerald-300/60 group-hover:h-6"
                                  }`}
                                />

                                {/* Anillo de Anclaje sobre la Cota Topográfica */}
                                <span className="relative flex h-4 w-4 items-center justify-center">
                                  {esActivo && (
                                    <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#EA580C] opacity-65" />
                                  )}
                                  <span
                                    className={`relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white shadow ${
                                      esActivo ? "bg-[#EA580C]" : "bg-[#0D9488]"
                                    }`}
                                  />
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  /* =========================================================
                     MODO 2: VISTA SATELITAL / HÍBRIDA 2D CON RETÍCULA GPS, RADIOS DE DISTANCIA Y TIEMPOS
                  ========================================================== */
                  <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#041C2C]">
                    <svg
                      viewBox="0 0 1000 620"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                    >
                      {/* Fondo Satelital Híbrido Marino y Continental */}
                      <rect
                        x="0"
                        y="0"
                        width="1000"
                        height="620"
                        fill="#06283D"
                      />
                      <path
                        d="M 0,235 C 65,228 115,196 185,184 C 265,170 345,144 435,152 C 525,160 635,168 745,164 C 845,160 925,180 1000,192 L 1000,620 L 0,620 Z"
                        fill="#0A3628"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                      {/* Curvas Hipsométricas 2D */}
                      <path
                        d="M 95,320 C 235,265 445,245 695,252 C 825,256 895,310 905,435 L 95,565 Z"
                        fill="#0E4D38"
                        stroke="#34D399"
                        strokeWidth="1.2"
                        strokeDasharray="6 4"
                        strokeOpacity="0.55"
                      />
                      <path
                        d="M 225,415 C 345,355 545,345 715,395 C 765,435 745,515 685,535 L 265,535 Z"
                        fill="#14532D"
                        stroke="#86EFAC"
                        strokeWidth="1.2"
                        strokeOpacity="0.6"
                      />
                      <path
                        d="M 385,482 L 458,425 L 502,458 L 542,418 L 605,485 Z"
                        fill="#E2E8F0"
                        fillOpacity="0.85"
                      />

                      {/* Retícula de Coordenadas GPS (Latitud / Longitud) */}
                      {[140, 280, 420, 560].map((yLine, idx) => (
                        <g key={`lat-${yLine}`}>
                          <line
                            x1="0"
                            y1={yLine}
                            x2="1000"
                            y2={yLine}
                            stroke="#38BDF8"
                            strokeOpacity="0.18"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="14"
                            y={yLine - 6}
                            fill="#7DD3FC"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {`11°${22 - idx * 5}'N`}
                          </text>
                        </g>
                      ))}
                      {[200, 400, 600, 800].map((xLine, idx) => (
                        <g key={`lon-${xLine}`}>
                          <line
                            x1={xLine}
                            y1="0"
                            x2={xLine}
                            y2="620"
                            stroke="#38BDF8"
                            strokeOpacity="0.18"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={xLine + 6}
                            y="608"
                            fill="#7DD3FC"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {`74°${18 - idx * 6}'W`}
                          </text>
                        </g>
                      ))}

                      {/* Anillos de Radio de Distancia desde el Centro Histórico de Santa Marta (x: 110, y: 235) */}
                      {[160, 320, 490].map((radius, idx) => (
                        <g key={`ring-${radius}`}>
                          <circle
                            cx="110"
                            cy="235"
                            r={radius}
                            fill="none"
                            stroke="#FBBF24"
                            strokeOpacity="0.28"
                            strokeWidth="1.2"
                            strokeDasharray="6 6"
                          />
                          <text
                            x={110 + radius * 0.72}
                            y={235 + radius * 0.58}
                            fill="#FDE68A"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="700"
                          >
                            {`Radio ${(idx + 1) * 15} km`}
                          </text>
                        </g>
                      ))}

                      {/* Vectores de Ruta y Tiempos de Viaje desde Santa Marta */}
                      <g stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="5 5">
                        <line x1="110" y1="235" x2="430" y2="168" />
                        <line x1="110" y1="235" x2="780" y2="174" />
                        <line x1="110" y1="235" x2="220" y2="342" />
                        <line x1="110" y1="235" x2="670" y2="348" />
                        <line x1="110" y1="235" x2="470" y2="496" />
                      </g>

                      {/* Nodo Base: Centro Histórico Santa Marta */}
                      <circle
                        cx="110"
                        cy="235"
                        r="7"
                        fill="#FBBF24"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x="124"
                        y="232"
                        fill="#FEF08A"
                        fontSize="11"
                        fontWeight="800"
                      >
                        SANTA MARTA (KM 0)
                      </text>
                    </svg>

                    {/* Marcadores Satelitales 2D con Tiempo de Desplazamiento */}
                    {NODOS_TOPOGRAFICOS.map((nodo) => {
                      const esActivo = nodoActivoId === nodo.id;
                      const tiempoDesdeSm =
                        nodo.id === "tayrona"
                          ? "55 min · Troncal Caribe"
                          : nodo.id === "don-diego"
                          ? "1h 20m · Vía Riohacha"
                          : nodo.id === "minca"
                          ? "45 min · Ascenso"
                          : nodo.id === "teyuna"
                          ? "2h 30m 4x4 + Trek"
                          : "2h 15m · Camperos 4x4";

                      return (
                        <button
                          key={nodo.id}
                          type="button"
                          onClick={() => setNodoActivoId(nodo.id)}
                          style={{
                            left: `${nodo.svgPos.x}%`,
                            top: `${nodo.svgPos.y}%`,
                          }}
                          className={` -translate-x-1/2 -translate-y-1/2 absolute rounded-2xl px-3 py-1.5 text-left transition-all shadow-lg border ${
                            esActivo
                              ? "z-30 bg-[#EA580C] text-white border-white scale-105"
                              : "z-20 bg-slate-950/90 text-slate-100 border-sky-400/40 hover:border-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold whitespace-nowrap">
                            <span className="h-2 w-2 rounded-full bg-amber-300" />
                            <span>{nodo.nombre.split("·")[0].trim()}</span>
                            <span className="font-mono text-[10px] opacity-90">
                              ({nodo.altitudMsnm}m)
                            </span>
                          </div>
                          <div className="text-[9px] font-mono text-sky-200/90 whitespace-nowrap">
                            {tiempoDesdeSm}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* =============================================================
                  GRÁFICO DE PERFIL DE ELEVACIÓN INTERACTIVO (0m a 3.100m MSNM)
                  Resalta dinámicamente la altitud del destino activo
              ============================================================== */}
              <div className="mt-1 rounded-2xl bg-[#F8FAFC] dark:bg-slate-950/90 p-3.5 border border-[#0F172A]/10 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {idioma === "es"
                      ? "Perfil Longitudinal de Elevación (0m → 3.100m MSNM)"
                      : "Longitudinal Elevation Profile (0m → 3,100m AMSL)"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EA580C]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#EA580C] dark:text-amber-400">
                    <span>{nodoActivo.nombre.split("·")[0].trim()}:</span>
                    <span className="font-mono">
                      {nodoActivo.altitudMsnm} msnm · {nodoActivo.tempCelsius}°C
                    </span>
                  </span>
                </div>

                {/* Curva de Perfil Altimétrico y Nodos Interactivos */}
                <div className="grid grid-cols-5 gap-2 items-end pt-2">
                  {[...NODOS_TOPOGRAFICOS]
                    .sort((a, b) => a.altitudMsnm - b.altitudMsnm)
                    .map((nodo) => {
                      const activo = nodoActivoId === nodo.id;
                      const alturaBarra =
                        nodo.altitudMsnm <= 50
                          ? 22
                          : nodo.altitudMsnm <= 100
                          ? 32
                          : nodo.altitudMsnm <= 700
                          ? 52
                          : nodo.altitudMsnm <= 1300
                          ? 74
                          : 100;
                      return (
                        <button
                          key={`elev-${nodo.id}`}
                          type="button"
                          onClick={() => setNodoActivoId(nodo.id)}
                          className={`group flex flex-col items-center rounded-xl p-2 transition-all border ${
                            activo
                              ? "bg-[#EA580C]/10 border-[#EA580C] dark:bg-[#EA580C]/20"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#065F46]"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-mono font-extrabold ${
                              activo
                                ? "text-[#EA580C] dark:text-amber-300"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {nodo.altitudMsnm}m
                          </span>
                          <div className="my-1.5 flex h-12 w-full items-end justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-1">
                            <div
                              style={{ height: `${alturaBarra}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                activo
                                  ? "bg-gradient-to-t from-[#065F46] to-[#EA580C]"
                                  : "bg-gradient-to-t from-[#0284C7]/60 to-[#0D9488]/80 group-hover:from-[#065F46] group-hover:to-[#0D9488]"
                              }`}
                            />
                          </div>
                          <span
                            className={`truncate max-w-full text-[11px] font-bold ${
                              activo
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {nodo.nombre.split("·")[0].trim()}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Panel Derecho del Mapa: Fotografía Luminosa y Reserva Directa */}
            <div className="lg:col-span-5 flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 text-[#0F172A] dark:text-white shadow-lg border border-[#0F172A]/10 dark:border-slate-800">
              <div>
                <div className="relative h-60 sm:h-64 w-full overflow-hidden rounded-2xl bg-[#F3EFE6] dark:bg-slate-800">
                  <img
                    src={nodoActivo.imagen}
                    alt={nodoActivo.nombre}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== nodoActivo.fallbackImagen) {
                        target.src = nodoActivo.fallbackImagen;
                      }
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-slate-900/95 px-3.5 py-1 text-xs font-bold text-[#065F46] dark:text-emerald-400 shadow-sm">
                    {idioma === "es"
                      ? nodoActivo.pisoLabelEs
                      : nodoActivo.pisoLabelEn}
                  </div>
                  <div className="absolute top-3 right-3 rounded-full bg-[#0284C7] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {nodoActivo.tempCelsius}°C · {nodoActivo.altitudMsnm} msnm
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0D9488] dark:text-teal-400">
                    {nodoActivo.region}
                  </div>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                    {nodoActivo.nombre}
                  </h3>
                  <p className="mt-2 text-sm text-[#0F172A]/75 dark:text-slate-300 leading-relaxed">
                    {idioma === "es"
                      ? nodoActivo.descripcionEs
                      : nodoActivo.descripcionEn}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F3EFE6] dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-[#0F172A] dark:text-slate-200">
                    {idioma === "es"
                      ? nodoActivo.duracionEs
                      : nodoActivo.duracionEn}
                  </span>
                  <span className="rounded-full bg-[#F3EFE6] dark:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-[#0F172A] dark:text-slate-200">
                    {idioma === "es" ? nodoActivo.nivelEs : nodoActivo.nivelEn}
                  </span>
                  <span className="rounded-full bg-[#065F46]/10 dark:bg-emerald-500/15 px-3.5 py-1.5 text-xs font-extrabold text-[#065F46] dark:text-emerald-400">
                    {idioma === "es" ? "Desde" : "From"} {nodoActivo.precioDesde}
                  </span>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-1.5 text-xs font-bold text-[#065F46] dark:text-emerald-300">
                    {nodoActivo.cuposDisponibles}{" "}
                    {idioma === "es" ? "cupos disponibles" : "spots available"}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#0F172A]/10 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => manejarReservaNodo(nodoActivo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#D97706] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all"
                >
                  <span>
                    {idioma === "es"
                      ? "Reservar este destino"
                      : "Book this destination"}
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <Link
                  href="/expediciones"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0F172A]/15 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 px-4 py-3.5 text-xs font-bold text-[#0F172A] dark:text-slate-200 hover:bg-[#F3EFE6] dark:hover:bg-slate-700 transition-colors"
                >
                  <span>{idioma === "es" ? "Ver todos" : "See all"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 4: BLOQUE VISUAL DE ACCESO DIRECTO A BAQUIANO AI Y PULSO DEL TERRITORIO
      ====================================================================== */}
      <section
        aria-label="Herramientas Inteligentes para Viajeros"
        className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloque 1: Baquiano AI */}
          <div className="relative overflow-hidden rounded-3xl bg-[#065F46] p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {idioma === "es"
                    ? "Concierge Inteligente de Viaje"
                    : "Intelligent Travel Concierge"}
                </span>
              </span>
              <h3 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {idioma === "es"
                  ? "¿No sabes qué ruta elegir? Pregúntale a Baquiano IA"
                  : "Not sure which trail to pick? Ask Baquiano AI"}
              </h3>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-white/85 leading-relaxed">
                {idioma === "es"
                  ? "Nuestro recomendador analiza el clima del día, el nivel de caminata que prefieres y tu presupuesto para sugerirte la mejor experiencia en Santa Marta."
                  : "Our recommender analyzes today's weather, your preferred hiking pace, and your budget to suggest the ideal experience in Santa Marta."}
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/baquiano"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#EA580C] hover:bg-[#D97706] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all"
              >
                <span>
                  {idioma === "es"
                    ? "Personalizar mi viaje con IA"
                    : "Customize my trip with AI"}
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Bloque 2: Pulso del Territorio */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0284C7] p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Radio className="h-3.5 w-3.5 animate-pulse text-[#FBBF24]" />
                <span>
                  {idioma === "es"
                    ? "Estado Ambiental en Vivo"
                    : "Live Environmental Status"}
                </span>
              </span>
              <h3 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {idioma === "es"
                  ? "Pulso del Territorio: Clima, Oleaje y Cupos Hoy"
                  : "Territory Pulse: Weather, Surf & Daily Quotas"}
              </h3>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-white/90 leading-relaxed">
                {idioma === "es"
                  ? "Consulta en tiempo real el estado de los senderos del Parque Tayrona, las condiciones marítimas del Caribe y las rutas más tranquilas del día."
                  : "Check real-time trail conditions in Tayrona Park, Caribbean maritime alerts, and the quietest trails of the day."}
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/pulso"
                className="inline-flex items-center gap-2.5 rounded-full bg-white hover:bg-[#FAF8F5] px-6 py-3.5 text-sm font-bold text-[#0F172A] shadow-lg transition-all"
              >
                <span>
                  {idioma === "es"
                    ? "Consultar estado del parque"
                    : "Check park status"}
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
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
          className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/60 backdrop-blur-sm"
          onClick={() => setActividadSeleccionada(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-full max-w-4xl overflow-y-auto border-l border-[#0F172A]/15 bg-[#FAF8F5] text-[#0F172A] p-4 sm:p-6 md:p-10 shadow-2xl"
          >
            {/* Barra Superior del Drawer */}
            <div className="flex items-start justify-between gap-4 border-b border-[#0F172A]/15 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#065F46]">
                  <span>{actividadSeleccionada.ubicacion}</span>
                </div>
                <h2
                  id="titulo-drawer-expedicion"
                  className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-[#0F172A]"
                >
                  {idioma === "es"
                    ? actividadSeleccionada.nombreEs
                    : actividadSeleccionada.nombreEn}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActividadSeleccionada(null)}
                className="shrink-0 rounded-full border border-[#0F172A]/20 bg-white px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F3EFE6] transition-colors"
              >
                {idioma === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            {/* Galería Visual Interactiva Luminosa */}
            <div className="mt-6">
              <div className="relative h-60 sm:h-72 md:h-96 w-full overflow-hidden rounded-2xl border border-[#0F172A]/15 bg-[#F3EFE6]">
                <img
                  src={
                    fichaActiva.galeriaImagenes[indiceFotoActiva] ||
                    actividadSeleccionada.imagenUrl
                  }
                  alt={actividadSeleccionada.nombreEs}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = "/images/destinos/tayrona.jpg";
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto rounded-full bg-white/95 border border-[#0F172A]/15 px-3.5 py-1 text-xs font-bold text-[#065F46] truncate shadow-sm">
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
                    className={`relative h-16 sm:h-20 overflow-hidden rounded-xl border transition-all ${
                      indiceFotoActiva === idx
                        ? "border-[#EA580C] ring-2 ring-[#EA580C]"
                        : "border-[#0F172A]/15 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vista ${idx + 1}`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = "/images/destinos/teyuna.jpg";
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
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
                <strong className="mt-1 flex items-center gap-1 text-[#065F46]">
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
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#065F46]">
                  // QUÉ INCLUYE TU EXPEDICIÓN
                </h3>
                <ul className="mt-3 space-y-2.5 font-mono text-xs text-sand/85">
                  {(idioma === "es"
                    ? fichaActiva.incluyeEs
                    : fichaActiva.incluyeEn
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#065F46]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bloque de Checkout Comercial en 3 Pasos con Pasarela Wompi Sandbox y Pasaporte QR */}
            <div className="mt-8 border-t-2 border-terracotta bg-jungle/15 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-2xl sm:text-3xl uppercase text-sand">
                  {idioma === "es"
                    ? "CHECKOUT & PASARELA WOMPI SANDBOX"
                    : "EXPEDITION CHECKOUT & WOMPI SANDBOX GATEWAY"}
                </h3>
                <span className="flex items-center gap-1.5 font-mono text-xs text-[#065F46]">
                  <ShieldCheck className="h-4 w-4" />
                  TRANSACCIÓN ACID · CUPO EN TIEMPO REAL
                </span>
              </div>

              {!sesionUsuario ? (
                <div className="mt-6 border-2 border-terracotta/70 bg-obsidian p-6 sm:p-8">
                  <div className="inline-flex items-center gap-2 border border-terracotta/40 bg-terracotta/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta">
                    <Lock className="h-3.5 w-3.5" />
                    <span>AUTENTICACIÓN REQUERIDA // PÓLIZA PNN &amp; AISLAMIENTO RLS</span>
                  </div>
                  <h4 className="mt-4 font-display text-2xl sm:text-3xl uppercase tracking-tight text-sand">
                    INICIA SESIÓN COMO VIAJERO PARA RESERVAR Y EMITIR TU PASAPORTE QR
                  </h4>
                  <p className="mt-2 max-w-2xl font-mono text-xs text-sand/75 leading-relaxed">
                    Por trazabilidad de seguro de alta montaña PNN / ICANH y privacidad de billetera personal (Row-Level Security), cada reserva transaccional y su código QR oficial se emiten exclusivamente bajo la cuenta autenticada del expedicionario titular.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 bg-terracotta px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-ember transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                      <span>IR A /LOGIN E INICIAR SESIÓN COMO VIAJERO</span>
                    </Link>
                    <span className="font-mono text-[11px] text-sand/60">
                      Incluye acceso 1-clic con <strong>Turista 1 (Sebastián Abaonza)</strong> o <strong>Turista 2 (Valeria Mejía)</strong>.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Barra Indicadora de los 3 Pasos del Checkout */}
                  <div className="mt-4 grid grid-cols-3 border border-sand/20 bg-obsidian font-mono text-[11px] uppercase">
                <button
                  type="button"
                  onClick={() => setPasoCheckout(1)}
                  className={`flex items-center justify-center gap-1.5 py-3 px-2 font-bold transition-colors ${
                    pasoCheckout === 1
                      ? "bg-terracotta text-white"
                      : "text-sand/65 hover:text-sand"
                  }`}
                >
                  <span>01 // EXPEDICIONARIO &amp; FECHA</span>
                </button>
                <button
                  type="button"
                  onClick={() => avanzarAPaso2Wompi()}
                  className={`flex items-center justify-center gap-1.5 border-x border-sand/20 py-3 px-2 font-bold transition-colors ${
                    pasoCheckout === 2
                      ? "bg-terracotta text-white"
                      : "text-sand/65 hover:text-sand"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>02 // WOMPI SANDBOX PAY</span>
                </button>
                <button
                  type="button"
                  disabled={!resultadoReserva?.exito}
                  onClick={() => {
                    if (resultadoReserva?.exito) setPasoCheckout(3);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-3 px-2 font-bold transition-colors ${
                    pasoCheckout === 3
                      ? "bg-emerald-700 text-white"
                      : "text-sand/40 disabled:cursor-not-allowed"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>03 // PASAPORTE OFICIAL QR</span>
                </button>
              </div>

              {/* ===============================================================
                  PASO 1: DATOS DEL EXPEDICIONARIO Y FECHA/HORARIO
              ================================================================ */}
              {pasoCheckout === 1 && (
                <div className="mt-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-sand/85 font-bold">
                      PASO 1 // SELECCIÓN DE SALIDA &amp; TITULAR DE PÓLIZA PNN
                    </span>
                    <button
                      type="button"
                      onClick={autocompletarDatosViajeroDemo}
                      className="inline-flex items-center gap-1.5 border border-terracotta/60 bg-terracotta/15 px-3 py-1 font-mono text-[11px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Autocompletar datos de viajero</span>
                    </button>
                  </div>

                  {sesionUsuario && (
                    <div className="flex items-center justify-between border border-emerald-500/35 bg-emerald-50 px-3.5 py-2 font-mono text-[11px] text-[#065F46]">
                      <span>
                        Datos sincronizados desde tu sesión activa JWT (
                        <strong>{sesionUsuario.email}</strong>)
                      </span>
                      <span className="uppercase font-bold">
                        {sesionUsuario.rol}
                      </span>
                    </div>
                  )}

                  {/* Selección de Fecha y Horario */}
                  <div>
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
                              ? "border-terracotta bg-terracotta/15 text-white"
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
                              <strong className="text-[#065F46]">
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

                  {/* Campos del Expedicionario #1 (Titular JWT) y Acompañantes #2..#N */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label
                          htmlFor="checkout-cupos"
                          className="block font-mono text-[11px] uppercase text-sand/70"
                        >
                          VIAJEROS (CUPOS)
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
                              const nuevoValor = Math.max(
                                1,
                                Math.min(
                                  16,
                                  parseInt(e.target.value || "1", 10)
                                )
                              );
                              setCantidadCupos(nuevoValor);
                              setErroresCheckout((prev) => ({
                                ...prev,
                                cupos: undefined,
                                integridadGrupo: undefined,
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
                          className="flex items-center justify-between font-mono text-[11px] uppercase text-sand/70"
                        >
                          <span>VIAJERO #1 (TITULAR)</span>
                          {sesionUsuario && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#065F46]">
                              <Lock className="h-2.5 w-2.5" />
                              JWT VERIFICADO
                            </span>
                          )}
                        </label>
                        <input
                          id="checkout-nombre"
                          type="text"
                          readOnly={Boolean(sesionUsuario)}
                          value={sesionUsuario ? sesionUsuario.nombre : nombreViajero}
                          onChange={(e) => {
                            if (sesionUsuario) return;
                            setNombreViajero(e.target.value);
                            setErroresCheckout((prev) => ({
                              ...prev,
                              nombre: undefined,
                              integridadGrupo: undefined,
                            }));
                          }}
                          className={`mt-1.5 w-full border px-3 py-2 font-mono text-xs focus:outline-none ${
                            sesionUsuario
                              ? "border-emerald-500/40 bg-emerald-50 text-[#065F46] cursor-not-allowed"
                              : erroresCheckout.nombre
                              ? "border-terracotta bg-obsidian text-sand"
                              : "border-sand/30 bg-obsidian text-sand focus:border-terracotta"
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
                          className="flex items-center justify-between font-mono text-[11px] uppercase text-sand/70"
                        >
                          <span>DOCUMENTO TITULAR #1</span>
                          {sesionUsuario && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#065F46]">
                              <Lock className="h-2.5 w-2.5" />
                              SOLO LECTURA
                            </span>
                          )}
                        </label>
                        <input
                          id="checkout-doc"
                          type="text"
                          readOnly={Boolean(sesionUsuario?.documento)}
                          value={
                            sesionUsuario?.documento
                              ? sesionUsuario.documento
                              : documentoViajero
                          }
                          onChange={(e) => {
                            if (sesionUsuario?.documento) return;
                            setDocumentoViajero(e.target.value);
                            setErroresCheckout((prev) => ({
                              ...prev,
                              documento: undefined,
                              integridadGrupo: undefined,
                            }));
                          }}
                          className={`mt-1.5 w-full border px-3 py-2 font-mono text-xs focus:outline-none ${
                            sesionUsuario?.documento
                              ? "border-emerald-500/40 bg-emerald-50 text-[#065F46] cursor-not-allowed"
                              : erroresCheckout.documento
                              ? "border-terracotta bg-obsidian text-sand"
                              : "border-sand/30 bg-obsidian text-sand focus:border-terracotta"
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
                          className="flex items-center justify-between font-mono text-[11px] uppercase text-sand/70"
                        >
                          <span>EMAIL DE CONFIRMACIÓN</span>
                          {sesionUsuario && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#065F46]">
                              <Lock className="h-2.5 w-2.5" />
                              CUENTA ACTIVA
                            </span>
                          )}
                        </label>
                        <input
                          id="checkout-email"
                          type="email"
                          readOnly={Boolean(sesionUsuario)}
                          value={sesionUsuario ? sesionUsuario.email : emailViajero}
                          onChange={(e) => {
                            if (sesionUsuario) return;
                            setEmailViajero(e.target.value);
                            setErroresCheckout((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }}
                          className={`mt-1.5 w-full border px-3 py-2 font-mono text-xs focus:outline-none ${
                            sesionUsuario
                              ? "border-emerald-500/40 bg-emerald-50 text-[#065F46] cursor-not-allowed"
                              : erroresCheckout.email
                              ? "border-terracotta bg-obsidian text-sand"
                              : "border-sand/30 bg-obsidian text-sand focus:border-terracotta"
                          }`}
                        />
                        {erroresCheckout.email && (
                          <span className="mt-1 block font-mono text-[10px] text-terracotta">
                            {erroresCheckout.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Listado Dinámico de Acompañantes (#2 hasta #N) */}
                    {cantidadCupos > 1 && (
                      <div className="border border-sand/20 bg-obsidian p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-2.5 font-mono text-[11px]">
                          <span className="font-bold uppercase text-terracotta">
                            // NÓMINA DE ACOMPAÑANTES DE EXPEDICIÓN PNN / ICANH (VIAJEROS #2 AL #{cantidadCupos})
                          </span>
                          <span className="text-[10px] text-sand/60">
                            Regla Civil: 1 Documento = 1 Persona · Sin duplicados en el grupo
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {Array.from(
                            { length: Math.max(0, cantidadCupos - 1) },
                            (_, idx) => {
                              const numViajero = idx + 2;
                              const acomp = acompanantes[idx] || {
                                nombre: "",
                                documento: "",
                              };
                              const errAcomp =
                                erroresCheckout.acompanantes?.[idx];

                              return (
                                <div
                                  key={`acomp-${numViajero}`}
                                  className="grid grid-cols-1 gap-3 border border-sand/15 bg-jungle/15 p-3 sm:grid-cols-2"
                                >
                                  <div>
                                    <label className="block font-mono text-[11px] uppercase text-sand/75">
                                      Nombre Completo del Acompañante #{numViajero}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={`Ej. ${
                                        ACOMPANANTES_DEMO_POOL[
                                          idx % ACOMPANANTES_DEMO_POOL.length
                                        ].nombre
                                      }`}
                                      value={acomp.nombre}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setAcompanantes((prev) => {
                                          const copia = [...prev];
                                          copia[idx] = {
                                            ...(copia[idx] || {
                                              nombre: "",
                                              documento: "",
                                            }),
                                            nombre: val,
                                          };
                                          return copia;
                                        });
                                        setErroresCheckout((prev) => ({
                                          ...prev,
                                          integridadGrupo: undefined,
                                          acompanantes: prev.acompanantes
                                            ? {
                                                ...prev.acompanantes,
                                                [idx]: {
                                                  ...prev.acompanantes[idx],
                                                  nombre: undefined,
                                                },
                                              }
                                            : undefined,
                                        }));
                                      }}
                                      className={`mt-1.5 w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                                        errAcomp?.nombre
                                          ? "border-terracotta"
                                          : "border-sand/30 focus:border-terracotta"
                                      }`}
                                    />
                                    {errAcomp?.nombre && (
                                      <span className="mt-1 block font-mono text-[10px] text-terracotta">
                                        {errAcomp.nombre}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block font-mono text-[11px] uppercase text-sand/75">
                                      Documento / Pasaporte #{numViajero}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={`Ej. ${
                                        ACOMPANANTES_DEMO_POOL[
                                          idx % ACOMPANANTES_DEMO_POOL.length
                                        ].documento
                                      }`}
                                      value={acomp.documento}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setAcompanantes((prev) => {
                                          const copia = [...prev];
                                          copia[idx] = {
                                            ...(copia[idx] || {
                                              nombre: "",
                                              documento: "",
                                            }),
                                            documento: val,
                                          };
                                          return copia;
                                        });
                                        setErroresCheckout((prev) => ({
                                          ...prev,
                                          integridadGrupo: undefined,
                                          acompanantes: prev.acompanantes
                                            ? {
                                                ...prev.acompanantes,
                                                [idx]: {
                                                  ...prev.acompanantes[idx],
                                                  documento: undefined,
                                                },
                                              }
                                            : undefined,
                                        }));
                                      }}
                                      className={`mt-1.5 w-full border bg-obsidian px-3 py-2 font-mono text-xs text-sand focus:outline-none ${
                                        errAcomp?.documento
                                          ? "border-terracotta"
                                          : "border-sand/30 focus:border-terracotta"
                                      }`}
                                    />
                                    {errAcomp?.documento && (
                                      <span className="mt-1 block font-mono text-[10px] text-terracotta">
                                        {errAcomp.documento}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alerta Visual del Motor de Validación de Identidad Civil y Anti-Duplicidad */}
                    {erroresCheckout.integridadGrupo && (
                      <div className="border-2 border-terracotta bg-terracotta/15 p-4 font-mono text-xs text-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terracotta/40 pb-2">
                          <span className="flex items-center gap-2 font-bold text-terracotta">
                            <ShieldAlert className="h-4 w-4" />
                            HTTP {erroresCheckout.integridadGrupo.httpStatus || 422}{" "}
                            {erroresCheckout.integridadGrupo.codigo ||
                              "INTEGRIDAD_IDENTIDAD"}
                          </span>
                          <span className="bg-obsidian px-2 py-0.5 text-[10px] text-amber-800 border border-amber-400/40">
                            BLOQUEO PREVENTIVO DE INTEGRIDAD PNN
                          </span>
                        </div>
                        <p className="mt-2.5 text-sand/95 leading-relaxed">
                          {erroresCheckout.integridadGrupo.mensaje}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Casilla de Consentimiento Habeas Data (Ley 1581 de 2012) */}
                  <div>
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
                        Autorizo el tratamiento de mis datos personales conforme
                        a la{" "}
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

                  <button
                    type="button"
                    onClick={avanzarAPaso2Wompi}
                    className="w-full flex items-center justify-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-ember transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>
                      CONTINUAR A PASARELA DE PAGO WOMPI SANDBOX (
                      {formatearCop(
                        actividadSeleccionada.precioCop * cantidadCupos
                      )}
                      )
                    </span>
                  </button>
                </div>
              )}

              {/* ===============================================================
                  PASO 2: PASARELA DE PAGO SEGURA (TYRONAWILDS PAY // WOMPI SANDBOX)
              ================================================================ */}
              {pasoCheckout === 2 && (
                <div className="mt-6 space-y-5 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border border-sand/20 bg-obsidian px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#065F46]" />
                      <span className="font-bold uppercase tracking-wider text-sand">
                        TYRONAWILDS PAY // WOMPI SANDBOX GATEWAY
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasoCheckout(1)}
                      className="text-[11px] text-terracotta underline hover:text-sand"
                    >
                      EDITAR DATOS DEL VIAJERO ({nombreViajero})
                    </button>
                  </div>

                  {/* Selector de los 3 Métodos de Pago */}
                  <div>
                    <label className="block text-[11px] uppercase text-sand/70">
                      SELECCIONA INSTRUMENTO FINANCIERO COLOMBIA (MODO SANDBOX 1-CLIC):
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMetodoPagoWompi("NEQUI");
                          setErrorPagoWompi(null);
                        }}
                        className={`flex items-center justify-between border p-3.5 text-left transition-colors ${
                          metodoPagoWompi === "NEQUI"
                            ? "border-terracotta bg-terracotta/15 text-white font-bold"
                            : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-terracotta" />
                          <span>NEQUI PUSH</span>
                        </span>
                        <span className="bg-sand/10 px-1.5 py-0.5 text-[10px]">
                          1.5s
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMetodoPagoWompi("PSE");
                          setErrorPagoWompi(null);
                        }}
                        className={`flex items-center justify-between border p-3.5 text-left transition-colors ${
                          metodoPagoWompi === "PSE"
                            ? "border-terracotta bg-terracotta/15 text-white font-bold"
                            : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-terracotta" />
                          <span>PSE BANCARIO</span>
                        </span>
                        <span className="bg-sand/10 px-1.5 py-0.5 text-[10px]">
                          ACH
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMetodoPagoWompi("TARJETA");
                          setErrorPagoWompi(null);
                        }}
                        className={`flex items-center justify-between border p-3.5 text-left transition-colors ${
                          metodoPagoWompi === "TARJETA"
                            ? "border-terracotta bg-terracotta/15 text-white font-bold"
                            : "border-sand/20 bg-obsidian text-sand/70 hover:border-sand/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-terracotta" />
                          <span>TARJETA CRÉDITO/DÉBITO</span>
                        </span>
                        <span className="bg-sand/10 px-1.5 py-0.5 text-[10px]">
                          4242
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Formulario Específico por Método con Botón Autocompletar 1-Clic */}
                  <div className="border border-sand/20 bg-obsidian p-4">
                    {metodoPagoWompi === "NEQUI" && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold uppercase text-sand">
                            PAGO RÁPIDO CON NOTIFICACIÓN PUSH NEQUI
                          </span>
                          <button
                            type="button"
                            onClick={() => autocompletarMetodoWompiDemo("NEQUI")}
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Autocompletar datos de prueba</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase text-sand/70">
                            NÚMERO DE CELULAR VINCULADO A NEQUI (10 DÍGITOS)
                          </label>
                          <input
                            type="tel"
                            value={celularNequi}
                            onChange={(e) => setCelularNequi(e.target.value)}
                            placeholder="3005550199"
                            className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                          />
                        </div>

                        {estadoPushNequi !== "IDLE" && (
                          <div
                            className={`border p-3 text-[11px] ${
                              estadoPushNequi === "APROBADO"
                                ? "border-emerald-400 bg-emerald-50 text-[#065F46]"
                                : "border-amber-400 bg-amber-50 text-amber-900 animate-pulse"
                            }`}
                          >
                            {estadoPushNequi === "ENVIANDO"
                              ? `📲 ENVIANDO NOTIFICACIÓN PUSH A NEQUI (${celularNequi})... ESPERANDO CONFIRMACIÓN BIOMÉTRICA (1.5s)...`
                              : `✓ NOTIFICACIÓN PUSH APROBADA EN APP NEQUI (${celularNequi}) · TOKENIZACIÓN WOMPI OK`}
                          </div>
                        )}
                      </div>
                    )}

                    {metodoPagoWompi === "PSE" && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold uppercase text-sand">
                            DÉBITO INTERBANCARIO PSE (ACH COLOMBIA)
                          </span>
                          <button
                            type="button"
                            onClick={() => autocompletarMetodoWompiDemo("PSE")}
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Autocompletar datos de prueba</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-[11px] uppercase text-sand/70">
                              ENTIDAD FINANCIERA
                            </label>
                            <select
                              value={bancoPse}
                              onChange={(e) => setBancoPse(e.target.value)}
                              className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                            >
                              <option value="Nu Colombia">Nu Colombia</option>
                              <option value="Bancolombia">Bancolombia</option>
                              <option value="Davivienda">Davivienda</option>
                              <option value="Banco de Bogotá">
                                Banco de Bogotá
                              </option>
                              <option value="Lulo Bank">Lulo Bank</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase text-sand/70">
                              TIPO DE PERSONA
                            </label>
                            <select
                              value={tipoPersonaPse}
                              onChange={(e) =>
                                setTipoPersonaPse(
                                  e.target.value as "NATURAL" | "JURIDICA"
                                )
                              }
                              className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                            >
                              <option value="NATURAL">Persona Natural</option>
                              <option value="JURIDICA">Persona Jurídica</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase text-sand/70">
                              DOCUMENTO TITULAR
                            </label>
                            <input
                              type="text"
                              value={documentoPse}
                              onChange={(e) => setDocumentoPse(e.target.value)}
                              placeholder="1082940182"
                              className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {metodoPagoWompi === "TARJETA" && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold uppercase text-sand">
                            TARJETA DE CRÉDITO / DÉBITO (WOMPI SANDBOX)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              autocompletarMetodoWompiDemo("TARJETA")
                            }
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Autocompletar datos de prueba</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] uppercase text-sand/70">
                              NÚMERO DE TARJETA SANDBOX
                            </label>
                            <input
                              type="text"
                              value={numeroTarjeta}
                              onChange={(e) => setNumeroTarjeta(e.target.value)}
                              placeholder="4242 4242 4242 4242"
                              className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase text-sand/70">
                              EXPIRACIÓN
                            </label>
                            <input
                              type="text"
                              value={expiracionTarjeta}
                              onChange={(e) =>
                                setExpiracionTarjeta(e.target.value)
                              }
                              placeholder="12/28"
                              className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] uppercase text-sand/70">
                                CVC
                              </label>
                              <input
                                type="text"
                                value={cvcTarjeta}
                                onChange={(e) => setCvcTarjeta(e.target.value)}
                                placeholder="842"
                                className="mt-1.5 w-full border border-sand/30 bg-obsidian px-2.5 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] uppercase text-sand/70">
                                CUOTAS
                              </label>
                              <select
                                value={cuotasTarjeta}
                                onChange={(e) =>
                                  setCuotasTarjeta(e.target.value)
                                }
                                className="mt-1.5 w-full border border-sand/30 bg-obsidian px-2 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                              >
                                <option value="1">1</option>
                                <option value="3">3</option>
                                <option value="6">6</option>
                                <option value="12">12</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {errorPagoWompi && (
                    <div className="border border-terracotta bg-terracotta/15 p-3 text-terracotta">
                      {errorPagoWompi}
                    </div>
                  )}

                  {/* Desglose Transparente de Tarifas */}
                  {(() => {
                    const totalCop =
                      actividadSeleccionada.precioCop * cantidadCupos;
                    const tasaPnnCop = Math.round(totalCop * 0.12);
                    const baseOperadorCop = totalCop - tasaPnnCop;
                    return (
                      <div className="border border-sand/20 bg-obsidian p-4">
                        <div className="text-[10px] uppercase tracking-wider text-sand/55 mb-2">
                          DESGLOSE FINANCIERO TRANSPARENTE (RNT &amp; PNN)
                        </div>
                        <div className="flex justify-between text-sand/80">
                          <span>
                            Tarifa Base Operador RNT ({cantidadCupos} PAX)
                          </span>
                          <span>{formatearCop(baseOperadorCop)}</span>
                        </div>
                        <div className="mt-1.5 flex justify-between text-[#065F46]">
                          <span>
                            Tasa Ambiental PNN / Contribución Indígena (12%)
                          </span>
                          <span>{formatearCop(tasaPnnCop)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-sand/15 pt-3 text-sm font-bold text-sand">
                          <span>TOTAL TRANSACCIÓN WOMPI (COP)</span>
                          <span className="text-lg text-terracotta">
                            {formatearCop(totalCop)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Selector Discreto de Escenario de Demostración (201 vs 409) */}
                  <div className="border border-sand/20 bg-sand/5 p-3.5">
                    <label
                      htmlFor="selector-escenario-wompi"
                      className="block text-[10px] uppercase tracking-wider text-sand/65"
                    >
                      MODO DE DEMOSTRACIÓN EN VIVO (TRANSACCIONALIDAD ACID &amp;
                      CONCURRENCIA):
                    </label>
                    <select
                      id="selector-escenario-wompi"
                      value={escenarioDemo}
                      onChange={(e) => {
                        setEscenarioDemo(
                          e.target.value as EscenarioDemoCheckout
                        );
                        setResultadoReserva(null);
                      }}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-xs font-bold text-sand focus:border-terracotta focus:outline-none"
                    >
                      <option value="EXITO_201">
                        ESCENARIO 1: PAGO APROBADO + RESERVA ACID (201 CREATED)
                      </option>
                      <option value="COLISION_409">
                        ESCENARIO 2: SIMULAR COLISIÓN DE ÚLTIMO CUPO (409
                        CONFLICT + REVERSO WOMPI)
                      </option>
                    </select>
                  </div>

                  {/* Botón Principal de Pago */}
                  <button
                    type="button"
                    disabled={procesandoReserva}
                    onClick={manejarConfirmarCheckout}
                    className="w-full flex items-center justify-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-ember transition-colors disabled:opacity-50"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {procesandoReserva
                        ? "PROCESANDO EN WOMPI SANDBOX & VERIFICANDO BLOQUEO PESIMISTA..."
                        : `PAGAR CON ${metodoPagoWompi} Y EMITIR PASAPORTE QR`}
                    </span>
                  </button>

                  {/* Resultado de Error Transaccional o Integridad (409 / 422) + Reverso Automático Wompi */}
                  {resultadoReserva && !resultadoReserva.exito && (
                    <div className="border-2 border-terracotta bg-terracotta/15 p-5 text-white space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terracotta/40 pb-3">
                        <span className="flex items-center gap-2 font-bold text-terracotta text-sm">
                          <ShieldAlert className="h-5 w-5" />
                          HTTP {resultadoReserva.httpStatus}{" "}
                          {resultadoReserva.errorCodigo || "CONFLICT"}
                        </span>
                        <span className="bg-obsidian px-2.5 py-1 text-[10px] font-bold text-[#065F46] border border-emerald-400/40">
                          ROLLBACK ACID + WOMPI REVERSADO
                        </span>
                      </div>

                      <p className="text-xs text-sand/90 leading-relaxed">
                        {resultadoReserva.errorMensaje}
                      </p>

                      {resultadoReserva.referenciaWompiReversada && (
                        <div className="flex items-center gap-2.5 border border-emerald-400/40 bg-emerald-950/40 p-3 text-emerald-200">
                          <RotateCcw className="h-4 w-4 shrink-0 text-[#065F46]" />
                          <div>
                            <strong className="block uppercase">
                              COBRO REVERSADO AUTOMÁTICAMENTE EN WOMPI SANDBOX
                            </strong>
                            <span>
                              La preautorización{" "}
                              <code>
                                {resultadoReserva.referenciaWompiReversada}
                              </code>{" "}
                              fue anulada de forma atómica ($0 COP debitados).
                            </span>
                          </div>
                        </div>
                      )}

                      {resultadoReserva.rutasAlternativasSostenibles &&
                        resultadoReserva.rutasAlternativasSostenibles.length >
                          0 && (
                          <div className="space-y-2.5 pt-1">
                            <span className="block text-[11px] font-bold uppercase text-amber-800">
                              RUTAS ALTERNATIVAS DE DESCONCENTRACIÓN ECOLÓGICA EN
                              SANTA MARTA:
                            </span>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {resultadoReserva.rutasAlternativasSostenibles.map(
                                (alt) => (
                                  <div
                                    key={alt.codigoServicio}
                                    className="border border-sand/25 bg-obsidian p-3 flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between text-[10px] text-[#065F46] font-bold">
                                        <span>
                                          AFORO SERENO: {alt.ocupacionPorcentaje}%
                                        </span>
                                        <span>
                                          {formatearCop(alt.precioCop)}
                                        </span>
                                      </div>
                                      <strong className="mt-1 block text-xs text-sand">
                                        {alt.nombre}
                                      </strong>
                                      <p className="mt-1 text-[11px] text-sand/70">
                                        {alt.motivo}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const encontrada = actividades.find(
                                          (a) =>
                                            a.codigoServicio ===
                                            alt.codigoServicio
                                        );
                                        if (encontrada) {
                                          abrirDrawerExpedicion(encontrada);
                                        }
                                      }}
                                      className="mt-3 w-full bg-sand px-3 py-1.5 text-[10px] font-bold uppercase text-obsidian hover:bg-terracotta hover:text-white transition-colors"
                                    >
                                      CAMBIAR A ESTA RUTA DE BAJO IMPACTO
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* ===============================================================
                  PASO 3: PASAPORTE OFICIAL DE EXPEDICIÓN CON CÓDIGO QR SVG
              ================================================================ */}
              {pasoCheckout === 3 &&
                resultadoReserva?.exito &&
                resultadoReserva.reserva && (
                  <div className="mt-6 space-y-4">
                    <PasaporteExpedicionQr
                      reserva={resultadoReserva.reserva}
                      mostrarEnlaceMisReservas={true}
                    />
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FOOTER COMERCIAL CON PÁGINAS LEGALES (LEY 1581) + ENLACE DISCRETO /LAB
      ====================================================================== */}
      <footer className="mx-auto max-w-[1440px] border-x border-slate-200 dark:border-slate-800 px-4 py-10 sm:px-6 font-mono text-xs text-slate-600 dark:text-slate-300">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              TYRONAWILDS™
            </span>{" "}
            · SANTA MARTA D.T.C.H., COLOMBIA · EXPEDICIONES DE ALTA MONTAÑA Y
            CARIBE
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/mis-reservas"
              className="font-bold text-[#EA580C] dark:text-amber-400 hover:underline transition-colors"
            >
              Mis Reservas &amp; Pasaportes QR
            </Link>
            <Link
              href="/operadores"
              className="font-bold text-slate-800 dark:text-slate-200 hover:text-[#EA580C] dark:hover:text-amber-400 transition-colors"
            >
              Portal de Operadores RNT
            </Link>
            <Link
              href="/privacidad"
              className="text-slate-600 dark:text-slate-300 hover:text-[#EA580C] dark:hover:text-amber-400 transition-colors"
            >
              Privacidad &amp; Habeas Data (Ley 1581)
            </Link>
            <Link
              href="/terminos"
              className="text-slate-600 dark:text-slate-300 hover:text-[#EA580C] dark:hover:text-amber-400 transition-colors"
            >
              Términos RNT &amp; PNN
            </Link>
            <Link
              href="/lab"
              className="rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-[#EA580C] hover:text-[#EA580C] transition-colors"
            >
              SYSTEM STATUS // LAB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
