"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  PlusCircle,
  Calendar,
  Clock,
  Users,
  Database,
  Activity,
  Award,
  Mountain,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  Terminal,
  FileText,
  Layers,
} from "lucide-react";
import {
  ACTORES_SESION,
  ActividadTuristica,
  ActorSesion,
  DisponibilidadHorario,
  IndicadorCapacidadDestino,
  RegistroAuditoria,
  ReservaConfirmadaDto,
  ResultadoOperacionB2B,
  actualizarServicioPrestador,
  consultarBitacoraAuditoria,
  consultarIndicadoresCapacidad,
  consultarReservasOperador,
  crearActividad,
  crearDisponibilidad,
  obtenerCatalogoOfertas,
  obtenerDisponibilidades,
} from "@/lib/api";

type RolOperativoB2B =
  | "PRESTADOR_77"
  | "PRESTADOR_41_INTRUSO"
  | "GESTOR_TURISTICO";

type PestanaActiva = "EXPEDICIONES" | "CUPOS_RESERVAS" | "SOSTENIBILIDAD_AUDITORIA";

const PERFILES_OPERATIVOS_B2B: Record<
  RolOperativoB2B,
  {
    id: RolOperativoB2B;
    etiquetaSelector: string;
    rntLicencia: string;
    actor: ActorSesion;
  }
