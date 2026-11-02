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
  palabraClave: string;
  titulo: string;
  region: string;
  altitud: string;
  coordenadas: string;
  imagen: string;
  badge: string;
  descripcion: string;
}

const DESTINOS_HERO: DestinoHeroItem[] = [
  {
    id: "01",
    palabraClave: "TAYRONA",
    titulo: "Santuario de Arrecifes & Selva Litoral",
    region: "PARQUE NACIONAL NATURAL TAYRONA",
    altitud: "0m — 200m MSNM",
    coordenadas: "11°18'04\"N 74°00'45\"W",
    imagen:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85",
    badge: "CONSERVACIÓN COSTERA",
    descripcion:
      "Arrecifes coralinos vírgenes, ensenadas esmeralda y senderos bajo el dosel tropical donde los ecosistemas marinos se funden con los estribos de la Sierra Nevada.",
  },
  {
    id: "02",
    palabraClave: "TEYUNA",
    titulo: "Terrazas Líticas de la Ciudad Perdida",
    region: "CUENCA DEL RÍO BURITACA · ALTA MONTAÑA",
    altitud: "1.200m MSNM",
    coordenadas: "11°02'22\"N 73°55'30\"W",
    imagen:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85",
    badge: "PATRIMONIO ARQUEOLÓGICO",
    descripcion:
      "169 terrazas de piedra talladas en el siglo VIII d.C., conectadas por calzadas precolombinas rodeadas de bosque de niebla y sabiduría de los cuatro pueblos originarios.",
  },
  {
    id: "03",
    palabraClave: "SIERRA",
    titulo: "Glaciares Ancestrales & Cumbres Sagradas",
    region: "MACIZO COLÓN Y BOLÍVAR · LÍMITE NIVAL",
    altitud: "5.775m MSNM",
    coordenadas: "10°50'18\"N 73°41'12\"W",
    imagen:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=85",
    badge: "RESERVA DE LA BIOSFERA",
    descripcion:
      "El macizo montañoso litoral más alto del planeta. Desde el calor del trópico hasta los hielos perpetuos que alimentan 36 cuencas hidrográficas sagradas.",
  },
  {
    id: "04",
    palabraClave: "CARIBE",
    titulo: "Ensenadas Salvajes & Bahías de Coral",
    region: "BAHÍA CONCHA · CHENQUE · GAYRACA",
    altitud: "0m MSNM",
    coordenadas: "11°17'40\"N 74°08'15\"W",
    imagen:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=85",
    badge: "REFUGIO MARINO",
    descripcion:
      "Aguas cristalinas protegidas por formaciones rocosas milenarias, santuarios de tortugas marinas y manglares que actúan como guardianes del litoral caribeño.",
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

  const tempActual = contexto
    ? Math.round(contexto.clima.temperaturaCelsius)
    : 29;
  const humedadActual = contexto
    ? contexto.clima.humedadRelativaPorcentaje
    : 78;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* =====================================================================
          BARRA SUPERIOR GLOBAL MULTIPÁGINA (PÍLDORA FLOTANTE GLASSMORPHISM)
      ====================================================================== */}
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />

      {/* =====================================================================
          SECCIÓN 1: HERO CINEMATOGRÁFICO DE PROFUNDIDAD (SANTA MARTA MONUMENTAL)
          "Texto Monumental situado ópticamente detrás de las cumbres de Santa Marta"
      ====================================================================== */}
      <section
        id="hero"
        aria-label="Hero Cinematográfico de Santa Marta"
        className="relative mx-3 mt-3 sm:mx-4 sm:mt-4 overflow-hidden rounded-3xl border border-white/10 bg-obsidian shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
        onMouseEnter={() => setHeroEnPausa(true)}
        onMouseLeave={() => setHeroEnPausa(false)}
      >
        <div className="relative min-h-[88vh] md:min-h-[92vh] w-full flex flex-col justify-between overflow-hidden">
          {/* =================================================================
              CAPA 1 (FONDO z-10): FOTOGRAFÍA PANORÁMICA DE ALTA RESOLUCIÓN
          ================================================================== */}
          <div className="absolute inset-0 z-10">
            {DESTINOS_HERO.map((dest, idx) => (
              <div
                key={dest.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === destinoHeroIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <img
                  src={dest.imagen}
                  alt={`${dest.palabraClave} · ${dest.region}`}
                  className="h-full w-full object-cover object-center scale-105 transform transition-transform duration-1000 ease-out"
                />
              </div>
            ))}
            {/* Gradientes atmosféricos y oscurecimiento editorial */}
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(13, 38, 28, 0.25) 0%, rgba(10, 10, 10, 0.75) 85%)",
              }}
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-obsidian via-obsidian/45 to-obsidian/30" />
          </div>

          {/* =================================================================
              CAPA 2 (TEXTO MONUMENTAL z-20): PALABRA DETRÁS DE LAS CUMBRES
          ================================================================== */}
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none overflow-hidden px-4">
            <span
              key={destinoHeroIndex}
              className="font-display text-[15vw] font-black tracking-tighter uppercase text-white/80 leading-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-700"
            >
              {DESTINOS_HERO[destinoHeroIndex].palabraClave}
            </span>
          </div>

          {/* =================================================================
              CAPA 3 (RELIEVE / CUMBRES z-30): GRADIENTE ATMOSFÉRICO DE MONTAÑA
              Cubre la mitad inferior del texto monumental creando profundidad
          ================================================================== */}
          <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-t from-obsidian via-obsidian/80 via-40% to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none h-64 bg-gradient-to-t from-obsidian via-obsidian/90 to-transparent" />

          {/* =================================================================
              OVERLAYS DE CONTENIDO (z-40): HUD, MÉTRICAS Y CONTROLES
          ================================================================== */}
          {/* Fila Superior del HUD */}
          <div className="relative z-40 flex w-full flex-wrap items-center justify-between gap-3 p-4 sm:p-6 md:p-8 font-mono text-[11px] sm:text-xs uppercase tracking-[0.16em] text-sand/85">
            <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
              <Compass className="h-4 w-4 shrink-0 text-terracotta" />
              <span>{DESTINOS_HERO[destinoHeroIndex].coordenadas}</span>
              <span className="hidden sm:inline text-sand/40">//</span>
              <span className="hidden sm:inline text-sand/75">
                {DESTINOS_HERO[destinoHeroIndex].altitud}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-terracotta/40 bg-terracotta/15 px-3 py-1 font-mono text-[10px] sm:text-xs font-semibold tracking-widest text-terracotta backdrop-blur-md">
              <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse" />
              <span>{DESTINOS_HERO[destinoHeroIndex].badge}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
              <Sun className="h-4 w-4 shrink-0 text-terracotta" />
              <span>
                {idioma === "es"
                  ? `SANTA MARTA ${tempActual}°C · HUMEDAD ${humedadActual}%`
                  : `SANTA MARTA ${tempActual}°C · HUMIDITY ${humedadActual}%`}
              </span>
              <Wind className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            </div>
          </div>

          {/* Zona Central / Inferior del Hero */}
          <div className="relative z-40 mt-auto w-full p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              {/* Abajo Izquierda: Titular, Métricas y Acciones */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div>
                  <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
                    {DESTINOS_HERO[destinoHeroIndex].region}
                  </div>
                  <h1 className="font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white leading-[0.95]">
                    {DESTINOS_HERO[destinoHeroIndex].titulo}
                  </h1>
                  <p className="mt-3 max-w-2xl text-xs sm:text-sm md:text-base text-sand/85 leading-relaxed font-sans">
                    {DESTINOS_HERO[destinoHeroIndex].descripcion}
                  </p>
                </div>

                {/* 3 Métricas Clave */}
                <div className="grid grid-cols-3 gap-3 border-y border-white/15 py-3 max-w-xl">
                  <div>
                    <div className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      15K+
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-sand/70">
                      {idioma === "es" ? "Hectáreas Protegidas" : "Protected Hectares"}
                    </div>
                  </div>
                  <div className="border-l border-white/15 pl-3">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      24+
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-sand/70">
                      {idioma === "es" ? "Rutas con Baquianos" : "Baquiano Routes"}
                    </div>
                  </div>
                  <div className="border-l border-white/15 pl-3">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                      100%
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-sand/70">
                      {idioma === "es" ? "Trazabilidad de Cupos" : "Slot Traceability"}
                    </div>
                  </div>
                </div>

                {/* Fila de Acción con Botones Píldora */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/expediciones"
                    className="inline-flex items-center gap-2.5 rounded-full bg-terracotta px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember shadow-lg shadow-terracotta/25 transition-all group"
                  >
                    <span>{idioma === "es" ? "RESERVAR AHORA" : "BOOK NOW"}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>

                  <Link
                    href="/baquiano"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 backdrop-blur-md px-5 py-3 font-mono text-xs uppercase tracking-wider text-sand hover:border-terracotta hover:bg-black/60 transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-terracotta" />
                    <span>{idioma === "es" ? "CONSULTAR BAQUIANO AI" : "ASK BAQUIANO AI"}</span>
                  </Link>

                  <Link
                    href="/pulso"
                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-4 py-3 font-mono text-xs uppercase tracking-wider text-sand/80 hover:border-emerald-400 hover:text-emerald-300 transition-all"
                  >
                    <Radio className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{idioma === "es" ? "PULSO TERRITORIAL" : "TERRITORY PULSE"}</span>
                  </Link>
                </div>
              </div>

              {/* Abajo Derecha: Tarjeta Flotante Glassmorphism de Previsualización */}
              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-black/60 p-4 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-sand/75">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-terracotta" />
                      <span>{idioma === "es" ? "SIGUIENTE PARADA" : "NEXT STOP"}</span>
                    </span>
                    <span className="font-bold text-white">
                      0{destinoHeroIndex + 1} <span className="text-terracotta">/</span> 0{DESTINOS_HERO.length}
                    </span>
                  </div>

                  <div
                    onClick={() =>
                      setDestinoHeroIndex(
                        (prev) => (prev + 1) % DESTINOS_HERO.length
                      )
                    }
                    className="group relative mt-3 h-28 w-full cursor-pointer overflow-hidden rounded-xl border border-white/15"
                  >
                    <img
                      src={
                        DESTINOS_HERO[
                          (destinoHeroIndex + 1) % DESTINOS_HERO.length
                        ].imagen
                      }
                      alt={
                        DESTINOS_HERO[
                          (destinoHeroIndex + 1) % DESTINOS_HERO.length
                        ].palabraClave
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-wider text-terracotta">
                          {
                            DESTINOS_HERO[
                              (destinoHeroIndex + 1) % DESTINOS_HERO.length
                            ].region
                          }
                        </div>
                        <div className="font-display text-lg font-bold text-white uppercase tracking-tight leading-tight">
                          {
                            DESTINOS_HERO[
                              (destinoHeroIndex + 1) % DESTINOS_HERO.length
                            ].palabraClave
                          }
                        </div>
                      </div>
                      <span className="rounded-full bg-white/20 p-1.5 backdrop-blur-md group-hover:bg-terracotta text-white transition-colors">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso y Controles */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      {DESTINOS_HERO.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setDestinoHeroIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === destinoHeroIndex
                              ? "w-6 bg-terracotta"
                              : "w-2 bg-white/30 hover:bg-white/60"
                          }`}
                          aria-label={`Ir al destino 0${i + 1}`}
                        />
                      ))}
                    </div>

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
                        className="rounded-full border border-white/20 bg-white/10 p-1.5 text-sand hover:bg-white/20 transition-colors"
                        aria-label="Destino anterior"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroEnPausa(!heroEnPausa)}
                        className="rounded-full border border-white/20 bg-white/10 p-1.5 text-sand hover:bg-white/20 transition-colors"
                        aria-label={heroEnPausa ? "Reanudar" : "Pausar"}
                      >
                        {heroEnPausa ? (
                          <Play className="h-3.5 w-3.5 text-terracotta" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDestinoHeroIndex(
                            (prev) => (prev + 1) % DESTINOS_HERO.length
                          )
                        }
                        className="rounded-full border border-white/20 bg-white/10 p-1.5 text-sand hover:bg-white/20 transition-colors"
                        aria-label="Siguiente destino"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN DE ACCESO RÁPIDO MULTIPÁGINA (3 TARJETAS RESUMEN INTERACTIVAS)
      ====================================================================== */}
      <section
        aria-label="Rutas Multipágina de TYRONAWILDS"
        className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/expediciones"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-sand/15 bg-obsidian/80 p-6 transition-all hover:border-terracotta hover:bg-jungle/20 shadow-md"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-terracotta">
                <span>01 // CATÁLOGO OFICIAL</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-3 font-display text-2xl uppercase tracking-tight text-sand group-hover:text-terracotta transition-colors">
                {idioma === "es" ? "Expediciones & Reservas" : "Expeditions & Booking"}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-sand/70 leading-relaxed font-sans">
                {idioma === "es"
                  ? "Colección curada de 6 travesías de alta montaña y costa caribeña con checkout Wompi Sandbox y asignación de acompañantes nominales."
                  : "Curated collection of 6 high-mountain and Caribbean coastal expeditions with Wompi Sandbox checkout and nominal companion management."}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-sand group-hover:text-terracotta">
              <span>{idioma === "es" ? "VER CATÁLOGO COMPLETO" : "VIEW FULL CATALOG"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/baquiano"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-sand/15 bg-obsidian/80 p-6 transition-all hover:border-terracotta hover:bg-jungle/20 shadow-md"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-terracotta">
                <span>02 // CONCIERGE TERRITORIAL</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-3 font-display text-2xl uppercase tracking-tight text-sand group-hover:text-terracotta transition-colors">
                Baquiano AI Concierge
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-sand/70 leading-relaxed font-sans">
                {idioma === "es"
                  ? "Asesor inteligente en tiempo real que equilibra condición física, presupuesto y ritmos bioculturales con trazabilidad explicable."
                  : "Intelligent real-time concierge matching fitness, budget, and biocultural rhythms with explainable algorithmic traceability."}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-sand group-hover:text-terracotta">
              <span>{idioma === "es" ? "CONSULTAR AHORA" : "CONSULT NOW"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/pulso"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-sand/15 bg-obsidian/80 p-6 transition-all hover:border-terracotta hover:bg-jungle/20 shadow-md"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>03 // TELEMETRÍA EN VIVO</span>
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-3 font-display text-2xl uppercase tracking-tight text-sand group-hover:text-emerald-300 transition-colors">
                {idioma === "es" ? "Pulso del Territorio" : "Territorial Pulse"}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-sand/70 leading-relaxed font-sans">
                {idioma === "es"
                  ? "Monitoreo ambiental continuo: capacidad de carga de playas, alertas DIMAR, clima IDEAM y desvío a senderos de bajo impacto."
                  : "Continuous environmental monitoring: beach carrying capacity, DIMAR marine alerts, IDEAM weather, and quiet low-impact trail diverters."}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300 group-hover:text-emerald-200">
              <span>{idioma === "es" ? "EXPLORAR TELEMETRÍA" : "EXPLORE TELEMETRY"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
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
