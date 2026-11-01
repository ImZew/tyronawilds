"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Compass,
  ShieldAlert,
  Cpu,
  Activity,
  CloudRain,
  Sun,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  Terminal,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Globe,
  UserCheck,
  Database,
  Zap,
  Layers,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Radio,
} from "lucide-react";
import {
  ACTORES_SESION,
  ActividadTuristica,
  ActorSesion,
  ContextoTerritorial,
  DisponibilidadHorario,
  Idioma,
  IndicadorCapacidadDestino,
  PerfilActorId,
  RegistroAuditoria,
  ReporteSimulacionConcurrencia,
  RespuestaCrearReserva,
  ResultadoPruebaSecuencia41,
  ResultadoRecomendacionIa,
  SEED_ACTIVIDADES,
  alternarSimulacionFalloClima,
  cambiarVariabilidadIaBackend,
  crearReservaTransaccional,
  ejecutarRecomendacionIa,
  lanzarRafagaConcurrencia,
  obtenerCatalogoOfertas,
  obtenerContextoTerritorial,
  obtenerDisponibilidades,
  obtenerIndicadoresCapacidad,
  obtenerRegistrosAuditoria,
  probarSecuenciaSeguridad41,
} from "@/lib/api";

const ESTADOS_MAQUINA_42 = [
  {
    id: "Solicitada",
    num: "01",
    tituloEs: "Solicitada",
    tituloEn: "Requested",
    descEs: "POST /api/v1/recomendaciones recibido por Orquestador",
    descEn: "POST /api/v1/recomendaciones received by Orchestrator",
  },
  {
    id: "CargandoPerfil",
    num: "02",
    tituloEs: "CargandoPerfil",
    tituloEn: "LoadingProfile",
    descEs: "Lectura de preferencias y vector de usuario en db_recomendacion",
    descEn: "Reading tourist profile and pgvector in db_recomendacion",
  },
  {
    id: "EnriqueciendoContexto",
    num: "03",
    tituloEs: "EnriqueciendoContexto",
    tituloEn: "EnrichingContext",
    descEs: "Consulta de clima y aforo a integracion-service (Timeout <= 2s)",
    descEn: "Querying weather & capacity via integracion-service (<= 2s)",
  },
  {
    id: "ContextoDegradado",
    num: "04A",
    tituloEs: "ContextoDegradado",
    tituloEn: "DegradedContext",
    descEs: "Contingencia ER-01: Circuit Breaker OPEN -> Snapshot Redis",
    descEn: "ER-01 Contingency: Circuit Breaker OPEN -> Redis Snapshot",
    esContingencia: true,
  },
  {
    id: "Ranqueando",
    num: "05A",
    tituloEs: "Ranqueando",
    tituloEn: "Ranking (IA)",
    descEs: "Similitud coseno pgvector + penalización de sobrecarga (RF-10)",
    descEn: "pgvector cosine similarity + carrying capacity penalty (RF-10)",
  },
  {
    id: "ModoBasico",
    num: "05B",
    tituloEs: "ModoBasico",
    tituloEn: "BasicMode (5.2)",
    descEs: "Variabilidad 5.2: Reglas heurísticas sin inferencia vectorial",
    descEn: "Variability 5.2: Heuristic rules without vector inference",
    esVariabilidad: true,
  },
  {
    id: "GenerandoExplicacion",
    num: "06",
    tituloEs: "GenerandoExplicacion",
    tituloEn: "GeneratingExplanation",
    descEs: "ExplicadorRecomendacion construye justificación ética (RF-12)",
    descEn: "ExplicadorRecomendacion builds ethical rationale (RF-12)",
  },
  {
    id: "FINAL_EXITO",
    num: "07",
    tituloEs: "FINAL_EXITO",
    tituloEn: "FINAL_SUCCESS",
    descEs: "Recomendación explicable entregada y persistida en PostgreSQL",
    descEn: "Explainable recommendation delivered & persisted in PostgreSQL",
  },
];

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function TyronaWildsPage() {
  // Preferencias globales de accesibilidad e internacionalización (RNF-11, RNF-12)
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [altoContraste, setAltoContraste] = useState<boolean>(false);
  const [actorId, setActorId] = useState<PerfilActorId>("TURISTA");
  const actorActual: ActorSesion = ACTORES_SESION[actorId];

  // Estado de conexión y telemetría HUD (RNF-01)
  const [modoConexion, setModoConexion] = useState<
    "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE"
  >("FALLBACK_RESILIENTE");
  const [ultimaLatenciaMs, setUltimaLatenciaMs] = useState<number>(18);
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(true);

  // Datos de dominio
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
  const [auditorias, setAuditorias] = useState<RegistroAuditoria[]>([]);

  // Modal Transaccional de Reservas (CU-03 / ER-02)
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState<ActividadTuristica | null>(null);
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] =
    useState<string>("");
  const [cantidadCupos, setCantidadCupos] = useState<number>(2);
  const [procesandoReserva, setProcesandoReserva] = useState<boolean>(false);
  const [resultadoReserva, setResultadoReserva] =
    useState<RespuestaCrearReserva | null>(null);

  // Motor de Recomendación IA y Máquina de Estados 4.2 (CU-06 / RF-08 / RF-12)
  const [interesesIa, setInteresesIa] = useState<string>(
    "trekking, sierra-nevada, sostenible, cascadas, minca"
  );
  const [priorizarSostenible, setPriorizarSostenible] = useState<boolean>(true);
  const [nivelIa, setNivelIa] = useState<"PERSONALIZADO" | "BASICO">(
    "PERSONALIZADO"
  );
  const [forzarDegradadoIa, setForzarDegradadoIa] = useState<boolean>(false);
  const [resultadoIa, setResultadoIa] =
    useState<ResultadoRecomendacionIa | null>(null);
  const [ejecutandoIa, setEjecutandoIa] = useState<boolean>(false);

  // Laboratorio de Arquitectura en Vivo (Sustentación)
  // Panel 1: Concurrencia ACID (RNF-13 / ER-02)
  const [ejecutandoConcurrencia, setEjecutandoConcurrencia] =
    useState<boolean>(false);
  const [reporteConcurrencia, setReporteConcurrencia] =
    useState<ReporteSimulacionConcurrencia | null>(null);

  // Panel 2: Secuencia de Seguridad 4.1 (AC-05 / ER-04 / RNF-07)
  const [ejecutandoSecuencia41, setEjecutandoSecuencia41] =
    useState<boolean>(false);
  const [resultadoSecuencia41, setResultadoSecuencia41] =
    useState<ResultadoPruebaSecuencia41 | null>(null);

  // Sincronización de modo Alto Contraste (RNF-11 WCAG 2.1 AA)
  useEffect(() => {
    if (altoContraste) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [altoContraste]);

  const cargarTodoElEcosistema = useCallback(async () => {
    setCargandoInicial(true);
    const [resOfertas, resContexto, resDisp, resInd, resAud, resIa] =
      await Promise.all([
        obtenerCatalogoOfertas(),
        obtenerContextoTerritorial(),
        obtenerDisponibilidades(),
        obtenerIndicadoresCapacidad(),
        obtenerRegistrosAuditoria(),
        ejecutarRecomendacionIa(
          ACTORES_SESION.TURISTA,
          "trekking, sierra-nevada, sostenible, cascadas, minca",
          true,
          false,
          "PERSONALIZADO"
        ),
      ]);

    setActividades(resOfertas.data);
    setContexto(resContexto.data);
    setDisponibilidades(resDisp.data);
    setIndicadores(resInd.data);
    setAuditorias(resAud.data);
    setResultadoIa(resIa.data);
    setModoConexion(resOfertas.modoConexion);
    setUltimaLatenciaMs(resOfertas.latenciaMs);
    setCargandoInicial(false);
  }, []);

  useEffect(() => {
    cargarTodoElEcosistema();
  }, [cargarTodoElEcosistema]);

  // Abrir cajón de reserva para una actividad
  const abrirModalReserva = async (actividad: ActividadTuristica) => {
    setActividadSeleccionada(actividad);
    setResultadoReserva(null);
    setCantidadCupos(2);
    const resDisp = await obtenerDisponibilidades(actividad.id);
    setUltimaLatenciaMs(resDisp.latenciaMs);
    const horariosActividad = resDisp.data;
    setDisponibilidades((prev) => {
      const otros = prev.filter((d) => d.actividadId !== actividad.id);
      return [...otros, ...horariosActividad];
    });
    if (horariosActividad.length > 0) {
      setHorarioSeleccionadoId(horariosActividad[0].id);
    }
  };

  // Confirmar reserva ACID (POST /api/v1/reservas)
  const manejarConfirmarReserva = async (forzarSobrecupo = false) => {
    if (!actividadSeleccionada) return;
    const horariosAct = disponibilidades.filter(
      (d) => d.actividadId === actividadSeleccionada.id
    );
    const disp =
      horariosAct.find((d) => d.id === horarioSeleccionadoId) ||
      horariosAct[0];
    if (!disp) return;

    const cuposAPedir = forzarSobrecupo
      ? disp.cuposDisponibles + 5
      : cantidadCupos;

    setProcesandoReserva(true);
    const respuesta = await crearReservaTransaccional(
      actorActual,
      disp,
      cuposAPedir
    );
    setUltimaLatenciaMs(respuesta.latenciaMs);
    setResultadoReserva(respuesta);

    if (respuesta.exito && respuesta.reserva) {
      setDisponibilidades((prev) =>
        prev.map((item) =>
          item.id === disp.id
            ? {
                ...item,
                cuposDisponibles: Math.max(
                  0,
                  item.cuposDisponibles - cuposAPedir
                ),
              }
            : item
        )
      );
      const resAud = await obtenerRegistrosAuditoria();
      setAuditorias(resAud.data);
    }
    setProcesandoReserva(false);
  };

  // Ejecutar Motor de Recomendación IA (CU-06)
  const manejarEjecutarIa = async (
    nivelOverride?: "PERSONALIZADO" | "BASICO",
    degradadoOverride?: boolean
  ) => {
    const nivelEfectivo = nivelOverride ?? nivelIa;
    const degradadoEfectivo =
      degradadoOverride ??
      (forzarDegradadoIa || Boolean(contexto?.simulacionFalloActiva));

    setEjecutandoIa(true);
    const res = await ejecutarRecomendacionIa(
      actorActual,
      interesesIa,
      priorizarSostenible,
      degradadoEfectivo,
      nivelEfectivo
    );
    setResultadoIa(res.data);
    setUltimaLatenciaMs(res.latenciaMs);
    setModoConexion(res.modoConexion);
    setEjecutandoIa(false);
  };

  // Panel 1: Lanzar 30 hilos simultáneos contra 5 cupos (RNF-13 / ER-02)
  const manejarSimulacionConcurrencia = async () => {
    setEjecutandoConcurrencia(true);
    const res = await lanzarRafagaConcurrencia(5, 30);
    setReporteConcurrencia(res.data);
    setUltimaLatenciaMs(res.latenciaMs);
    setModoConexion(res.modoConexion);
    setEjecutandoConcurrencia(false);
  };

  // Panel 2: Ejecutar Secuencia 4.1 (PUT /api/v1/prestadores/77/servicios/9)
  const manejarPruebaSecuencia41 = async (actorForzado?: ActorSesion) => {
    const actor = actorForzado || actorActual;
    setEjecutandoSecuencia41(true);
    const res = await probarSecuenciaSeguridad41(actor);
    setResultadoSecuencia41(res);
    setUltimaLatenciaMs(res.latenciaMs);

    const resAud = await obtenerRegistrosAuditoria();
    if (
      res.httpStatus === 403 &&
      resAud.modoConexion === "FALLBACK_RESILIENTE"
    ) {
      const nuevoEvento: RegistroAuditoria = {
        id: crypto.randomUUID(),
        usuarioId: actor.usuarioId,
        rol: actor.rol,
        accion: "MODIFICAR_OFERTA_AJENA",
        recurso: "oferta-service:/api/v1/prestadores/77/servicios/9",
        resultado: "DENEGADA",
        motivo: res.mensaje,
        ipOrigen: "127.0.0.1",
        traceId: res.traceId,
        fechaOperacion: new Date().toISOString(),
      };
      setAuditorias((prev) => [nuevoEvento, ...prev]);
    } else {
      setAuditorias(resAud.data);
    }
    setEjecutandoSecuencia41(false);
  };

  // Panel 3: Alternar fallo de API de Clima (Circuit Breaker ER-01)
  const manejarToggleFalloClima = async () => {
    const nuevoEstado = !contexto?.simulacionFalloActiva;
    const res = await alternarSimulacionFalloClima(nuevoEstado);
    setContexto(res.data);
    setForzarDegradadoIa(nuevoEstado);
    setUltimaLatenciaMs(res.latenciaMs);
    await manejarEjecutarIa(nivelIa, nuevoEstado);
  };

  // Panel 3: Alternar Ficha de Variabilidad 5.2 (NIVEL_RECOMENDACION_IA)
  const manejarToggleNivelIa = async (nuevoNivel: "PERSONALIZADO" | "BASICO") => {
    setNivelIa(nuevoNivel);
    await cambiarVariabilidadIaBackend(nuevoNivel);
    await manejarEjecutarIa(nuevoNivel, forzarDegradadoIa);
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

  return (
    <div className="min-h-screen bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* =====================================================================
          BARRA SUPERIOR TÉCNICA HUD (4 ESQUINAS / STICKY TELEMETRÍA)
      ====================================================================== */}
      <header className="sticky top-0 z-40 border-b border-sand/15 bg-obsidian/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          {/* Esquina 1: Marca + Estado de Conexión al API Gateway */}
          <div className="flex items-center gap-4">
            <a
              href="#hero"
              className="font-display text-2xl tracking-[0.14em] text-sand hover:text-terracotta transition-colors"
            >
              TYRONAWILDS<span className="text-terracotta">™</span>
            </a>
            <div className="hidden sm:flex items-center gap-2 border border-sand/20 bg-obsidian px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {modoConexion === "BACKEND_GATEWAY_LIVE"
                  ? "GATEWAY :8080 LIVE"
                  : "RESILIENT SEED MODE"}
              </span>
              <span className="text-sand/40">|</span>
              <span className="text-terracotta">{ultimaLatenciaMs}ms</span>
            </div>
          </div>

          {/* Centro: Navegación Editorial */}
          <nav
            aria-label="Navegación Principal"
            className="hidden lg:flex items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] text-sand/75"
          >
            <a
              href="#expediciones"
              className="hover:text-terracotta transition-colors"
            >
              01 // {idioma === "es" ? "EXPEDICIONES" : "EXPEDITIONS"}
            </a>
            <a
              href="#ia-explicable"
              className="hover:text-terracotta transition-colors"
            >
              02 // {idioma === "es" ? "MOTOR IA (4.2)" : "AI ENGINE (4.2)"}
            </a>
            <a
              href="#architecture-lab"
              className="hover:text-terracotta transition-colors"
            >
              03 // {idioma === "es" ? "LAB ARQUITECTURA" : "ARCH LIVE LAB"}
            </a>
            <a
              href="#sostenibilidad"
              className="hover:text-terracotta transition-colors"
            >
              04 // {idioma === "es" ? "CAPACIDAD (CU-07)" : "CAPACITY (CU-07)"}
            </a>
          </nav>

          {/* Esquina Derecha: Selector de Sesión/Rol, Idioma (RNF-12) y Alto Contraste (RNF-11) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Selector de Actor JWT para pruebas RBAC y Secuencia 4.1 */}
            <div className="flex items-center border border-sand/25 bg-obsidian px-2 py-1">
              <UserCheck className="mr-1.5 h-3.5 w-3.5 text-terracotta" />
              <label htmlFor="selector-actor" className="sr-only">
                Rol de Sesión Activo
              </label>
              <select
                id="selector-actor"
                value={actorId}
                onChange={(e) => setActorId(e.target.value as PerfilActorId)}
                className="bg-obsidian font-mono text-[11px] uppercase tracking-wider text-sand focus:outline-none"
              >
                {Object.values(ACTORES_SESION).map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {idioma === "es" ? actor.etiquetaEs : actor.etiquetaEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector Bilingüe ES / EN (RNF-12) */}
            <button
              type="button"
              onClick={() => setIdioma(idioma === "es" ? "en" : "es")}
              className="flex items-center gap-1.5 border border-sand/25 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider hover:border-terracotta hover:text-terracotta transition-colors"
              title="Cambiar idioma (RNF-12)"
            >
              <Globe className="h-3.5 w-3.5 text-terracotta" />
              <span>{idioma.toUpperCase()}</span>
            </button>

            {/* Botón de Alto Contraste WCAG 2.1 AA (RNF-11) */}
            <button
              type="button"
              onClick={() => setAltoContraste(!altoContraste)}
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                altoContraste
                  ? "border-sand bg-sand text-obsidian font-bold"
                  : "border-sand/25 text-sand hover:border-terracotta"
              }`}
              title="Alternar Modo Alto Contraste WCAG 2.1 AA (RNF-11)"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {altoContraste ? "WCAG AA ON" : "CONTRASTE"}
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
        {/* Fotografía de fondo a sangre completa (Sierra Nevada & Tayrona) + Viñeteado */}
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

        {/* Fila Superior del HUD dentro del Hero */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 pt-8 font-mono text-xs uppercase tracking-[0.16em] text-sand/80">
          <div className="flex items-center gap-3">
            <Compass className="h-4 w-4 text-terracotta" />
            <span>11°14&apos;27&quot;N 74°11&apos;56&quot;W // SANTA MARTA, CO</span>
            <span className="hidden md:inline text-sand/40">//</span>
            <span className="hidden md:inline text-sand/65">
              ALTITUD: 0m — 5.775m MSNM (PICO CRISTÓBAL COLÓN)
            </span>
          </div>

          {/* Telemetría viva de integracion-service */}
          <div className="flex flex-wrap items-center gap-3 border border-sand/20 bg-obsidian/80 px-3.5 py-1.5 backdrop-blur-md">
            {contexto?.degradado ? (
              <CloudRain className="h-4 w-4 text-amber-400" />
            ) : (
              <Sun className="h-4 w-4 text-terracotta" />
            )}
            <span>
              {contexto
                ? `${contexto.clima.temperaturaCelsius}°C · ${contexto.clima.condicion}`
                : "29.4°C · SOLEADO_BRISA_CARIBE"}
            </span>
            <span className="text-sand/30">|</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold ${
                contexto?.fuenteDatos === "REDIS_CACHE_FALLBACK"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
              }`}
            >
              {contexto?.fuenteDatos || "LIVE_API"} (CB:{" "}
              {contexto?.estadoCircuitBreaker || "CLOSED"})
            </span>
          </div>
        </div>

        {/* Contenido Central Asimétrico: Titular Monumental Escalonado */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-[1440px] px-6 py-12">
          <div className="mb-4 inline-flex items-center gap-2 border border-terracotta/50 bg-terracotta/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>
              {idioma === "es"
                ? "SISTEMA INTELIGENTE DE GESTIÓN TURÍSTICA SOSTENIBLE · UNIMAGDALENA"
                : "INTELLIGENT SUSTAINABLE TOURISM PLATFORM · UNIMAGDALENA"}
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

          {/* Micro-bloque Editorial + Botón Recto Brutalista */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6 lg:col-start-2 border-l-2 border-terracotta pl-5">
              <p className="text-base md:text-lg text-sand/85 leading-relaxed">
                {idioma === "es"
                  ? "Desde los arrecifes coralinos del Parque Tayrona hasta las terrazas sagradas de Teyuna a 1.200 msnm. Arquitectura de microservicios resiliente con control de capacidad ecológica en tiempo real, reservas ACID sin sobreventa e inteligencia artificial explicable."
                  : "From the coral reefs of Tayrona National Park to the sacred stone terraces of Teyuna at 1,200 masl. Resilient microservices architecture featuring real-time ecological carrying capacity, zero-overbooking ACID reservations and explainable AI."}
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
                href="#architecture-lab"
                className="inline-flex items-center gap-2 border border-sand/30 bg-obsidian/80 px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] text-sand hover:border-terracotta transition-colors"
              >
                <Terminal className="h-4 w-4 text-terracotta" />
                <span>
                  {idioma === "es" ? "CONSOLA SUSTENTACIÓN" : "LIVE ARCH LAB"}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Esquinas Inferiores del HUD: SCROLL TO EXPLORE + 01 / 06 */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between border-t border-sand/15 px-6 py-4 font-mono text-xs uppercase tracking-[0.2em] text-sand/70">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 bg-terracotta" />
            <span>SCROLL TO EXPLORE // SIERRA NEVADA &amp; CARIBE</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[11px]">
            <span> SESIÓN ACTIVA: {actorActual.email}</span>
            <span>ROL: {actorActual.rol}</span>
          </div>

          <div className="font-bold text-sand">
            01 <span className="text-terracotta">/</span> 06
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 2: CATÁLOGO DE EXPEDICIONES Y RESERVA ACID (CU-01, CU-02, CU-03, RF-10)
      ====================================================================== */}
      <section
        id="expediciones"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        {/* Cabecera Editorial de Sección */}
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // SECCIÓN 02 · OFERTA-SERVICE (:8082) &amp; RESERVAS-SERVICE (:8083)
            </div>
            <h2 className="mt-2 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "EXPEDICIONES & AFORO ECOLÓGICO"
                : "EXPEDITIONS & ECOLOGICAL CAPACITY"}
            </h2>
          </div>

          {/* Controles de filtrado (CU-02 / RF-10) */}
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
                labelEs: "COMUNITARIO (ST-03)",
                labelEn: "COMMUNITY (ST-03)",
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
                ? "SOLO BAJA OCUPACIÓN (<80% RF-10)"
                : "LOW OCCUPANCY ONLY (<80% RF-10)"}
            </button>
          </div>
        </div>

        {/* Grilla Brutalista de Expediciones */}
        <div className="mt-10 grid grid-cols-1 gap-0 border-t border-l border-sand/15 md:grid-cols-2 lg:grid-cols-3">
          {actividadesFiltradas.map((act, index) => {
            const sobrecargaCritica = act.nivelOcupacionActual >= 80;
            return (
              <article
                key={act.id}
                className="group relative flex flex-col justify-between border-r border-b border-sand/15 bg-obsidian p-6 transition-colors hover:bg-jungle/25"
              >
                <div>
                  {/* Fila HUD superior de la tarjeta */}
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-sand/65">
                    <span>
                      0{index + 1} // SRV #{act.codigoServicio} · PRESTADOR #
                      {act.codigoPrestador}
                    </span>
                    <span className="flex items-center gap-1 text-terracotta">
                      <Mountain className="h-3.5 w-3.5" />
                      {act.altitudMsnm} MSNM
                    </span>
                  </div>

                  {/* Imagen Editorial con Coordenadas HUD */}
                  <div className="relative mt-4 h-56 w-full overflow-hidden border border-sand/15 bg-jungle/30">
                    <img
                      src={act.imagenUrl}
                      alt={idioma === "es" ? act.nombreEs : act.nombreEn}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />

                    {/* Coordenadas GPS HUD */}
                    <div className="absolute bottom-2.5 left-2.5 bg-obsidian/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-sand border border-sand/20">
                      {act.coordenadasHud}
                    </div>

                    {/* Insignia de Alerta Ambiental RF-10 si supera 80% */}
                    {sobrecargaCritica ? (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-terracotta px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sand shadow-lg">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>ALERTA CAPACIDAD DE CARGA - RF-10</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-950/90 border border-emerald-400/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                        ECOSISTEMA SOSTENIBLE (RF-10 OK)
                      </div>
                    )}
                  </div>

                  {/* Ubicación y Título */}
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

                {/* Bloque Inferior: Barra de Capacidad de Carga + Precio + CTA Reserva */}
                <div className="mt-6 pt-4 border-t border-sand/15">
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                    <span className="text-sand/70">
                      {idioma === "es"
                        ? "OCUPACIÓN DEL ECOSISTEMA"
                        : "ECOSYSTEM OCCUPANCY"}
                    </span>
                    <span
                      className={
                        sobrecargaCritica
                          ? "font-bold text-terracotta"
                          : "text-emerald-400"
                      }
                    >
                      {act.nivelOcupacionActual}% / MAX {act.capacidadMaxima} PAX
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-sand/10 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        sobrecargaCritica ? "bg-terracotta" : "bg-emerald-500"
                      }`}
                      style={{ width: `${act.nivelOcupacionActual}%` }}
                    />
                  </div>

                  {/* Aviso de Desconcentración RF-10 si está en alerta crítica */}
                  {sobrecargaCritica && (
                    <div className="mt-3 border border-terracotta/40 bg-terracotta/10 p-2.5 font-mono text-[11px] text-sand/90">
                      <span className="font-bold text-terracotta">
                        [RF-10 DESCONCENTRACIÓN]:
                      </span>{" "}
                      {idioma === "es"
                        ? "Ruta saturada (>80%). Sugerimos Minca / Cascadas de Marinka (28% aforo)."
                        : "Trail saturated (>80%). We suggest Minca / Marinka Waterfalls (28% occupancy)."}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-sand/50">
                        {idioma === "es" ? "TARIFA OFICIAL" : "OFFICIAL RATE"}
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
                        {idioma === "es" ? "RESERVAR CUPO" : "BOOK SLOT"}
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
          MODAL / CAJÓN DE RESERVA TRANSACCIONAL ACID (CU-03 / ER-02)
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
                  // CU-03 · TRANSACCIÓN ACID PESSIMISTIC_WRITE · RESERVAS-SERVICE
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
                ESC [X]
              </button>
            </div>

            {/* Selección de Horario y Cupos */}
            <div className="mt-6 space-y-5">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-sand/75">
                  1. SELECCIONA HORARIO DISPONIBLE (TABLA DISPONIBILIDAD):
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
                          CUPOS:{" "}
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
                    2. CANTIDAD DE CUPOS A RESERVAR:
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-terracotta" />
                    <input
                      id="input-cupos"
                      type="number"
                      min={1}
                      max={20}
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
                  <span className="block text-sand/60">ACTOR AUTENTICADO:</span>
                  <span className="mt-1 block font-bold text-sand">
                    {actorActual.email}
                  </span>
                  <span className="mt-1 block text-terracotta">
                    TOTAL:{" "}
                    {formatearCop(
                      actividadSeleccionada.precioCop * cantidadCupos
                    )}
                  </span>
                </div>
              </div>

              {/* Botones de Acción: Reserva Normal (201) vs Forzar Conflicto 409 (ER-02) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={procesandoReserva}
                  onClick={() => manejarConfirmarReserva(false)}
                  className="flex-1 bg-terracotta px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember disabled:opacity-50"
                >
                  {procesandoReserva
                    ? "EJECUTANDO SELECT ... FOR UPDATE..."
                    : "CONFIRMAR RESERVA ACID (HTTP 201)"}
                </button>

                <button
                  type="button"
                  disabled={procesandoReserva}
                  onClick={() => manejarConfirmarReserva(true)}
                  className="border border-amber-400/50 bg-amber-950/30 px-4 py-3.5 font-mono text-xs uppercase tracking-wider text-amber-300 hover:bg-amber-950/60"
                  title="Simular solicitud que excede los cupos disponibles para disparar HTTP 409 Conflict (ER-02)"
                >
                  PROBAR CONFLICTO 409 (ER-02)
                </button>
              </div>

              {/* Resultado de la Reserva */}
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
                      HTTP {resultadoReserva.httpStatus} //{" "}
                      {resultadoReserva.exito
                        ? `RESERVA CONFIRMADA (${resultadoReserva.reserva?.codigoReserva})`
                        : resultadoReserva.errorCodigo}
                    </span>
                    <span>{resultadoReserva.latenciaMs} ms</span>
                  </div>

                  {resultadoReserva.exito && resultadoReserva.reserva ? (
                    <div className="mt-2 space-y-1 text-sand/85">
                      <p>
                        ID Transacción: {resultadoReserva.reserva.id} · Cupos:{" "}
                        {resultadoReserva.reserva.cantidadCupos} · Monto:{" "}
                        {formatearCop(resultadoReserva.reserva.montoTotalCop)}
                      </p>
                      <p className="text-emerald-300">
                        Evento ReservaConfirmadaEvent publicado en RabbitMQ
                        hacia indicadores.q y auditoria.q.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      <p>{resultadoReserva.errorMensaje}</p>
                      <p className="text-amber-300">
                        <strong>
                          [ER-02 HORARIOS ALTERNATIVOS SUGERIDOS]:
                        </strong>{" "}
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
          SECCIÓN 3: MOTOR DE RECOMENDACIÓN IA EXPLICABLE + MÁQUINA DE ESTADOS 4.2
      ====================================================================== */}
      <section
        id="ia-explicable"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        <div className="flex flex-col justify-between gap-6 border-b border-sand/15 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // SECCIÓN 03 · RECOMENDACION-SERVICE (:8084) · PGVECTOR + PUNTO 4.2 LAB 3
            </div>
            <h2 className="mt-2 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
              {idioma === "es"
                ? "MOTOR IA EXPLICABLE & MÁQUINA DE ESTADOS"
                : "EXPLAINABLE AI & STATE MACHINE (4.2)"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="border border-sand/20 px-3 py-1.5 text-sand/80">
              FICHA VARIABILIDAD 5.2:{" "}
              <strong className="text-terracotta">{nivelIa}</strong>
            </span>
            <span className="border border-sand/20 px-3 py-1.5 text-sand/80">
              ESTADO FINAL:{" "}
              <strong className="text-emerald-400">
                {resultadoIa?.estadoFinal || "FINAL_EXITO"}
              </strong>
            </span>
          </div>
        </div>

        {/* Formulario de Preferencias del Turista + Controles de Variabilidad */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 border border-sand/20 bg-jungle/15 p-6">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
              <Sparkles className="h-4 w-4" />
              <span>PARÁMETROS DE INFERENCIA TURÍSTICA (CU-06)</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="input-intereses-ia"
                  className="block font-mono text-xs uppercase text-sand/75"
                >
                  INTERESES Y TAGS VECTORIALES DEL TURISTA:
                </label>
                <input
                  id="input-intereses-ia"
                  type="text"
                  value={interesesIa}
                  onChange={(e) => setInteresesIa(e.target.value)}
                  className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-xs text-sand focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => manejarToggleNivelIa("PERSONALIZADO")}
                  className={`border px-3 py-2.5 font-mono text-xs uppercase transition-colors ${
                    nivelIa === "PERSONALIZADO"
                      ? "border-terracotta bg-terracotta text-sand font-bold"
                      : "border-sand/20 bg-obsidian text-sand/70"
                  }`}
                >
                  IA: PERSONALIZADO (PGVECTOR)
                </button>
                <button
                  type="button"
                  onClick={() => manejarToggleNivelIa("BASICO")}
                  className={`border px-3 py-2.5 font-mono text-xs uppercase transition-colors ${
                    nivelIa === "BASICO"
                      ? "border-terracotta bg-terracotta text-sand font-bold"
                      : "border-sand/20 bg-obsidian text-sand/70"
                  }`}
                >
                  IA: MODO BÁSICO (REGLAS 5.2)
                </button>
              </div>

              <div className="flex items-center justify-between border border-sand/15 bg-obsidian p-3 font-mono text-xs">
                <span>SIMULAR CONTEXTO DEGRADADO (ER-01):</span>
                <button
                  type="button"
                  onClick={() => {
                    const nuevo = !forzarDegradadoIa;
                    setForzarDegradadoIa(nuevo);
                    manejarEjecutarIa(nivelIa, nuevo);
                  }}
                  className={`px-3 py-1 font-bold uppercase ${
                    forzarDegradadoIa
                      ? "bg-amber-500 text-obsidian"
                      : "border border-sand/30 text-sand/70"
                  }`}
                >
                  {forzarDegradadoIa ? "ACTIVO (DEGRADADO)" : "INACTIVO (NORMAL)"}
                </button>
              </div>

              <button
                type="button"
                disabled={ejecutandoIa}
                onClick={() => manejarEjecutarIa()}
                className="w-full flex items-center justify-center gap-2 bg-sand px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${ejecutandoIa ? "animate-spin" : ""}`}
                />
                <span>
                  {ejecutandoIa
                    ? "EJECUTANDO ORQUESTADOR..."
                    : "EJECUTAR MOTOR DE RECOMENDACIÓN IA"}
                </span>
              </button>
            </div>
          </div>

          {/* Visualizador Interactivo de la Máquina de Estados (Punto 4.2 del Laboratorio 3) */}
          <div className="lg:col-span-7 border border-sand/20 bg-obsidian p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-sand">
                DIAGRAMA EN VIVO: MÁQUINA DE ESTADOS ORQUESTADOR (PUNTO 4.2)
              </div>
              <span className="font-mono text-[11px] text-terracotta">
                CORRELACIÓN: {resultadoIa?.correlacionId || "tw-rec-init"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ESTADOS_MAQUINA_42.map((est) => {
                const visitado =
                  resultadoIa?.trazaEstados?.includes(est.id) ?? false;
                return (
                  <div
                    key={est.id}
                    className={`border p-3 transition-all ${
                      visitado
                        ? est.esContingencia
                          ? "border-amber-400 bg-amber-950/30 text-sand"
                          : "border-emerald-400/70 bg-emerald-950/25 text-sand"
                        : "border-sand/10 bg-obsidian/50 text-sand/35"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs font-bold">
                      <span>
                        [{est.num}]{" "}
                        {idioma === "es" ? est.tituloEs : est.tituloEn}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] ${
                          visitado
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-sand/5 text-sand/30"
                        }`}
                      >
                        {visitado ? "TRANSITADO" : "OMITIDO"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] leading-snug">
                      {idioma === "es" ? est.descEs : est.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjetas Recomendadas con Bloque de Explicabilidad Ética (RF-12) */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {(resultadoIa?.recomendaciones || []).slice(0, 3).map((rec, idx) => (
            <div
              key={rec.actividadId}
              className="flex flex-col justify-between border border-sand/20 bg-obsidian p-5"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="bg-terracotta px-2.5 py-0.5 font-bold text-sand">
                    RANK #{idx + 1} // AFINIDAD {rec.puntajeAfinidad}%
                  </span>
                  <span className="text-sand/65">
                    OCUPACIÓN: {rec.nivelOcupacionActual}%
                  </span>
                </div>

                <h3 className="mt-3 font-display text-3xl uppercase text-sand">
                  {idioma === "es" ? rec.nombreEs : rec.nombreEn}
                </h3>
                <div className="mt-1 font-mono text-[11px] text-terracotta">
                  {rec.ubicacion} · {rec.coordenadasHud}
                </div>

                {/* Bloque de Explicabilidad Ética (RF-12 / ExplicadorRecomendacion) */}
                <div className="mt-4 border-l-2 border-emerald-400 bg-jungle/30 p-3.5 font-mono text-xs leading-relaxed text-sand/90">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>
                      JUSTIFICACIÓN TRANSPARENTE (RF-12 · EXPLICADOR IA):
                    </span>
                  </div>
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
                  {idioma === "es" ? "RESERVAR AHORA ->" : "BOOK NOW ->"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 4: ARCHITECTURE LIVE LAB (CONSOLA INTERACTIVA DE SUSTENTACIÓN)
      ====================================================================== */}
      <section
        id="architecture-lab"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 bg-jungle/10 px-6 py-16"
      >
        <div className="border-b border-sand/15 pb-6">
          <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand">
            <Terminal className="h-3.5 w-3.5" />
            <span>CONSOLA DE VERIFICACIÓN ARQUITECTÓNICA EN VIVO</span>
          </div>
          <h2 className="mt-3 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
            ARCHITECTURE LIVE LAB // SUSTENTACIÓN
          </h2>
          <p className="mt-2 max-w-3xl font-mono text-xs text-sand/75">
            Ejecuta en vivo las pruebas de los Escenarios de Calidad del
            Laboratorio 3: Control de Concurrencia ACID (RNF-13 / ER-02),
            Secuencia de Seguridad 4.1 (AC-05 / ER-04 / RNF-07) y Circuit
            Breaker de Resiliencia (ER-01 + Variabilidad 5.2).
          </p>
        </div>

        {/* Los 3 Paneles Interactivos del Laboratorio */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* -----------------------------------------------------------------
              PANEL 1: PRUEBA DE ESTRÉS DE CONCURRENCIA ACID (RNF-13 / ER-02)
          ------------------------------------------------------------------ */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 01 · RNF-13 &amp; ER-02</span>
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="mt-2 font-display text-3xl uppercase text-sand">
                CONCURRENCIA ACID &amp; BLOQUEO PESIMISTA
              </h3>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Dispara <strong>30 hilos simultáneos</strong> contra un horario
                de Ciudad Perdida con solo <strong>5 cupos disponibles</strong>{" "}
                usando <code>SELECT ... FOR UPDATE</code> en PostgreSQL.
              </p>

              <button
                type="button"
                disabled={ejecutandoConcurrencia}
                onClick={manejarSimulacionConcurrencia}
                className="mt-5 w-full bg-terracotta px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors disabled:opacity-50"
              >
                {ejecutandoConcurrencia
                  ? "LANZANDO 30 HILOS CONCURRENTES..."
                  : "LANZAR RÁFAGA: 30 HILOS vs 5 CUPOS"}
              </button>

              {reporteConcurrencia && (
                <div className="mt-5 space-y-3 border border-sand/20 bg-jungle/20 p-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-sand/15 bg-obsidian p-2.5">
                      <span className="block text-[10px] text-sand/60">
                        HILOS DISPARADOS
                      </span>
                      <span className="text-lg font-bold text-sand">
                        {reporteConcurrencia.totalHilosConcurrentes}
                      </span>
                    </div>
                    <div className="border border-sand/15 bg-obsidian p-2.5">
                      <span className="block text-[10px] text-sand/60">
                        CUPOS INICIALES
                      </span>
                      <span className="text-lg font-bold text-sand">
                        {reporteConcurrencia.cuposIniciales}
                      </span>
                    </div>
                    <div className="border border-emerald-400/40 bg-emerald-950/30 p-2.5">
                      <span className="block text-[10px] text-emerald-300">
                        CONFIRMADAS (HTTP 201)
                      </span>
                      <span className="text-lg font-bold text-emerald-300">
                        {reporteConcurrencia.reservasExitosasConfirmadas}
                      </span>
                    </div>
                    <div className="border border-amber-400/40 bg-amber-950/30 p-2.5">
                      <span className="block text-[10px] text-amber-300">
                        RECHAZADAS (HTTP 409)
                      </span>
                      <span className="text-lg font-bold text-amber-300">
                        {reporteConcurrencia.conflictos409Bloqueados}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-sand/15 pt-2 text-[11px]">
                    <span>CUPOS FINALES RESTANTES:</span>
                    <strong className="text-emerald-400">
                      {reporteConcurrencia.cuposFinalesRestantes} (SOBREVENTA ={" "}
                      {reporteConcurrencia.sobreasignacionDetectada
                        ? "SÍ"
                        : "0 / FALSE"}
                      )
                    </strong>
                  </div>
                  <div className="text-[10px] text-sand/65">
                    Tiempo: {reporteConcurrencia.tiempoTotalEjecucionMs} ms ·{" "}
                    {reporteConcurrencia.mecanismoProteccion}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/55">
              ENDPOINT: POST /api/v1/reservas/simulacion-concurrencia
            </div>
          </div>

          {/* -----------------------------------------------------------------
              PANEL 2: SECUENCIA DE SEGURIDAD 4.1 Y AUDITORÍA (AC-05 / ER-04)
          ------------------------------------------------------------------ */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 02 · SECUENCIA 4.1 (AC-05 / ER-04)</span>
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="mt-2 font-display text-3xl uppercase text-sand">
                CONTROL PROPIEDAD &amp; AUDITORÍA RABBITMQ
              </h3>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Ejecuta{" "}
                <code>PUT /api/v1/prestadores/77/servicios/9</code> intentando
                modificar la tarifa de Ciudad Perdida como{" "}
                <strong>Prestador #41 (Intruso)</strong> vs{" "}
                <strong>Prestador #77 (Dueño)</strong>.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={ejecutandoSecuencia41}
                  onClick={() =>
                    manejarPruebaSecuencia41(
                      ACTORES_SESION.PRESTADOR_41_INTRUSO
                    )
                  }
                  className="border border-terracotta bg-terracotta/20 px-3 py-3 font-mono text-xs font-bold uppercase text-sand hover:bg-terracotta transition-colors"
                >
                  ATACAR COMO PRESTADOR #41 (403)
                </button>
                <button
                  type="button"
                  disabled={ejecutandoSecuencia41}
                  onClick={() =>
                    manejarPruebaSecuencia41(ACTORES_SESION.PRESTADOR_77)
                  }
                  className="border border-emerald-400/50 bg-emerald-950/30 px-3 py-3 font-mono text-xs font-bold uppercase text-emerald-300 hover:bg-emerald-950/60 transition-colors"
                >
                  EJECUTAR COMO DUEÑO #77 (200)
                </button>
              </div>

              {resultadoSecuencia41 && (
                <div
                  className={`mt-4 border p-3.5 font-mono text-xs ${
                    resultadoSecuencia41.httpStatus === 403
                      ? "border-terracotta bg-terracotta/15 text-sand"
                      : "border-emerald-400/50 bg-emerald-950/30 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      HTTP {resultadoSecuencia41.httpStatus} ·{" "}
                      {resultadoSecuencia41.codigo}
                    </span>
                    <span>{resultadoSecuencia41.latenciaMs} ms</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed">
                    {resultadoSecuencia41.mensaje}
                  </p>
                  <div className="mt-1.5 text-[10px] text-sand/65">
                    TraceId: {resultadoSecuencia41.traceId}
                  </div>
                </div>
              )}

              {/* Bitácora Inmutable de auditoria-service (:8087) */}
              <div className="mt-4">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase text-sand/70">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-terracotta" />
                    BITÁCORA INMUTABLE (AUDITORIA-SERVICE :8087)
                  </span>
                  <span>SOLO INSERT</span>
                </div>
                <div className="mt-2 max-h-44 overflow-y-auto border border-sand/15 bg-obsidian divide-y divide-sand/10 font-mono text-[11px]">
                  {auditorias.slice(0, 4).map((aud) => (
                    <div key={aud.id} className="p-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            aud.resultado === "DENEGADA"
                              ? "text-terracotta"
                              : "text-emerald-400"
                          }`}
                        >
                          [{aud.resultado}] {aud.accion}
                        </span>
                        <span className="text-[10px] text-sand/50">
                          {aud.rol}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-sand/75 truncate">
                        {aud.motivo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/55">
              RABBITMQ: tyronawilds.events.exchange -&gt; auditoria.q
            </div>
          </div>

          {/* -----------------------------------------------------------------
              PANEL 3: CIRCUIT BREAKER RESILIENCIA (ER-01) & VARIABILIDAD 5.2
          ------------------------------------------------------------------ */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 03 · RESILIENCIA ER-01 &amp; VAR 5.2</span>
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="mt-2 font-display text-3xl uppercase text-sand">
                CIRCUIT BREAKER &amp; CONTINGENCIA REDIS
              </h3>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Simula la caída de la API externa de Clima/Aforo en{" "}
                <code>integracion-service (:8085)</code> para verificar el
                fallback automático a caché Redis en menos de 2 segundos.
              </p>

              {/* Interruptor de Fallo de API Externa */}
              <div className="mt-5 border border-sand/20 bg-jungle/20 p-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span>ESTADO CIRCUIT BREAKER:</span>
                  <span
                    className={`px-2 py-0.5 font-bold ${
                      contexto?.simulacionFalloActiva
                        ? "bg-amber-500 text-obsidian"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {contexto?.estadoCircuitBreaker || "CLOSED"} (
                    {contexto?.fuenteDatos || "LIVE_API"})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={manejarToggleFalloClima}
                  className={`mt-3 w-full px-4 py-3 font-bold uppercase tracking-wider transition-colors ${
                    contexto?.simulacionFalloActiva
                      ? "bg-emerald-600 text-sand hover:bg-emerald-500"
                      : "bg-amber-500 text-obsidian hover:bg-amber-400"
                  }`}
                >
                  {contexto?.simulacionFalloActiva
                    ? "RESTAURAR API EXTERNA DE CLIMA (CLOSED)"
                    : "SIMULAR CAÍDA API CLIMA -> FALLBACK REDIS (ER-01)"}
                </button>
              </div>

              {/* Interruptor de Ficha de Variabilidad 5.2 */}
              <div className="mt-4 border border-sand/20 bg-obsidian p-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span>VARIABILIDAD 5.2 (NIVEL_IA):</span>
                  <strong className="text-terracotta">{nivelIa}</strong>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => manejarToggleNivelIa("PERSONALIZADO")}
                    className={`border py-2 text-[11px] font-bold uppercase ${
                      nivelIa === "PERSONALIZADO"
                        ? "border-terracotta bg-terracotta text-sand"
                        : "border-sand/20 text-sand/65"
                    }`}
                  >
                    PERSONALIZADO
                  </button>
                  <button
                    type="button"
                    onClick={() => manejarToggleNivelIa("BASICO")}
                    className={`border py-2 text-[11px] font-bold uppercase ${
                      nivelIa === "BASICO"
                        ? "border-terracotta bg-terracotta text-sand"
                        : "border-sand/20 text-sand/65"
                    }`}
                  >
                    MODO BÁSICO
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/55">
              TIMEOUT CONFIGURADO: 2000ms · RESILIENCE4J CIRCUIT BREAKER
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 5: TABLERO DISTRITAL DE CAPACIDAD DE CARGA (CU-07 / INDICADORES-SERVICE :8086)
      ====================================================================== */}
      <section
        id="sostenibilidad"
        className="mx-auto max-w-[1440px] border-x border-b border-sand/15 px-6 py-16"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-sand/15 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
              // SECCIÓN 04 · INDICADORES-SERVICE (:8086) · GESTOR TURÍSTICO (ST-05 / CU-07)
            </div>
            <h2 className="mt-2 font-display text-5xl uppercase tracking-tight text-sand">
              MONITOREO DISTRITAL DE SOSTENIBILIDAD
            </h2>
          </div>
          <div className="font-mono text-xs text-sand/70">
            ACTUALIZACIÓN ASÍNCRONA VÍA RABBITMQ (INDICADORES.Q)
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
                    {ind.estadoAlerta}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-2xl uppercase text-sand">
                  {ind.nombreDestino}
                </h3>

                <div className="mt-4 font-mono text-xs">
                  <div className="flex justify-between">
                    <span>AFORO ACTUAL:</span>
                    <strong className="text-sand">
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
      </section>

      {/* =====================================================================
          FOOTER TÉCNICO DEL MONOREPO
      ====================================================================== */}
      <footer className="mx-auto max-w-[1440px] border-x border-sand/15 px-6 py-10 font-mono text-xs text-sand/60">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="font-bold text-sand">
              TYRONAWILDS™ (PLATAFORMATURISMOSM)
            </span>{" "}
            // UNIVERSIDAD DEL MAGDALENA · ARQUITECTURA DE SOFTWARE 2026-I
          </div>
          <div className="flex flex-wrap gap-4">
            <span>GATEWAY :8080</span>
            <span>IDENTIDAD :8081</span>
            <span>OFERTA :8082</span>
            <span>RESERVAS :8083</span>
            <span>IA :8084</span>
            <span>INTEGRACIÓN :8085</span>
            <span>INDICADORES :8086</span>
            <span>AUDITORÍA :8087</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