> = {
  PRESTADOR_77: {
    id: "PRESTADOR_77",
    etiquetaSelector:
      "OPERADOR #77 — EXPEDICIONES TAYRONA & SIERRA (RNT-48291 · TITULAR)",
    rntLicencia: "RNT-48291 · TITULAR CERTIFICADO",
    actor: ACTORES_SESION.PRESTADOR_77,
  },
  PRESTADOR_41_INTRUSO: {
    id: "PRESTADOR_41_INTRUSO",
    etiquetaSelector:
      "OPERADOR #41 — OPERADOR CARIBE (RNT-51904 · TERCERO)",
    rntLicencia: "RNT-51904 · OPERADOR MARÍTIMO",
    actor: ACTORES_SESION.PRESTADOR_41_INTRUSO,
  },
  GESTOR_TURISTICO: {
    id: "GESTOR_TURISTICO",
    etiquetaSelector:
      "AUTORIDAD AMBIENTAL — GESTIÓN DE DESTINO & SOSTENIBILIDAD",
    rntLicencia: "DISTRITO DE SANTA MARTA · PNN & DADSA",
    actor: ACTORES_SESION.GESTOR_TURISTICO,
  },
};

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatearFechaHora(iso?: string): string {
  if (!iso) return "01 Nov 2026 · 06:00:00";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PortalOperadoresB2BPage() {
  const [rolB2B, setRolB2B] = useState<RolOperativoB2B>("PRESTADOR_77");
  const perfilActivo = PERFILES_OPERATIVOS_B2B[rolB2B];
  const actorActivo = perfilActivo.actor;

  const [pestana, setPestana] = useState<PestanaActiva>("EXPEDICIONES");
  const [modoConexion, setModoConexion] = useState<
    "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE"
  >("FALLBACK_RESILIENTE");
  const [ultimaLatenciaMs, setUltimaLatenciaMs] = useState<number>(12);

  // Estado sincronizado de los 4 dominios B2B
  const [expediciones, setExpediciones] = useState<ActividadTuristica[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<
    DisponibilidadHorario[]
  >([]);
  const [reservas, setReservas] = useState<ReservaConfirmadaDto[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadorCapacidadDestino[]>(
    []
  );
  const [auditorias, setAuditorias] = useState<RegistroAuditoria[]>([]);

  // ---------------------------------------------------------------------------
  // Pestaña 1A: Drawer / Modal de Edición de Expedición (PUT /api/v1/prestadores/{p}/servicios/{s})
  // ---------------------------------------------------------------------------
  const [expedicionEditando, setExpedicionEditando] =
    useState<ActividadTuristica | null>(null);
  const [editNombreEs, setEditNombreEs] = useState<string>("");
  const [editNombreEn, setEditNombreEn] = useState<string>("");
  const [editCategoria, setEditCategoria] = useState<string>("");
  const [editPrecioCop, setEditPrecioCop] = useState<number>(0);
  const [editCapacidadMax, setEditCapacidadMax] = useState<number>(16);
  const [editOcupacion, setEditOcupacion] = useState<number>(40);
  const [editDescripcionEs, setEditDescripcionEs] = useState<string>("");
  const [editErrores, setEditErrores] = useState<Record<string, string>>({});
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);
  const [resultadoEdicion, setResultadoEdicion] =
    useState<ResultadoOperacionB2B<ActividadTuristica> | null>(null);

  // ---------------------------------------------------------------------------
  // Pestaña 1B: Formulario de Publicación de Nueva Expedición (POST /api/v1/actividades)
  // ---------------------------------------------------------------------------
  const [mostrarFormNuevaExp, setMostrarFormNuevaExp] =
    useState<boolean>(false);
  const [nuevaNombreEs, setNuevaNombreEs] = useState<string>(
    "TRAVESÍA KOGUI CUENCA DEL RÍO PALOMINO"
  );
  const [nuevaNombreEn, setNuevaNombreEn] = useState<string>(
    "KOGUI EXPEDITION PALOMINO RIVER BASIN"
  );
  const [nuevaCategoria, setNuevaCategoria] = useState<string>(
    "TURISMO_COMUNITARIO"
  );
  const [nuevaUbicacion, setNuevaUbicacion] = useState<string>(
    "Cuenca Alta Río Palomino / Sierra Nevada"
  );
  const [nuevaCoordenadas, setNuevaCoordenadas] = useState<string>(
    "11°14'40\"N 73°33'48\"W"
  );
  const [nuevaAltitud, setNuevaAltitud] = useState<number>(380);
  const [nuevaPrecio, setNuevaPrecio] = useState<number>(310000);
  const [nuevaCapacidad, setNuevaCapacidad] = useState<number>(14);
  const [nuevaImagenUrl, setNuevaImagenUrl] = useState<string>(
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80"
  );
  const [nuevaDescripcionEs, setNuevaDescripcionEs] = useState<string>(
    "Ascenso guiado por sabedores indígenas hacia los miradores glaciares del Río Palomino y descenso silencioso hasta el mar Caribe."
  );
  const [nuevaErrores, setNuevaErrores] = useState<Record<string, string>>({});
  const [creandoExpedicion, setCreandoExpedicion] = useState<boolean>(false);
  const [resultadoCreacionExp, setResultadoCreacionExp] =
    useState<ResultadoOperacionB2B<ActividadTuristica> | null>(null);

  // ---------------------------------------------------------------------------
  // Pestaña 2: Formulario de Apertura de Cupos y Salidas (POST /api/v1/disponibilidad)
  // ---------------------------------------------------------------------------
  const [slotActividadId, setSlotActividadId] = useState<string>(
    "a0000000-0000-0000-0000-000000000009"
  );
  const [slotFecha, setSlotFecha] = useState<string>("2026-11-22");
  const [slotHora, setSlotHora] = useState<string>("05:45");
  const [slotCapacidad, setSlotCapacidad] = useState<number>(16);
  const [slotPrecio, setSlotPrecio] = useState<number>(1850000);
  const [slotErrores, setSlotErrores] = useState<Record<string, string>>({});
  const [creandoSlot, setCreandoSlot] = useState<boolean>(false);
  const [resultadoSlot, setResultadoSlot] =
    useState<ResultadoOperacionB2B<DisponibilidadHorario> | null>(null);

  const sincronizarEcosistemaB2B = useCallback(async () => {
    const [resCat, resDisp, resRes, resInd, resAud] = await Promise.all([
      obtenerCatalogoOfertas(),
      obtenerDisponibilidades(),
      consultarReservasOperador(actorActivo),
      consultarIndicadoresCapacidad(),
      consultarBitacoraAuditoria(),
    ]);

    setExpediciones(resCat.data);
    setDisponibilidades(resDisp.data);
    setReservas(resRes.data);
    setIndicadores(resInd.data);
    setAuditorias(resAud.data);
    setModoConexion(resCat.modoConexion);
    setUltimaLatenciaMs(resCat.latenciaMs);
  }, [actorActivo]);

  useEffect(() => {
    sincronizarEcosistemaB2B();
  }, [sincronizarEcosistemaB2B]);

  // Abrir Drawer de edición de una expedición
  const abrirEdicionExpedicion = (act: ActividadTuristica) => {
    setExpedicionEditando(act);
    setEditNombreEs(act.nombreEs);
    setEditNombreEn(act.nombreEn);
    setEditCategoria(act.categoria);
    setEditPrecioCop(act.precioCop);
    setEditCapacidadMax(act.capacidadMaxima);
    setEditOcupacion(act.nivelOcupacionActual);
    setEditDescripcionEs(act.descripcionEs);
    setEditErrores({});
    setResultadoEdicion(null);
  };

  // Guardar Edición de Expedición (valida campo por campo y verifica propiedad en oferta-service)
  const manejarGuardarEdicion = async () => {
    if (!expedicionEditando) return;

    const errores: Record<string, string> = {};
    if (!editNombreEs || editNombreEs.trim().length < 5) {
      errores.nombreEs =
        "El título comercial en español debe tener al menos 5 caracteres.";
    }
    if (!editNombreEn || editNombreEn.trim().length < 5) {
      errores.nombreEn =
        "El título internacional en inglés debe tener al menos 5 caracteres.";
    }
    if (!Number.isFinite(editPrecioCop) || editPrecioCop < 50000) {
      errores.precioCop = "La tarifa comercial mínima permitida es $50.000 COP.";
    }
    if (
      !Number.isFinite(editCapacidadMax) ||
      editCapacidadMax < 1 ||
      editCapacidadMax > 100
    ) {
      errores.capacidadMaxima =
        "La capacidad ecológica por grupo debe estar entre 1 y 100 personas.";
    }
    if (
      !Number.isFinite(editOcupacion) ||
      editOcupacion < 0 ||
      editOcupacion > 100
    ) {
      errores.ocupacion = "El nivel de ocupación debe estar entre 0% y 100%.";
    }
    if (!editDescripcionEs || editDescripcionEs.trim().length < 15) {
      errores.descripcionEs =
        "La descripción técnica debe tener al menos 15 caracteres.";
    }

    setEditErrores(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardandoEdicion(true);
    const res = await actualizarServicioPrestador(
      expedicionEditando.codigoPrestador,
      expedicionEditando.codigoServicio,
      {
        nombreEs: editNombreEs.trim(),
        nombreEn: editNombreEn.trim(),
        categoria: editCategoria,
        precioCop: editPrecioCop,
        capacidadMaxima: editCapacidadMax,
        nivelOcupacionActual: editOcupacion,
        esSostenible: true,
        descripcionEs: editDescripcionEs.trim(),
      },
      actorActivo
    );

    setResultadoEdicion(res);
    setUltimaLatenciaMs(res.latenciaMs);
    setModoConexion(res.modoConexion);

    if (res.exito && res.data) {
      setExpediciones((prev) =>
        prev.map((item) =>
          item.id === expedicionEditando.id ? res.data! : item
        )
      );
      setExpedicionEditando(res.data);
    }

    // Refrescar bitácora de auditoría para reflejar inmediatamente el 200 OK o 403 ACCESO_DENEGADO
    const resAud = await consultarBitacoraAuditoria();
    setAuditorias(resAud.data);
    setGuardandoEdicion(false);
  };

  // Publicar nueva expedición en Santa Marta
  const manejarCrearExpedicion = async () => {
    const errores: Record<string, string> = {};
    if (nuevaNombreEs.trim().length < 5) {
      errores.nombreEs = "Ingresa un título comercial válido en español.";
    }
    if (nuevaUbicacion.trim().length < 4) {
      errores.ubicacion = "Ingresa la zona o sector geográfico en Santa Marta.";
    }
    if (nuevaPrecio < 50000) {
      errores.precioCop = "La tarifa mínima es $50.000 COP.";
    }
    if (nuevaCapacidad < 1 || nuevaCapacidad > 60) {
      errores.capacidad = "Capacidad permitida: entre 1 y 60 viajeros.";
    }
    if (nuevaDescripcionEs.trim().length < 15) {
      errores.descripcionEs =
        "Describe los hitos y medidas de conservación de la ruta.";
    }

    setNuevaErrores(errores);
    if (Object.keys(errores).length > 0) return;

    setCreandoExpedicion(true);
    const codigoGenerado = Math.floor(200 + Math.random() * 799);
    const slugGenerado = nuevaNombreEs
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const res = await crearActividad(
      {
        codigoServicio: codigoGenerado,
        nombreEs: nuevaNombreEs.trim().toUpperCase(),
        nombreEn: nuevaNombreEn.trim().toUpperCase(),
        slug: `${slugGenerado}-${codigoGenerado}`,
        categoria: nuevaCategoria,
        ubicacion: nuevaUbicacion.trim(),
        coordenadasHud: nuevaCoordenadas.trim(),
        altitudMsnm: nuevaAltitud,
        precioCop: nuevaPrecio,
        capacidadMaxima: nuevaCapacidad,
        esSostenible: true,
        imagenUrl: nuevaImagenUrl.trim(),
        descripcionEs: nuevaDescripcionEs.trim(),
        descripcionEn: nuevaDescripcionEs.trim(),
        tagsAfinidad: "sierra-nevada,sostenible,comunitario,naturaleza",
      },
      actorActivo
    );

    setResultadoCreacionExp(res);
    setUltimaLatenciaMs(res.latenciaMs);

    if (res.exito && res.data) {
      setExpediciones((prev) => [res.data!, ...prev]);
    }

    const resAud = await consultarBitacoraAuditoria();
    setAuditorias(resAud.data);
    setCreandoExpedicion(false);
  };

  // Abrir nueva fecha y hora de salida
  const manejarCrearSlot = async () => {
    const errores: Record<string, string> = {};
    if (!slotFecha) {
      errores.fecha = "Selecciona una fecha válida de salida.";
    }
    if (!slotHora) {
      errores.hora = "Indica la hora de encuentro/zarpe.";
    }
    if (slotCapacidad < 1 || slotCapacidad > 60) {
      errores.capacidad = "La capacidad por salida debe ser de 1 a 60 cupos.";
    }
    if (slotPrecio < 50000) {
      errores.precio = "La tarifa unitaria mínima es $50.000 COP.";
    }

    setSlotErrores(errores);
    if (Object.keys(errores).length > 0) return;

    const expAsociada = expediciones.find((e) => e.id === slotActividadId);
    const nombreActividad = expAsociada
      ? expAsociada.nombreEs
      : "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)";

    setCreandoSlot(true);
    const res = await crearDisponibilidad(
      {
        actividadId: slotActividadId,
        nombreActividad,
        fecha: slotFecha,
        horaInicio: slotHora,
        capacidadTotal: slotCapacidad,
        precioUnitarioCop: slotPrecio,
      },
      actorActivo
    );

    setResultadoSlot(res);
    setUltimaLatenciaMs(res.latenciaMs);

    if (res.exito && res.data) {
      setDisponibilidades((prev) => [res.data!, ...prev]);
    }
    const resAud = await consultarBitacoraAuditoria();
    setAuditorias(resAud.data);
    setCreandoSlot(false);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* =====================================================================
          BARRA SUPERIOR DE SESIÓN OPERATIVA B2B (ROLE SWITCHER)
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-sand/15 bg-obsidian/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-sand/25 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-sand hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CATÁLOGO PÚBLICO</span>
            </Link>

            <div className="font-display text-xl sm:text-2xl tracking-[0.12em] text-sand">
              TYRONAWILDS<span className="text-terracotta">™</span> // CONSOLA
              DE OPERADORES RNT &amp; GESTIÓN DE DESTINO
            </div>
          </div>

          {/* Estado del enlace con API Gateway + Role Switcher B2B */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden xl:flex items-center gap-2 border border-sand/20 bg-obsidian px-3 py-1.5 font-mono text-[11px] uppercase">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {modoConexion === "BACKEND_GATEWAY_LIVE"
                  ? "GATEWAY :8080 ONLINE"
                  : "HYBRID SYNC MODE"}
              </span>
              <span className="text-sand/30">|</span>
              <span className="text-terracotta">{ultimaLatenciaMs} ms</span>
            </div>

            {/* Selector de Cuenta Operativa B2B */}
            <div className="flex items-center border border-terracotta/60 bg-jungle/25 px-2.5 py-1.5">
              <Award className="mr-2 h-4 w-4 shrink-0 text-terracotta" />
              <label htmlFor="selector-operador-b2b" className="sr-only">
                Cuenta Operativa Activa
              </label>
              <select
                id="selector-operador-b2b"
                value={rolB2B}
                onChange={(e) => {
                  setRolB2B(e.target.value as RolOperativoB2B);
                  setResultadoEdicion(null);
                  setResultadoCreacionExp(null);
                }}
                className="bg-transparent font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sand focus:outline-none"
              >
                {Object.values(PERFILES_OPERATIVOS_B2B).map((op) => (
                  <option
                    key={op.id}
                    value={op.id}
                    className="bg-obsidian text-sand"
                  >
                    {op.etiquetaSelector}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/lab"
              className="inline-flex items-center gap-1.5 border border-sand/20 px-3 py-1.5 font-mono text-[11px] uppercase text-sand/75 hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-terracotta" />
              <span>/LAB</span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO OPERATIVO B2B Y NAVEGACIÓN POR PESTAÑAS
      ====================================================================== */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="border border-sand/20 bg-jungle/15 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SESIÓN ACTIVA: {perfilActivo.rntLicencia}</span>
              </div>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-sand">
                PORTAL B2B DE OPERADORES &amp; GOBERNANZA AMBIENTAL
              </h1>
              <p className="mt-2 max-w-3xl font-mono text-xs text-sand/75 leading-relaxed">
                Administra tus rutas ecoturísticas certificadas en Santa Marta,
                habilita fechas de salida con control de cupos en tiempo real y
                supervisa la capacidad de carga de cada ecosistema junto a la
                bitácora de auditoría.
              </p>
            </div>

            <div className="border border-sand/20 bg-obsidian p-4 font-mono text-xs shrink-0">
              <div className="text-[10px] uppercase text-sand/55">
                CREDENCIAL DE OPERACIÓN ACTIVA
              </div>
              <div className="mt-1 font-bold text-sand">
                {actorActivo.email}
              </div>
              <div className="mt-0.5 text-terracotta">
                ROL: {actorActivo.rol}{" "}
                {actorActivo.codigoPrestador
                  ? `· TITULAR PRESTADOR #${actorActivo.codigoPrestador}`
                  : "· SUPERVISIÓN DISTRITAL"}
              </div>
            </div>
          </div>

          {/* Barra de las 3 Pestañas del Portal */}
          <div className="mt-8 flex flex-wrap gap-2 border-t border-sand/15 pt-6">
            <button
              type="button"
              onClick={() => setPestana("EXPEDICIONES")}
              className={`inline-flex items-center gap-2 border px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                pestana === "EXPEDICIONES"
                  ? "border-terracotta bg-terracotta text-sand font-bold"
                  : "border-sand/20 bg-obsidian text-sand/75 hover:border-sand/50"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>01 // MIS EXPEDICIONES &amp; OFERTA COMERCIAL</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana("CUPOS_RESERVAS")}
              className={`inline-flex items-center gap-2 border px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                pestana === "CUPOS_RESERVAS"
                  ? "border-terracotta bg-terracotta text-sand font-bold"
                  : "border-sand/20 bg-obsidian text-sand/75 hover:border-sand/50"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>02 // CALENDARIO DE CUPOS, SALIDAS Y RESERVAS</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana("SOSTENIBILIDAD_AUDITORIA")}
              className={`inline-flex items-center gap-2 border px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                pestana === "SOSTENIBILIDAD_AUDITORIA"
                  ? "border-terracotta bg-terracotta text-sand font-bold"
                  : "border-sand/20 bg-obsidian text-sand/75 hover:border-sand/50"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>03 // CAPACIDAD ECOSISTÉMICA &amp; AUDITORÍA</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            PESTAÑA 1: MIS EXPEDICIONES & OFERTA COMERCIAL (oferta-service)
        ==================================================================== */}
        {pestana === "EXPEDICIONES" && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand/15 pb-5">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-terracotta">
                  // OFERTA-SERVICE (:8082) · CONTROL DE TITULARIDAD RNT
                </span>
                <h2 className="mt-1 font-display text-4xl uppercase text-sand">
                  CATÁLOGO DE EXPEDICIONES REGISTRADAS ({expediciones.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormNuevaExp(!mostrarFormNuevaExp);
                    setResultadoCreacionExp(null);
                  }}
                  className="inline-flex items-center gap-2 bg-terracotta px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>
                    {mostrarFormNuevaExp
                      ? "OCULTAR FORMULARIO"
                      : "PUBLICAR NUEVA EXPEDICIÓN RNT"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={sincronizarEcosistemaB2B}
                  className="inline-flex items-center gap-1.5 border border-sand/25 px-4 py-3 font-mono text-xs uppercase text-sand hover:border-terracotta"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>REFRESCAR</span>
                </button>
              </div>
            </div>

            {/* Formulario Desplegable de Publicación de Nueva Expedición */}
            {mostrarFormNuevaExp && (
              <div className="mt-6 border-2 border-terracotta bg-jungle/20 p-6">
                <div className="flex items-center justify-between border-b border-sand/15 pb-3">
                  <h3 className="font-display text-3xl uppercase text-sand">
                    REGISTRO DE NUEVA RUTA ECOTURÍSTICA (POST /api/v1/actividades)
                  </h3>
                  <span className="font-mono text-xs text-terracotta">
                    OPERADOR TITULAR: #{actorActivo.codigoPrestador ?? "N/A"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
                  <div>
                    <label className="block text-sand/70 uppercase">
                      TÍTULO COMERCIAL (ESPAÑOL)
                    </label>
                    <input
                      type="text"
                      value={nuevaNombreEs}
                      onChange={(e) => setNuevaNombreEs(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {nuevaErrores.nombreEs && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {nuevaErrores.nombreEs}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/70 uppercase">
                      TÍTULO INTERNACIONAL (INGLÉS)
                    </label>
                    <input
                      type="text"
                      value={nuevaNombreEn}
                      onChange={(e) => setNuevaNombreEn(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sand/70 uppercase">
                      CATEGORÍA DE ECOSISTEMA
                    </label>
                    <select
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    >
                      <option value="ALTA_MONTANA_ANCESTRAL">
                        ALTA_MONTANA_ANCESTRAL
                      </option>
                      <option value="COSTA_PARQUE_NACIONAL">
                        COSTA_PARQUE_NACIONAL
                      </option>
                      <option value="BOSQUE_NIEBLA_SOSTENIBLE">
                        BOSQUE_NIEBLA_SOSTENIBLE
                      </option>
                      <option value="ECOSISTEMA_MARINO">
                        ECOSISTEMA_MARINO
                      </option>
                      <option value="TURISMO_COMUNITARIO">
                        TURISMO_COMUNITARIO
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sand/70 uppercase">
                      UBICACIÓN / CORREGIMIENTO
                    </label>
                    <input
                      type="text"
                      value={nuevaUbicacion}
                      onChange={(e) => setNuevaUbicacion(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {nuevaErrores.ubicacion && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {nuevaErrores.ubicacion}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/70 uppercase">
                      COORDENADAS GPS HUD
                    </label>
                    <input
                      type="text"
                      value={nuevaCoordenadas}
                      onChange={(e) => setNuevaCoordenadas(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sand/70 uppercase">
                        MSNM
                      </label>
                      <input
                        type="number"
                        value={nuevaAltitud}
                        onChange={(e) =>
                          setNuevaAltitud(parseInt(e.target.value || "0", 10))
                        }
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-2 py-2 text-sand"
                      />
                    </div>
                    <div>
                      <label className="block text-sand/70 uppercase">
                        TARIFA COP
                      </label>
                      <input
                        type="number"
                        value={nuevaPrecio}
                        onChange={(e) =>
                          setNuevaPrecio(parseInt(e.target.value || "0", 10))
                        }
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-2 py-2 text-sand"
                      />
                    </div>
                    <div>
                      <label className="block text-sand/70 uppercase">
                        CUPO MÁX
                      </label>
                      <input
                        type="number"
                        value={nuevaCapacidad}
                        onChange={(e) =>
                          setNuevaCapacidad(
                            parseInt(e.target.value || "1", 10)
                          )
                        }
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-2 py-2 text-sand"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 font-mono text-xs">
                  <div>
                    <label className="block text-sand/70 uppercase">
                      DESCRIPCIÓN EDITORIAL Y PROTOCOLO SOSTENIBLE
                    </label>
                    <textarea
                      rows={2}
                      value={nuevaDescripcionEs}
                      onChange={(e) => setNuevaDescripcionEs(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian p-3 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {nuevaErrores.descripcionEs && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {nuevaErrores.descripcionEs}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/70 uppercase">
                      URL DE FOTOGRAFÍA EDITORIAL
                    </label>
                    <input
                      type="text"
                      value={nuevaImagenUrl}
                      onChange={(e) => setNuevaImagenUrl(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={creandoExpedicion}
                      onClick={manejarCrearExpedicion}
                      className="mt-3 w-full bg-sand px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
                    >
                      {creandoExpedicion
                        ? "REGISTRANDO EN OFERTA-SERVICE..."
                        : "PUBLICAR EXPEDICIÓN EN EL CATÁLOGO OFICIAL"}
                    </button>
                  </div>
                </div>

                {resultadoCreacionExp && (
                  <div
                    className={`mt-4 border p-4 font-mono text-xs ${
                      resultadoCreacionExp.exito
                        ? "border-emerald-400 bg-emerald-950/30 text-emerald-200"
                        : "border-terracotta bg-terracotta/15 text-sand"
                    }`}
                  >
                    <div className="font-bold">
                      {resultadoCreacionExp.exito
                        ? `HTTP ${resultadoCreacionExp.httpStatus} · EXPEDICIÓN PUBLICADA (#${resultadoCreacionExp.data?.codigoServicio})`
                        : resultadoCreacionExp.errorMensaje}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grilla de Expediciones con Indicador de Titularidad RNT */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {expediciones.map((act) => {
                const esTitularDeEstaRuta =
                  actorActivo.codigoPrestador === act.codigoPrestador;
                return (
                  <article
                    key={act.id}
                    className="flex flex-col justify-between border border-sand/20 bg-obsidian p-6 hover:border-sand/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span
                          className={`px-2.5 py-0.5 font-bold uppercase ${
                            esTitularDeEstaRuta
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                              : "bg-sand/10 text-sand/70 border border-sand/20"
                          }`}
                        >
                          PRESTADOR #{act.codigoPrestador}{" "}
                          {esTitularDeEstaRuta ? "(TU TITULARIDAD RNT)" : "(OTRO OPERADOR)"}
                        </span>
                        <span className="text-terracotta">
                          SRV #{act.codigoServicio}
                        </span>
                      </div>

                      <div className="relative mt-4 h-44 w-full overflow-hidden border border-sand/15">
                        <img
                          src={act.imagenUrl}
                          alt={act.nombreEs}
                          className="h-full w-full object-cover opacity-85"
                        />
                        <div className="absolute bottom-2 left-2 bg-obsidian/85 px-2 py-0.5 font-mono text-[10px] text-sand border border-sand/20">
                          {act.coordenadasHud} · {act.altitudMsnm} MSNM
                        </div>
                      </div>

                      <div className="mt-3 font-mono text-[11px] uppercase text-terracotta">
                        {act.ubicacion}
                      </div>
                      <h3 className="mt-1 font-display text-3xl uppercase leading-none text-sand">
                        {act.nombreEs}
                      </h3>
                      <p className="mt-2 text-xs text-sand/70 line-clamp-2">
                        {act.descripcionEs}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-sand/15 pt-4 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-sand/60">TARIFA COMERCIAL:</span>
                        <strong className="text-base text-sand">
                          {formatearCop(act.precioCop)}
                        </strong>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-sand/60">AFORO / CUPO MÁX:</span>
                        <span
                          className={
                            act.nivelOcupacionActual >= 80
                              ? "text-terracotta font-bold"
                              : "text-emerald-400"
                          }
                        >
                          {act.nivelOcupacionActual}% · MÁX {act.capacidadMaxima}{" "}
                          PAX
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-sand/50">
                        <span>ÚLTIMA ACTUALIZACIÓN:</span>
                        <span>{formatearFechaHora(act.fechaActualizacion)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirEdicionExpedicion(act)}
                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                          esTitularDeEstaRuta
                            ? "bg-sand text-obsidian hover:bg-terracotta hover:text-sand"
                            : "border border-terracotta/60 bg-terracotta/15 text-sand hover:bg-terracotta"
                        }`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>
                          {esTitularDeEstaRuta
                            ? "EDITAR MI EXPEDICIÓN (TITULAR)"
                            : `INTENTAR EDITAR SERVICIO DE OPERADOR #${act.codigoPrestador}`}
                        </span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================================
            DRAWER / MODAL DE EDICIÓN DE EXPEDICIÓN Y PRUEBA DE TITULARIDAD RNT
        ==================================================================== */}
        {expedicionEditando && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 p-4 backdrop-blur-sm"
            onClick={() => setExpedicionEditando(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-sand/30 bg-obsidian p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-sand/15 pb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-terracotta">
                    // PUT /api/v1/prestadores/{expedicionEditando.codigoPrestador}
                    /servicios/{expedicionEditando.codigoServicio}
                  </span>
                  <h3 className="mt-1 font-display text-3xl sm:text-4xl uppercase text-sand">
                    GESTIÓN DE SERVICIO RNT #{expedicionEditando.codigoServicio}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setExpedicionEditando(null)}
                  className="border border-sand/25 px-3 py-1.5 font-mono text-xs uppercase text-sand hover:border-terracotta"
                >
                  CERRAR [X]
                </button>
              </div>

              {/* Aviso de sesión actual vs titular del servicio */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-sand/15 bg-jungle/20 p-3 font-mono text-xs">
                <span>
                  TITULAR REGISTRADO:{" "}
                  <strong className="text-sand">
                    OPERADOR #{expedicionEditando.codigoPrestador}
                  </strong>
                </span>
                <span>
                  SESIÓN ACTIVA:{" "}
                  <strong className="text-terracotta">
                    {actorActivo.codigoPrestador
                      ? `OPERADOR #${actorActivo.codigoPrestador}`
                      : actorActivo.rol}
                  </strong>
                </span>
              </div>

              <div className="mt-5 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sand/75 uppercase">
                      TÍTULO COMERCIAL (ES)
                    </label>
                    <input
                      type="text"
                      value={editNombreEs}
                      onChange={(e) => setEditNombreEs(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {editErrores.nombreEs && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {editErrores.nombreEs}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/75 uppercase">
                      TÍTULO INTERNACIONAL (EN)
                    </label>
                    <input
                      type="text"
                      value={editNombreEn}
                      onChange={(e) => setEditNombreEn(e.target.value)}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {editErrores.nombreEn && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {editErrores.nombreEn}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sand/75 uppercase">
                      TARIFA OFICIAL (COP)
                    </label>
                    <input
                      type="number"
                      value={editPrecioCop}
                      onChange={(e) =>
                        setEditPrecioCop(parseInt(e.target.value || "0", 10))
                      }
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {editErrores.precioCop && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {editErrores.precioCop}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/75 uppercase">
                      CAPACIDAD MÁXIMA PAX
                    </label>
                    <input
                      type="number"
                      value={editCapacidadMax}
                      onChange={(e) =>
                        setEditCapacidadMax(parseInt(e.target.value || "1", 10))
                      }
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {editErrores.capacidadMaxima && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {editErrores.capacidadMaxima}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sand/75 uppercase">
                      AFORO ACTUAL (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editOcupacion}
                      onChange={(e) =>
                        setEditOcupacion(parseInt(e.target.value || "0", 10))
                      }
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand focus:border-terracotta focus:outline-none"
                    />
                    {editErrores.ocupacion && (
                      <span className="mt-1 block text-[10px] text-terracotta">
                        {editErrores.ocupacion}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sand/75 uppercase">
                    DESCRIPCIÓN TÉCNICA DE LA EXPEDICIÓN
                  </label>
                  <textarea
                    rows={3}
                    value={editDescripcionEs}
                    onChange={(e) => setEditDescripcionEs(e.target.value)}
                    className="mt-1.5 w-full border border-sand/30 bg-obsidian p-3 text-sand focus:border-terracotta focus:outline-none"
                  />
                  {editErrores.descripcionEs && (
                    <span className="mt-1 block text-[10px] text-terracotta">
                      {editErrores.descripcionEs}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={guardandoEdicion}
                  onClick={manejarGuardarEdicion}
                  className="w-full bg-terracotta px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors disabled:opacity-50"
                >
                  {guardandoEdicion
                    ? "VERIFICANDO CREDENCIALES Y PROPIEDAD RNT..."
                    : "GUARDAR CAMBIOS EN OFERTA COMERCIAL"}
                </button>

                {/* Banner de Respuesta Empresarial: 200 OK vs 403 FORBIDDEN */}
                {resultadoEdicion && (
                  <div
                    className={`mt-4 border p-4 font-mono text-xs ${
                      resultadoEdicion.exito
                        ? "border-emerald-400 bg-emerald-950/35 text-emerald-200"
                        : "border-terracotta bg-terracotta/20 text-sand"
                    }`}
                  >
                    {resultadoEdicion.exito ? (
                      <div>
                        <div className="flex items-center justify-between font-bold text-emerald-300">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            HTTP 200 OK — OFERTA ACTUALIZADA EXITOSAMENTE
                          </span>
                          <span>{resultadoEdicion.latenciaMs} ms</span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-sand/85">
                          Titularidad RNT verificada. Timestamp actualizado:{" "}
                          {formatearFechaHora(
                            resultadoEdicion.data?.fechaActualizacion
                          )}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between font-bold text-terracotta">
                          <span className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            {resultadoEdicion.errorMensaje}
                          </span>
                          <span>{resultadoEdicion.latenciaMs} ms</span>
                        </div>
                        <p className="mt-2 text-[11px] text-sand/90">
                          El servicio <strong>#{expedicionEditando.codigoServicio}</strong>{" "}
                          pertenece exclusivamente al{" "}
                          <strong>
                            Operador #{expedicionEditando.codigoPrestador}
                          </strong>
                          . Este intento no autorizado ha sido bloqueado y
                          registrado en la bitácora inmutable de auditoría con{" "}
                          <code>traceId: {resultadoEdicion.traceId}</code>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 2: CALENDARIO DE CUPOS, SALIDAS Y RESERVAS (reservas-service)
        ==================================================================== */}
        {pestana === "CUPOS_RESERVAS" && (
          <section className="mt-8 space-y-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Formulario para abrir nueva salida */}
              <div className="lg:col-span-5 border border-sand/20 bg-jungle/15 p-6">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
                  // HABILITAR NUEVA SALIDA PROGRAMADA
                </div>
                <h2 className="mt-1 font-display text-3xl uppercase text-sand">
                  APERTURA DE CUPOS EN SENDERO
                </h2>

                <div className="mt-5 space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-sand/75 uppercase">
                      EXPEDICIÓN ASOCIADA
                    </label>
                    <select
                      value={slotActividadId}
                      onChange={(e) => {
                        setSlotActividadId(e.target.value);
                        const act = expediciones.find(
                          (x) => x.id === e.target.value
                        );
                        if (act) setSlotPrecio(act.precioCop);
                      }}
                      className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2.5 text-sand focus:border-terracotta focus:outline-none"
                    >
                      {expediciones.map((e) => (
                        <option key={e.id} value={e.id}>
                          #{e.codigoServicio} · {e.nombreEs}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sand/75 uppercase">
                        FECHA DE SALIDA
                      </label>
                      <input
                        type="date"
                        value={slotFecha}
                        onChange={(e) => setSlotFecha(e.target.value)}
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand"
                      />
                      {slotErrores.fecha && (
                        <span className="mt-1 block text-[10px] text-terracotta">
                          {slotErrores.fecha}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sand/75 uppercase">
                        HORA DE ZARPE / INICIO
                      </label>
                      <input
                        type="time"
                        value={slotHora}
                        onChange={(e) => setSlotHora(e.target.value)}
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sand/75 uppercase">
                        CAPACIDAD TOTAL (PAX)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={slotCapacidad}
                        onChange={(e) =>
                          setSlotCapacidad(parseInt(e.target.value || "1", 10))
                        }
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand"
                      />
                      {slotErrores.capacidad && (
                        <span className="mt-1 block text-[10px] text-terracotta">
                          {slotErrores.capacidad}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sand/75 uppercase">
                        PRECIO UNITARIO COP
                      </label>
                      <input
                        type="number"
                        value={slotPrecio}
                        onChange={(e) =>
                          setSlotPrecio(parseInt(e.target.value || "0", 10))
                        }
                        className="mt-1.5 w-full border border-sand/30 bg-obsidian px-3 py-2 text-sand"
                      />
                      {slotErrores.precio && (
                        <span className="mt-1 block text-[10px] text-terracotta">
                          {slotErrores.precio}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={creandoSlot}
                    onClick={manejarCrearSlot}
                    className="w-full bg-terracotta px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors"
                  >
                    {creandoSlot
                      ? "ABRIENDO CUPOS EN RESERVAS-SERVICE..."
                      : "HABILITAR SALIDA Y CUPOS"}
                  </button>

                  {resultadoSlot && (
                    <div className="border border-emerald-400/50 bg-emerald-950/30 p-3 text-emerald-200">
                      Salida programada habilitada ({resultadoSlot.data?.fecha}{" "}
                      · {resultadoSlot.data?.cuposDisponibles} cupos
                      disponibles).
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla de Salidas Programadas con Barra de Cupos */}
              <div className="lg:col-span-7 border border-sand/20 bg-obsidian p-6">
                <div className="flex items-center justify-between border-b border-sand/15 pb-3">
                  <div>
                    <span className="font-mono text-xs uppercase text-terracotta">
                      // TABLA DISPONIBILIDAD (RESERVAS-SERVICE :8083)
                    </span>
                    <h3 className="font-display text-3xl uppercase text-sand">
                      SALIDAS PROGRAMADAS &amp; INVENTARIO DE CUPOS
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-sand/60">
                    {disponibilidades.length} SALIDAS ACTIVAS
                  </span>
                </div>

                <div className="mt-4 divide-y divide-sand/15 font-mono text-xs">
                  {disponibilidades.map((d) => {
                    const reservados = Math.max(
                      0,
                      d.capacidadTotal - d.cuposDisponibles
                    );
                    const pctOcupado = Math.round(
                      (reservados / Math.max(1, d.capacidadTotal)) * 100
                    );
                    return (
                      <div key={d.id} className="py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sand">
                            {d.nombreActividad}
                          </strong>
                          <span className="text-terracotta">
                            {d.fecha} · {d.horaInicio.slice(0, 5)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-sand/75">
                          <span>
                            DISPONIBLES:{" "}
                            <strong className="text-emerald-400">
                              {d.cuposDisponibles}
                            </strong>{" "}
                            · RESERVADOS: <strong>{reservados}</strong> /{" "}
                            {d.capacidadTotal}
                          </span>
                          <span>{formatearCop(d.precioUnitarioCop)}</span>
                        </div>

                        <div className="mt-1.5 h-2 w-full bg-sand/10">
                          <div
                            className={`h-full ${
                              d.cuposDisponibles <= 4
                                ? "bg-terracotta"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${pctOcupado}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Listado de Pasaportes de Reserva Emitidos */}
            <div className="border border-sand/20 bg-obsidian p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-terracotta">
                    // PASAPORTES DE EXPEDICIÓN EMITIDOS (GET /api/v1/reservas)
                  </span>
                  <h3 className="font-display text-3xl uppercase text-sand">
                    RESERVAS CONFIRMADAS ({reservas.length})
                  </h3>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-sand/20 text-[11px] uppercase text-sand/60">
                    <tr>
                      <th className="py-2.5 pr-4">CÓDIGO PASAPORTE</th>
                      <th className="py-2.5 pr-4">ESTADO</th>
                      <th className="py-2.5 pr-4">CUPOS</th>
                      <th className="py-2.5 pr-4">MONTO TOTAL</th>
                      <th className="py-2.5">FECHA EMISIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/10">
                    {reservas.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 pr-4 font-bold text-terracotta">
                          {r.codigoReserva}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            {r.estadoReserva}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{r.cantidadCupos} PAX</td>
                        <td className="py-3 pr-4 font-bold">
                          {formatearCop(r.montoTotalCop)}
                        </td>
                        <td className="py-3 text-sand/65">
                          {formatearFechaHora(r.fechaOperacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            PESTAÑA 3: CAPACIDAD DE CARGA ECOSISTÉMICA & AUDITORÍA
        ==================================================================== */}
        {pestana === "SOSTENIBILIDAD_AUDITORIA" && (
          <section className="mt-8 space-y-10">
            {/* Tarjetas de Monitoreo Ambiental por Zona */}
            <div>
              <div className="border-b border-sand/15 pb-4">
                <span className="font-mono text-xs uppercase text-terracotta">
                  // INDICADORES-SERVICE (:8086) · GOBERNANZA AMBIENTAL DISTRITAL
                </span>
                <h2 className="mt-1 font-display text-4xl uppercase text-sand">
                  CAPACIDAD DE CARGA ECOSISTÉMICA POR ZONA
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {indicadores.map((ind) => (
                  <div
                    key={ind.id}
                    className="flex flex-col justify-between border border-sand/20 bg-obsidian p-5"
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
                          {ind.estadoAlerta}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl uppercase text-sand">
                        {ind.nombreDestino}
                      </h3>

                      <div className="mt-4 font-mono text-xs">
                        <div className="flex justify-between">
                          <span>OCUPACIÓN ACTUAL:</span>
                          <strong>
                            {ind.ocupacionActual} / {ind.capacidadMaxima} (
                            {ind.porcentajeOcupacion}%)
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
                        RUTA ALTERNATIVA DE DESCONCENTRACIÓN:
                      </span>
                      {ind.alternativaSostenibleSugerida}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla de Trazabilidad y Bitácora Inmutable de Auditoría */}
            <div className="border border-sand/20 bg-obsidian p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-4">
                <div>
                  <span className="font-mono text-xs uppercase text-terracotta">
                    // AUDITORIA-SERVICE (:8087) · BITÁCORA INMUTABLE APPEND-ONLY
                  </span>
                  <h2 className="mt-1 font-display text-3xl uppercase text-sand">
                    TRAZABILIDAD DE OPERACIONES Y BLOQUEOS DE SEGURIDAD (403)
                  </h2>
                </div>
                <span className="font-mono text-xs text-sand/60">
                  {auditorias.length} EVENTOS REGISTRADOS
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-sand/20 text-[11px] uppercase text-sand/60">
                    <tr>
                      <th className="py-2.5 pr-4">RESULTADO</th>
                      <th className="py-2.5 pr-4">ACCIÓN</th>
                      <th className="py-2.5 pr-4">ROL / USUARIO</th>
                      <th className="py-2.5 pr-4">DETALLE / MOTIVO</th>
                      <th className="py-2.5 pr-4">TRACE ID / IP</th>
                      <th className="py-2.5">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/10">
                    {auditorias.map((aud) => (
                      <tr key={aud.id}>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold ${
                              aud.resultado === "DENEGADA"
                                ? "bg-terracotta text-sand"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {aud.resultado}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-bold text-sand">
                          {aud.accion}
                        </td>
                        <td className="py-3 pr-4 text-sand/80">
                          {aud.rol}
                          <span className="block text-[10px] text-sand/50">
                            {aud.usuarioId.slice(0, 13)}...
                          </span>
                        </td>
                        <td className="py-3 pr-4 max-w-md text-sand/85">
                          {aud.motivo}
                        </td>
                        <td className="py-3 pr-4 text-[11px] text-terracotta">
                          {aud.traceId}
                          <span className="block text-[10px] text-sand/50">
                            IP: {aud.ipOrigen}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-sand/65">
                          {formatearFechaHora(aud.fechaOperacion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
