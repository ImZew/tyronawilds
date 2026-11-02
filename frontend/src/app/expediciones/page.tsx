"use client";

import React, { Suspense, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
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
} from "lucide-react";
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

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

type FiltroDificultadId = "TODAS" | "BAJA" | "MODERADA" | "ALTA";

function clasificarDificultad(codigoServicio: number): FiltroDificultadId {
  const texto = obtenerFichaTecnicaExpedicion(codigoServicio)
    .dificultadEs.toLowerCase();
  if (texto.includes("alta") || texto.includes("exigente")) return "ALTA";
  if (texto.includes("moderada") || texto.includes("media")) return "MODERADA";
  return "BAJA";
}

export default function ExpedicionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-sand/70">
          CARGANDO CATÁLOGO DE EXPEDICIONES...
        </div>
      }
    >
      <ExpedicionesCatalogoContenido />
    </Suspense>
  );
}

function ExpedicionesCatalogoContenido() {
  const searchParams = useSearchParams();
  const reservaParam = searchParams.get("reserva");
  const reservaParamProcesada = useRef<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroDificultad, setFiltroDificultad] =
    useState<FiltroDificultadId>("TODAS");
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [altoContraste, setAltoContraste] = useState<boolean>(false);
  const [sesionUsuario, setSesionUsuario] = useState<SesionAutenticada | null>(
    null
  );
  const [misReservasCount, setMisReservasCount] = useState<number>(0);

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
    if (
      filtroDificultad !== "TODAS" &&
      clasificarDificultad(a.codigoServicio) !== filtroDificultad
    ) {
      return false;
    }
    const q = busqueda.trim().toLowerCase();
    if (q) {
      const texto = `${a.nombreEs} ${a.nombreEn} ${a.ubicacion} ${a.tagsAfinidad} ${a.descripcionEs}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });

  // Apertura directa de una expedición vía /expediciones?reserva=<id | slug | codigoServicio>
  useEffect(() => {
    if (!reservaParam || reservaParamProcesada.current === reservaParam) return;
    const objetivo = actividades.find(
      (a) =>
        a.id === reservaParam ||
        a.slug === reservaParam ||
        String(a.codigoServicio) === reservaParam
    );
    if (objetivo) {
      reservaParamProcesada.current = reservaParam;
      abrirDrawerExpedicion(objetivo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservaParam, actividades]);

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
      <Navbar
        idioma={idioma}
        onCambiarIdioma={setIdioma}
        altoContraste={altoContraste}
        onCambiarAltoContraste={setAltoContraste}
      />


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
              {
                id: "TODAS",
                labelEs: `TODAS (${String(actividades.length).padStart(2, "0")})`,
                labelEn: `ALL (${String(actividades.length).padStart(2, "0")})`,
              },
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

        {/* Buscador + Filtro por Dificultad Física */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sand/45" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                idioma === "es"
                  ? "Buscar por destino, ecosistema o interés (Teyuna, Minca, buceo, aves...)"
                  : "Search by destination, ecosystem or interest (Teyuna, Minca, diving...)"
              }
              className="w-full rounded-full border border-sand/25 bg-obsidian py-3 pl-10 pr-4 font-mono text-xs text-sand placeholder:text-sand/35 focus:border-terracotta focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:col-span-5 lg:justify-end">
            <span className="font-mono text-[11px] uppercase tracking-wider text-sand/55">
              {idioma === "es" ? "Dificultad:" : "Difficulty:"}
            </span>
            {(
              [
                { id: "TODAS", es: "Todas", en: "All" },
                { id: "BAJA", es: "Suave", en: "Easy" },
                { id: "MODERADA", es: "Moderada", en: "Moderate" },
                { id: "ALTA", es: "Alta", en: "Challenging" },
              ] as { id: FiltroDificultadId; es: string; en: string }[]
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setFiltroDificultad(d.id)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase transition-colors ${
                  filtroDificultad === d.id
                    ? "border-sand bg-sand font-bold text-obsidian"
                    : "border-sand/20 text-sand/75 hover:border-sand/50"
                }`}
              >
                {idioma === "es" ? d.es : d.en}
              </button>
            ))}
          </div>
        </div>

        {actividadesFiltradas.length === 0 && (
          <div className="mt-8 border border-sand/20 bg-obsidian p-10 text-center font-mono text-xs text-sand/70">
            {idioma === "es"
              ? "Ninguna expedición coincide con tu búsqueda. Ajusta los filtros o explora todas las rutas."
              : "No expeditions match your search. Adjust the filters to explore all routes."}
          </div>
        )}

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
