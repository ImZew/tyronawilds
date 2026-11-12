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
  subtituloEs: string;
  subtituloEn: string;
  titularIzquierdaEs: string;
  titularIzquierdaEn: string;
  titularDerechaEs: string;
  titularDerechaEn: string;
  bgAmbiente: string;
  luzAmbiente: string;
  duracionEs: string;
  duracionEn: string;
  nivelEs: string;
  nivelEn: string;
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
    subtituloEs: "Cabo San Juan del Guía",
    subtituloEn: "Cabo San Juan del Guia",
    titularIzquierdaEs: "Somos movimiento",
    titularIzquierdaEn: "We are movement",
    titularDerechaEs: "Somos territorio",
    titularDerechaEn: "We are territory",
    bgAmbiente: "#2B241E",
    luzAmbiente: "#38BDF8",
    duracionEs: "1 día completo",
    duracionEn: "1 full day",
    nivelEs: "Caminata suave",
    nivelEn: "Easy walk",
    precioDesde: "Desde $290.000",
    fraseEs:
      "Donde los senderos de piedra ancestral se encuentran con la brisa cálida y el azul cristalino de Cabo San Juan.",
    fraseEn:
      "Where ancient stone trails meet warm sea breezes and the crystal-clear waters of Cabo San Juan.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Cabo_San_Juan_de_Gu%C3%ADa_%284167032917%29.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "02",
    codigoServicio: 9,
    nombreSelectorEs: "Ciudad Perdida",
    nombreSelectorEn: "Lost City",
    subtituloEs: "Terrazas de Teyuna",
    subtituloEn: "Teyuna Terraces",
    titularIzquierdaEs: "Somos origen",
    titularIzquierdaEn: "We are origin",
    titularDerechaEs: "Somos memoria",
    titularDerechaEn: "We are memory",
    bgAmbiente: "#1F2821",
    luzAmbiente: "#EAB308",
    duracionEs: "4 días en selva",
    duracionEn: "4-day trek",
    nivelEs: "Reto de montaña",
    nivelEn: "Mountain trek",
    precioDesde: "Desde $1.850.000",
    fraseEs:
      "Camina junto a guías locales e indígenas hacia las terrazas sagradas construidas hace más de mil años.",
    fraseEn:
      "Walk alongside local and indigenous guides to the sacred stone terraces built over a thousand years ago.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Lost_City_Ruins.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "03",
    codigoServicio: 103,
    nombreSelectorEs: "Minca",
    nombreSelectorEn: "Minca",
    subtituloEs: "Cascadas y Bosque de Café",
    subtituloEn: "Waterfalls & Coffee Forest",
    titularIzquierdaEs: "Somos calma",
    titularIzquierdaEn: "We are calm",
    titularDerechaEs: "Somos bosque",
    titularDerechaEn: "We are forest",
    bgAmbiente: "#2D221C",
    luzAmbiente: "#F59E0B",
    duracionEs: "8 horas",
    duracionEn: "8 hours",
    nivelEs: "Para todos",
    nivelEn: "All levels",
    precioDesde: "Desde $210.000",
    fraseEs:
      "Cascadas de agua pura, cafetales orgánicos de sombra y el canto de más de trescientas aves al amanecer.",
    fraseEn:
      "Pure mountain waterfalls, organic shade-grown coffee, and over three hundred bird species at dawn.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/1/1f/Minca_Banner.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "04",
    codigoServicio: 105,
    nombreSelectorEs: "Sierra Nevada",
    nombreSelectorEn: "Sierra Nevada",
    subtituloEs: "Cerro Kennedy & Cumbres",
    subtituloEn: "Cerro Kennedy & Peaks",
    titularIzquierdaEs: "Somos cumbre",
    titularIzquierdaEn: "We are summit",
    titularDerechaEs: "Somos altura",
    titularDerechaEn: "We are altitude",
    bgAmbiente: "#21272E",
    luzAmbiente: "#7DD3FC",
    duracionEs: "1 a 2 días",
    duracionEn: "1 to 2 days",
    nivelEs: "Caminata amigable",
    nivelEn: "Friendly hike",
    precioDesde: "Desde $245.000",
    fraseEs:
      "Contempla el amanecer sobre un mar de nubes frente a las cumbres nevadas más altas del Caribe.",
    fraseEn:
      "Watch the sunrise above a sea of clouds facing the highest snowcapped peaks of the Caribbean.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sierra_Nevada_de_Santa_Marta.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
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
    svgPos: { x: 300, y: 145 },
    tempCelsius: 29,
    cuposDisponibles: 18,
    descripcionEs:
      "Senderos sombreados que desembocan en las bahías de aguas turquesa más icónicas del Caribe colombiano.",
    descripcionEn:
      "Shaded trails leading into the most iconic turquoise bays of the Colombian Caribbean.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Cabo_San_Juan_de_Gu%C3%ADa_%284167032917%29.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "don-diego",
    codigoServicio: 105,
    nombre: "Río Don Diego & Encuentro con el Mar",
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
    svgPos: { x: 750, y: 165 },
    tempCelsius: 28,
    cuposDisponibles: 22,
    descripcionEs:
      "Descenso sereno en kayak por aguas cristalinas rodeadas de monos aulladores hasta tocar las olas del mar.",
    descripcionEn:
      "Serene kayak float down crystal-clear waters surrounded by howler monkeys all the way to the ocean surf.",
    imagen:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85",
    fallbackImagen:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "minca",
    codigoServicio: 103,
    nombre: "Minca & Cascadas de Marinka",
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
    svgPos: { x: 280, y: 310 },
    tempCelsius: 23,
    cuposDisponibles: 28,
    descripcionEs:
      "Pozos naturales de agua fresca, fincas cafeteras tradicionales y avistamiento de tucanes y colibríes.",
    descripcionEn:
      "Refreshing natural waterfall pools, traditional coffee estates, and toucan and hummingbird watching.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/1/1f/Minca_Banner.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "teyuna",
    codigoServicio: 9,
    nombre: "Ciudad Perdida (Teyuna)",
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
    svgPos: { x: 600, y: 345 },
    tempCelsius: 20,
    cuposDisponibles: 12,
    descripcionEs:
      "La gran travesía hacia las 169 terrazas circulares de piedra en el corazón sagrado de la Sierra Nevada.",
    descripcionEn:
      "The iconic multi-day trek to 169 circular stone terraces in the sacred heart of the Sierra Nevada.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Lost_City_Ruins.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85",
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
    svgPos: { x: 450, y: 465 },
    tempCelsius: 11,
    cuposDisponibles: 14,
    descripcionEs:
      "El balcón natural más imponente del Caribe para contemplar los picos nevados Colón y Bolívar al amanecer.",
    descripcionEn:
      "The most breathtaking natural balcony in the Caribbean facing the snowcapped Colón and Bolívar peaks at dawn.",
    imagen:
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sierra_Nevada_de_Santa_Marta.jpg",
    fallbackImagen:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
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
  const portalScale = Math.min(1.09, 1 + scrollY * 0.00022);
  const imgParallaxOffset = Math.min(28, scrollY * 0.06);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#26211D] text-white selection:bg-[#C89D66] selection:text-[#1C1917] font-sans">
      {/* =====================================================================
          BARRA SUPERIOR GLOBAL ULTRA-LIGERA
      ====================================================================== */}
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      {/* =====================================================================
          SECCIÓN 1: HERO "PORTAL INMERSIVO" (ORGANIC LUXURY // JESKO JETS STYLE)
          Ventana Escultórica Central con Iluminación Ambiental por Destino
      ====================================================================== */}
      <section
        id="hero"
        aria-label="Portal Inmersivo de Destinos de Santa Marta"
        className="relative mx-3 mt-3 sm:mx-5 sm:mt-4 overflow-hidden rounded-[2.5rem] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-colors duration-1000 ease-out"
        style={{ backgroundColor: destActual.bgAmbiente }}
        onMouseEnter={() => setHeroEnPausa(true)}
        onMouseLeave={() => setHeroEnPausa(false)}
      >
        {/* Iluminación Ambiental Suave Dinámica Según el Destino */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${destActual.luzAmbiente}28 0%, rgba(38, 33, 29, 0) 64%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[42rem] rounded-full blur-3xl opacity-30 transition-all duration-1000"
          style={{ backgroundColor: destActual.luzAmbiente }}
        />

        <div className="relative z-10 min-h-[85vh] lg:min-h-[88vh] w-full px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10 flex flex-col justify-between">
          {/* Fila Superior Sutil: Subtítulo del Destino y Selector Rápido */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/15">
              <span
                className="h-2 w-2 rounded-full transition-colors duration-700"
                style={{ backgroundColor: destActual.luzAmbiente }}
              />
              <span className="text-xs font-medium tracking-wide text-white/90">
                {idioma === "es" ? destActual.subtituloEs : destActual.subtituloEn}
              </span>
            </div>

            {/* Píldoras Limpias de Destino en la Parte Superior Derecha */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-black/20 p-1.5 backdrop-blur-md border border-white/10">
              {DESTINOS_HERO.map((item, idx) => {
                const activo = idx === destinoHeroIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDestinoHeroIndex(idx)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                      activo
                        ? "bg-white text-[#1C1917] font-semibold shadow-sm"
                        : "text-white/75 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {idioma === "es"
                      ? item.nombreSelectorEs
                      : item.nombreSelectorEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================================
              ZONA CENTRAL: TITULAR IZQUIERDA + PORTAL ESCULTÓRICO + TITULAR DERECHA
          ================================================================== */}
          <div className="my-8 lg:my-4 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-4">
            {/* Titular Izquierda */}
            <div className="lg:col-span-4 text-center lg:text-left order-2 lg:order-1">
              <h1
                key={`left-${destActual.id}`}
                className="text-4xl sm:text-5xl xl:text-6xl font-semibold tracking-tight text-white leading-[1.05] transition-all duration-700"
              >
                {idioma === "es"
                  ? destActual.titularIzquierdaEs
                  : destActual.titularIzquierdaEn}
              </h1>
            </div>

            {/* Centro Exacto: VENTANA ESCULTÓRICA OVALADA ("PORTAL INMERSIVO") */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2">
              <div
                className="portal-sculptural-window relative w-64 h-80 sm:w-80 sm:h-[25rem] md:w-[22rem] md:h-[28rem] rounded-full p-2.5 sm:p-3.5 transition-transform duration-500 ease-out"
                style={{
                  transform: `scale(${portalScale})`,
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(54,47,41,0.85) 55%, rgba(28,25,23,0.95) 100%)",
                }}
              >
                {/* Marco interior biselado de piedra cálida */}
                <div className="relative h-full w-full overflow-hidden rounded-full border border-white/25 bg-[#362F29] shadow-inner">
                  {DESTINOS_HERO.map((dest, idx) => (
                    <div
                      key={dest.id}
                      className={`absolute inset-0 transition-all duration-1000 ease-out ${
                        idx === destinoHeroIndex
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105 pointer-events-none"
                      }`}
                    >
                      <img
                        src={dest.imagen}
                        alt={dest.nombreSelectorEs}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== dest.fallbackImagen) {
                            target.src = dest.fallbackImagen;
                          }
                        }}
                        style={{
                          transform: `translateY(${imgParallaxOffset * -0.4}px) scale(1.06)`,
                        }}
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out brightness-105 contrast-[1.02]"
                      />
                    </div>
                  ))}

                  {/* Indicador sutil de invitación a explorar dentro del borde inferior de la ventana */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/15 to-transparent flex items-end justify-center pb-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/95 drop-shadow">
                      {idioma === "es"
                        ? "DESLIZA PARA INICIAR EL VIAJE"
                        : "SCROLL TO BEGIN THE JOURNEY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Titular Derecha */}
            <div className="lg:col-span-4 text-center lg:text-right order-3">
              <div
                key={`right-${destActual.id}`}
                className="text-4xl sm:text-5xl xl:text-6xl font-semibold tracking-tight text-white/95 leading-[1.05] transition-all duration-700"
              >
                {idioma === "es"
                  ? destActual.titularDerechaEs
                  : destActual.titularDerechaEn}
              </div>
            </div>
          </div>

          {/* =================================================================
              ZONA INFERIOR: 3 PÍLDORAS AMIGABLES (IZQUIERDA) + CTA BLANCO PURO (CENTRO) + CONTROLES (DERECHA)
          ================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 pt-4 border-t border-white/10">
            {/* Abajo a la Izquierda: 3 Píldoras Visuales + Frase Inspiradora de Máximo 2 Líneas */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/15">
                  <Clock className="h-3.5 w-3.5 text-[#DAB485]" />
                  <span>
                    {idioma === "es"
                      ? destActual.duracionEs
                      : destActual.duracionEn}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/15">
                  <Compass className="h-3.5 w-3.5 text-[#DAB485]" />
                  <span>
                    {idioma === "es" ? destActual.nivelEs : destActual.nivelEn}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-[#DAB485] backdrop-blur-md border border-white/15">
                  <span>{destActual.precioDesde}</span>
                </span>
              </div>

              <p className="max-w-md text-sm text-white/80 leading-relaxed line-clamp-2">
                {idioma === "es" ? destActual.fraseEs : destActual.fraseEn}
              </p>
            </div>

            {/* Abajo al Centro (Debajo del Portal): Botón Píldora Blanco Puro (#FFFFFF) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={manejarReservaHero}
                className="group inline-flex items-center gap-3 rounded-full bg-white pl-6 pr-2.5 py-2.5 text-sm font-semibold text-[#1C1917] shadow-[0_12px_30px_rgba(0,0,0,0.28)] hover:bg-[#F5F2EB] transition-all duration-300"
              >
                <span>
                  {idioma === "es" ? "Reservar experiencia" : "Book experience"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#26211D] text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* Abajo a la Derecha: Enlaces Rápidos y Controles Suaves del Portal */}
            <div className="lg:col-span-3 flex items-center justify-between lg:justify-end gap-3">
              <Link
                href="/baquiano"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-medium text-white border border-white/15 backdrop-blur-md transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#DAB485]" />
                <span>{idioma === "es" ? "Asistente IA" : "AI Assistant"}</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDestinoHeroIndex(
                      (prev) =>
                        (prev - 1 + DESTINOS_HERO.length) % DESTINOS_HERO.length
                    )
                  }
                  className="rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
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
                  className="rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                  aria-label="Siguiente destino"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BARRA RÁPIDA E INTUITIVA DE RESERVA (DESTINO + FECHA + VIAJEROS)
      ====================================================================== */}
      <section
        aria-label="Reserva rápida de experiencia"
        className="mx-auto max-w-5xl px-4 -mt-6 relative z-20"
      >
        <div className="rounded-3xl bg-[#362F29] border border-white/15 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* Selector de Destino */}
            <div className="rounded-2xl bg-[#26211D]/90 px-4 py-2.5 border border-white/10">
              <label
                htmlFor="quick-destino"
                className="block text-[11px] font-medium text-white/60"
              >
                {idioma === "es" ? "Destino" : "Destination"}
              </label>
              <select
                id="quick-destino"
                value={reservaRapidaCodigo}
                onChange={(e) =>
                  setReservaRapidaCodigo(Number(e.target.value))
                }
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
              >
                <option value={102} className="bg-[#26211D] text-white">
                  Parque Tayrona · Cabo San Juan
                </option>
                <option value={9} className="bg-[#26211D] text-white">
                  Ciudad Perdida · Teyuna (4 Días)
                </option>
                <option value={103} className="bg-[#26211D] text-white">
                  Minca · Bosque de Niebla y Café
                </option>
                <option value={105} className="bg-[#26211D] text-white">
                  Río Don Diego &amp; Sierra Nevada
                </option>
                <option value={104} className="bg-[#26211D] text-white">
                  Bahía Concha &amp; Isla Aguja
                </option>
              </select>
            </div>

            {/* Selector de Fecha */}
            <div className="rounded-2xl bg-[#26211D]/90 px-4 py-2.5 border border-white/10">
              <label
                htmlFor="quick-fecha"
                className="block text-[11px] font-medium text-white/60"
              >
                {idioma === "es" ? "Fecha de salida" : "Departure date"}
              </label>
              <input
                id="quick-fecha"
                type="date"
                value={reservaRapidaFecha}
                onChange={(e) => setReservaRapidaFecha(e.target.value)}
                className="mt-0.5 w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
              />
            </div>

            {/* Selector de Viajeros */}
            <div className="rounded-2xl bg-[#26211D]/90 px-4 py-2.5 border border-white/10">
              <label
                htmlFor="quick-viajeros"
                className="block text-[11px] font-medium text-white/60"
              >
                {idioma === "es" ? "Viajeros" : "Travelers"}
              </label>
              <div className="mt-0.5 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#C89D66]" />
                <select
                  id="quick-viajeros"
                  value={reservaRapidaViajeros}
                  onChange={(e) =>
                    setReservaRapidaViajeros(Number(e.target.value))
                  }
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n} className="bg-[#26211D] text-white">
                      {n} {n === 1 ? "viajero" : "viajeros"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón Directo de Reserva */}
            <button
              type="button"
              onClick={manejarReservaRapida}
              className="h-full min-h-[3.25rem] w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1C1917] shadow-md hover:bg-[#F5F2EB] transition-all flex items-center justify-center gap-2"
            >
              <span>
                {idioma === "es" ? "Iniciar reserva" : "Start booking"}
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 2: SUPERFICIE LUMINOSA EN ARENA ALABASTRO (#F5F2EB) Y TEXTO CARBÓN (#1C1917)
          Mapa Interactivo Simplificado + Fotografías Luminosas + Accesos Directos
      ====================================================================== */}
      <div className="mt-12 rounded-t-[3rem] bg-[#F5F2EB] text-[#1C1917] py-14 sm:py-20">
        <section
          id="cartografia"
          aria-label="Mapa de Experiencias entre el Mar Caribe y la Sierra Nevada"
          className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8"
        >
          {/* Cabecera Limpia con Alto Aire Visual */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C6239]">
                {idioma === "es"
                  ? "Del Caribe a las cumbres"
                  : "From the Caribbean to the peaks"}
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#1C1917]">
                {idioma === "es"
                  ? "Elige tu próximo paisaje"
                  : "Choose your next landscape"}
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
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      activo
                        ? "bg-[#26211D] text-white shadow-sm"
                        : "bg-white text-[#1C1917]/75 hover:bg-[#26211D]/10 border border-[#1C1917]/10"
                    }`}
                  >
                    {idioma === "es" ? opc.labelEs : opc.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grilla Principal: Mapa Orgánico Cálido (Izquierda) + Tarjeta Visual del Destino (Derecha) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Mapa Interactivo en Tonos Piedra Cálida */}
            <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-[#362F29] p-5 sm:p-7 text-white shadow-xl">
              <div className="flex items-center justify-between text-xs text-white/75 pb-4 border-b border-white/10">
                <span className="font-medium">
                  {idioma === "es"
                    ? "Haz clic en un punto del mapa para ver la experiencia"
                    : "Click any point on the map to preview the experience"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-[#DAB485]">
                  Santa Marta &amp; Sierra Nevada
                </span>
              </div>

              <div className="relative my-4 w-full aspect-[16/10]">
                <svg
                  viewBox="0 0 1000 620"
                  className="w-full h-full select-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="warmSeaGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                      <stop offset="70%" stopColor="#0284C7" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#362F29" stopOpacity="0.05" />
                    </linearGradient>
                    <radialGradient
                      id="warmSierraRelief"
                      cx="65%"
                      cy="75%"
                      r="65%"
                    >
                      <stop offset="0%" stopColor="#C89D66" stopOpacity="0.28" />
                      <stop offset="55%" stopColor="#26211D" stopOpacity="0.65" />
                      <stop offset="100%" stopColor="#362F29" stopOpacity="0.95" />
                    </radialGradient>
                  </defs>

                  <style>{`
                    @keyframes softTrail {
                      to { stroke-dashoffset: -100; }
                    }
                    .warm-trail {
                      animation: softTrail 18s linear infinite;
                    }
                  `}</style>

                  <rect
                    x="0"
                    y="0"
                    width="1000"
                    height="620"
                    rx="24"
                    fill="url(#warmSierraRelief)"
                  />

                  {/* Mar Caribe */}
                  <path
                    d="M 0,0 L 1000,0 L 1000,165 Q 820,140 680,152 T 420,132 T 150,175 L 0,175 Z"
                    fill="url(#warmSeaGradient)"
                  />
                  <text
                    x="60"
                    y="75"
                    fill="#BAE6FD"
                    fillOpacity="0.7"
                    fontSize="13"
                    fontWeight="500"
                    letterSpacing="3"
                  >
                    MAR CARIBE
                  </text>

                  {/* Curvas de nivel orgánicas suaves */}
                  <path
                    d="M 0,175 Q 150,175 320,140 Q 500,120 680,150 T 850,155 T 1000,160"
                    fill="none"
                    stroke="#7DD3FC"
                    strokeWidth="2"
                    strokeOpacity="0.65"
                  />
                  <path
                    d="M 80,285 Q 260,250 440,240 Q 640,225 800,265 T 950,285"
                    fill="none"
                    stroke="#F5F2EB"
                    strokeWidth="1.2"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M 140,350 Q 300,310 500,300 Q 700,295 860,360"
                    fill="none"
                    stroke="#F5F2EB"
                    strokeWidth="1.5"
                    strokeOpacity="0.35"
                  />
                  <path
                    d="M 290,490 Q 430,440 590,435 Q 710,450 780,495"
                    fill="none"
                    stroke="#DAB485"
                    strokeWidth="1.8"
                    strokeOpacity="0.55"
                  />

                  {/* Rutas suaves conectadas */}
                  <path
                    d="M 160,200 Q 230,170 320,140 Q 550,135 780,160"
                    fill="none"
                    stroke="#7DD3FC"
                    strokeWidth="2"
                    strokeDasharray="7 6"
                    className="warm-trail"
                  />
                  <path
                    d="M 160,200 Q 210,270 290,320 Q 440,335 620,360"
                    fill="none"
                    stroke="#6EE7B7"
                    strokeWidth="2"
                    strokeDasharray="7 6"
                    className="warm-trail"
                  />
                  <path
                    d="M 290,320 Q 360,420 430,470 Q 560,510 710,535"
                    fill="none"
                    stroke="#DAB485"
                    strokeWidth="2.2"
                    strokeDasharray="7 6"
                    className="warm-trail"
                  />

                  {/* Nodos Interactivos */}
                  {NODOS_TOPOGRAFICOS.map((nodo) => {
                    const esActivo = nodoActivoId === nodo.id;
                    const visible =
                      pisoSeleccionado === "TODOS" ||
                      nodo.pisoTermico === pisoSeleccionado;

                    return (
                      <g
                        key={nodo.id}
                        transform={`translate(${nodo.svgPos.x}, ${nodo.svgPos.y})`}
                        onClick={() => setNodoActivoId(nodo.id)}
                        className="cursor-pointer transition-opacity duration-300"
                        style={{ opacity: visible ? 1 : 0.3 }}
                      >
                        {esActivo && (
                          <circle
                            r="22"
                            fill="#DAB485"
                            fillOpacity="0.28"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          r={esActivo ? 13 : 9}
                          fill={esActivo ? "#FFFFFF" : "#26211D"}
                          stroke="#DAB485"
                          strokeWidth={esActivo ? 3 : 2}
                        />
                        <circle
                          r={esActivo ? 5 : 3.5}
                          fill={esActivo ? "#26211D" : "#DAB485"}
                        />
                        <g
                          transform={`translate(${
                            nodo.svgPos.x > 600 ? -135 : 18
                          }, -12)`}
                        >
                          <rect
                            x="0"
                            y="0"
                            width="126"
                            height="26"
                            rx="13"
                            fill={esActivo ? "#FFFFFF" : "#26211D"}
                            fillOpacity={esActivo ? "0.98" : "0.85"}
                          />
                          <text
                            x="12"
                            y="17"
                            fill={esActivo ? "#1C1917" : "#F5F2EB"}
                            fontSize="11"
                            fontWeight={esActivo ? "700" : "500"}
                          >
                            {nodo.nombre.split("·")[0].trim()}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Botones rápidos de selección debajo del mapa */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                {NODOS_TOPOGRAFICOS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNodoActivoId(n.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      nodoActivoId === n.id
                        ? "bg-white text-[#1C1917] font-semibold"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {n.nombre.split("·")[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta Luminosa del Destino Seleccionado con Fotografía Natural (Sin overlays negros) */}
            <div className="lg:col-span-5 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-6 sm:p-7 text-[#1C1917] shadow-xl border border-[#1C1917]/8">
              <div>
                {/* Fotografía Real Luminosa */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden rounded-2xl bg-[#E6E0D5]">
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
                  <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-[#1C1917] backdrop-blur-md shadow-sm">
                    {idioma === "es"
                      ? nodoActivo.pisoLabelEs
                      : nodoActivo.pisoLabelEn}
                  </div>
                  <div className="absolute top-3 right-3 rounded-full bg-[#26211D]/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                    {nodoActivo.tempCelsius}°C
                  </div>
                </div>

                {/* Título y Descripción Breve */}
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#8C6239]">
                    {nodoActivo.region}
                  </div>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1C1917]">
                    {nodoActivo.nombre}
                  </h3>
                  <p className="mt-2 text-sm text-[#1C1917]/75 leading-relaxed">
                    {idioma === "es"
                      ? nodoActivo.descripcionEs
                      : nodoActivo.descripcionEn}
                  </p>
                </div>

                {/* 3 Píldoras Visuales Claras */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F5F2EB] px-3.5 py-1.5 text-xs font-medium text-[#1C1917]">
                    {idioma === "es"
                      ? nodoActivo.duracionEs
                      : nodoActivo.duracionEn}
                  </span>
                  <span className="rounded-full bg-[#F5F2EB] px-3.5 py-1.5 text-xs font-medium text-[#1C1917]">
                    {idioma === "es" ? nodoActivo.nivelEs : nodoActivo.nivelEn}
                  </span>
                  <span className="rounded-full bg-[#F5F2EB] px-3.5 py-1.5 text-xs font-semibold text-[#8C6239]">
                    {nodoActivo.precioDesde}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
                    {nodoActivo.cuposDisponibles}{" "}
                    {idioma === "es" ? "cupos hoy" : "spots today"}
                  </span>
                </div>
              </div>

              {/* Botón de Reserva y Enlace al Catálogo */}
              <div className="mt-6 pt-5 border-t border-[#1C1917]/10 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => manejarReservaNodo(nodoActivo)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#26211D] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#362F29] transition-all shadow-md"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/15 bg-[#F5F2EB] px-4 py-3.5 text-xs font-semibold text-[#1C1917] hover:bg-[#E6E0D5] transition-colors"
                >
                  <span>{idioma === "es" ? "Ver todos" : "See all"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECCIÓN 3: 3 TARJETAS SIMPLIFICADAS DE ACCESO RÁPIDO
        ==================================================================== */}
        <section
          aria-label="Explora más de TyronaWilds"
          className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 mt-14"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/expediciones"
              className="group flex flex-col justify-between rounded-[2rem] bg-white p-7 shadow-md border border-[#1C1917]/8 hover:shadow-xl transition-all"
            >
              <div>
                <span className="inline-block rounded-full bg-[#F5F2EB] px-3 py-1 text-xs font-semibold text-[#8C6239]">
                  {idioma === "es" ? "Catálogo Completo" : "Full Catalog"}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-[#1C1917] group-hover:text-[#8C6239] transition-colors">
                  {idioma === "es"
                    ? "Destinos y Experiencias"
                    : "Destinations & Experiences"}
                </h3>
                <p className="mt-2 text-sm text-[#1C1917]/70 leading-relaxed">
                  {idioma === "es"
                    ? "Explora nuestras travesías guiadas por el Parque Tayrona, Ciudad Perdida, Minca y arrecifes del Caribe."
                    : "Explore our guided journeys through Tayrona Park, Lost City, Minca, and Caribbean coral reefs."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                <span>
                  {idioma === "es" ? "Ver destinos" : "Explore destinations"}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link
              href="/baquiano"
              className="group flex flex-col justify-between rounded-[2rem] bg-white p-7 shadow-md border border-[#1C1917]/8 hover:shadow-xl transition-all"
            >
              <div>
                <span className="inline-block rounded-full bg-[#F5F2EB] px-3 py-1 text-xs font-semibold text-[#8C6239]">
                  {idioma === "es" ? "Recomendación Personal" : "Personal Match"}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-[#1C1917] group-hover:text-[#8C6239] transition-colors">
                  {idioma === "es"
                    ? "Asistente Baquiano IA"
                    : "Baquiano AI Assistant"}
                </h3>
                <p className="mt-2 text-sm text-[#1C1917]/70 leading-relaxed">
                  {idioma === "es"
                    ? "Cuéntanos tu ritmo de viaje y presupuesto para descubrir la ruta ideal para ti y tus acompañantes."
                    : "Share your travel pace and budget to discover the ideal route for you and your companions."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                <span>
                  {idioma === "es" ? "Hablar con el asistente" : "Ask assistant"}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>

            <Link
              href="/pulso"
              className="group flex flex-col justify-between rounded-[2rem] bg-white p-7 shadow-md border border-[#1C1917]/8 hover:shadow-xl transition-all"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span>{idioma === "es" ? "En tiempo real" : "Live Status"}</span>
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-[#1C1917] group-hover:text-emerald-800 transition-colors">
                  {idioma === "es" ? "Estado del Parque" : "Park Status"}
                </h3>
                <p className="mt-2 text-sm text-[#1C1917]/70 leading-relaxed">
                  {idioma === "es"
                    ? "Consulta el clima actual en Santa Marta, cupos disponibles hoy y recomendaciones para tu visita."
                    : "Check current weather in Santa Marta, available spots today, and tips for your visit."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>
                  {idioma === "es" ? "Ver estado hoy" : "View status today"}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* =====================================================================
          DRAWER / MODAL DE PRODUCTO COMPLETO (GALERÍA, FICHA TÉCNICA Y CHECKOUT)
      ====================================================================== */}
      {actividadSeleccionada && fichaActiva && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-drawer-expedicion"
          className="fixed inset-0 z-50 flex justify-end bg-[#26211D]/80 backdrop-blur-sm"
          onClick={() => setActividadSeleccionada(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-full max-w-4xl overflow-y-auto border-l border-white/15 bg-[#26211D] p-4 sm:p-6 md:p-10 shadow-2xl"
          >
            {/* Barra Superior del Drawer */}
            <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#DAB485]">
                  <span>{actividadSeleccionada.ubicacion}</span>
                </div>
                <h2
                  id="titulo-drawer-expedicion"
                  className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-white"
                >
                  {idioma === "es"
                    ? actividadSeleccionada.nombreEs
                    : actividadSeleccionada.nombreEn}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActividadSeleccionada(null)}
                className="shrink-0 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                {idioma === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            {/* Galería Visual Interactiva Luminosa */}
            <div className="mt-6">
              <div className="relative h-60 sm:h-72 md:h-96 w-full overflow-hidden rounded-2xl border border-white/15 bg-[#362F29]">
                <img
                  src={
                    fichaActiva.galeriaImagenes[indiceFotoActiva] ||
                    actividadSeleccionada.imagenUrl
                  }
                  alt={actividadSeleccionada.nombreEs}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback =
                      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85";
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto rounded-full bg-[#26211D]/85 border border-white/15 px-3.5 py-1 text-xs text-white truncate backdrop-blur-md">
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
                        ? "border-[#DAB485] ring-2 ring-[#DAB485]"
                        : "border-white/15 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Vista ${idx + 1}`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback =
                          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85";
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

            {/* Bloque de Checkout Comercial en 3 Pasos con Pasarela Wompi Sandbox y Pasaporte QR */}
            <div className="mt-8 border-t-2 border-terracotta bg-jungle/15 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-2xl sm:text-3xl uppercase text-sand">
                  {idioma === "es"
                    ? "CHECKOUT & PASARELA WOMPI SANDBOX"
                    : "EXPEDITION CHECKOUT & WOMPI SANDBOX GATEWAY"}
                </h3>
                <span className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
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
                      className="inline-flex items-center gap-2 bg-terracotta px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand hover:bg-ember transition-colors"
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
                      ? "bg-terracotta text-sand"
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
                      ? "bg-terracotta text-sand"
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
                      ? "bg-emerald-600 text-sand"
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
                      className="inline-flex items-center gap-1.5 border border-terracotta/60 bg-terracotta/15 px-3 py-1 font-mono text-[11px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Autocompletar datos de viajero</span>
                    </button>
                  </div>

                  {sesionUsuario && (
                    <div className="flex items-center justify-between border border-emerald-500/35 bg-emerald-950/25 px-3.5 py-2 font-mono text-[11px] text-emerald-300">
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
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
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
                              ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 cursor-not-allowed"
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
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
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
                              ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 cursor-not-allowed"
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
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
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
                              ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200 cursor-not-allowed"
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
                      <div className="border-2 border-terracotta bg-terracotta/15 p-4 font-mono text-xs text-sand">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terracotta/40 pb-2">
                          <span className="flex items-center gap-2 font-bold text-terracotta">
                            <ShieldAlert className="h-4 w-4" />
                            HTTP {erroresCheckout.integridadGrupo.httpStatus || 422}{" "}
                            {erroresCheckout.integridadGrupo.codigo ||
                              "INTEGRIDAD_IDENTIDAD"}
                          </span>
                          <span className="bg-obsidian px-2 py-0.5 text-[10px] text-amber-300 border border-amber-400/40">
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
                    className="w-full flex items-center justify-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors"
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
                      <Lock className="h-4 w-4 text-emerald-400" />
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
                            ? "border-terracotta bg-terracotta/15 text-sand font-bold"
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
                            ? "border-terracotta bg-terracotta/15 text-sand font-bold"
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
                            ? "border-terracotta bg-terracotta/15 text-sand font-bold"
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
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
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
                                ? "border-emerald-400 bg-emerald-950/40 text-emerald-300"
                                : "border-amber-400 bg-amber-950/35 text-amber-200 animate-pulse"
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
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
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
                            className="inline-flex items-center gap-1 border border-terracotta/60 bg-terracotta/15 px-2.5 py-1 text-[10px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
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
                        <div className="mt-1.5 flex justify-between text-emerald-400">
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
                    className="w-full flex items-center justify-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand hover:bg-ember transition-colors disabled:opacity-50"
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
                    <div className="border-2 border-terracotta bg-terracotta/15 p-5 text-sand space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terracotta/40 pb-3">
                        <span className="flex items-center gap-2 font-bold text-terracotta text-sm">
                          <ShieldAlert className="h-5 w-5" />
                          HTTP {resultadoReserva.httpStatus}{" "}
                          {resultadoReserva.errorCodigo || "CONFLICT"}
                        </span>
                        <span className="bg-obsidian px-2.5 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-400/40">
                          ROLLBACK ACID + WOMPI REVERSADO
                        </span>
                      </div>

                      <p className="text-xs text-sand/90 leading-relaxed">
                        {resultadoReserva.errorMensaje}
                      </p>

                      {resultadoReserva.referenciaWompiReversada && (
                        <div className="flex items-center gap-2.5 border border-emerald-400/40 bg-emerald-950/40 p-3 text-emerald-200">
                          <RotateCcw className="h-4 w-4 shrink-0 text-emerald-400" />
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
                            <span className="block text-[11px] font-bold uppercase text-amber-300">
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
                                      <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
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
                                      className="mt-3 w-full bg-sand px-3 py-1.5 text-[10px] font-bold uppercase text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
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
      <footer className="mx-auto max-w-[1440px] border-x border-sand/15 px-4 py-10 sm:px-6 font-mono text-xs text-sand/60">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="font-bold text-sand">TYRONAWILDS™</span> // SANTA
            MARTA D.T.C.H., COLOMBIA · EXPEDICIONES DE ALTA MONTAÑA Y CARIBE
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/mis-reservas"
              className="font-bold text-terracotta hover:text-sand transition-colors"
            >
              Mis Reservas &amp; Pasaportes QR
            </Link>
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
