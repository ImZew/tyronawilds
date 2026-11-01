"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Terminal,
  Zap,
  Lock,
  Activity,
  Database,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import {
  ACTORES_SESION,
  ActorSesion,
  ContextoTerritorial,
  IndicadorCapacidadDestino,
  PerfilActorId,
  RegistroAuditoria,
  ReporteSimulacionConcurrencia,
  ResultadoPruebaSecuencia41,
  ResultadoRecomendacionIa,
  alternarSimulacionFalloClima,
  cambiarVariabilidadIaBackend,
  ejecutarRecomendacionIa,
  lanzarRafagaConcurrencia,
  obtenerContextoTerritorial,
  obtenerIndicadoresCapacidad,
  obtenerRegistrosAuditoria,
  probarSecuenciaSeguridad41,
} from "@/lib/api";

export default function ArchitectureLiveLabPage() {
  const [actorId, setActorId] = useState<PerfilActorId>("PRESTADOR_41_INTRUSO");
  const actorActual: ActorSesion = ACTORES_SESION[actorId];

  const [modoConexion, setModoConexion] = useState<
    "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE"
  >("FALLBACK_RESILIENTE");
  const [ultimaLatenciaMs, setUltimaLatenciaMs] = useState<number>(14);

  const [contexto, setContexto] = useState<ContextoTerritorial | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorCapacidadDestino[]>(
    []
  );
  const [auditorias, setAuditorias] = useState<RegistroAuditoria[]>([]);

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

  // Panel 3: Variabilidad 5.2 + Máquina de Estados 4.2
  const [nivelIa, setNivelIa] = useState<"PERSONALIZADO" | "BASICO">(
    "PERSONALIZADO"
  );
  const [resultadoIa, setResultadoIa] =
    useState<ResultadoRecomendacionIa | null>(null);

  const cargarTelemetriaLab = useCallback(async () => {
    const [resContexto, resInd, resAud, resIa] = await Promise.all([
      obtenerContextoTerritorial(),
      obtenerIndicadoresCapacidad(),
      obtenerRegistrosAuditoria(),
      ejecutarRecomendacionIa(
        ACTORES_SESION.TURISTA,
        "trekking, sierra-nevada, sostenible, minca",
        true,
        false,
        "PERSONALIZADO"
      ),
    ]);
    setContexto(resContexto.data);
    setIndicadores(resInd.data);
    setAuditorias(resAud.data);
    setResultadoIa(resIa.data);
    setModoConexion(resContexto.modoConexion);
    setUltimaLatenciaMs(resContexto.latenciaMs);
  }, []);

  useEffect(() => {
    cargarTelemetriaLab();
  }, [cargarTelemetriaLab]);

  const manejarSimulacionConcurrencia = async () => {
    setEjecutandoConcurrencia(true);
    const res = await lanzarRafagaConcurrencia(5, 30);
    setReporteConcurrencia(res.data);
    setUltimaLatenciaMs(res.latenciaMs);
    setModoConexion(res.modoConexion);
    setEjecutandoConcurrencia(false);
  };

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

  const manejarToggleFalloClima = async () => {
    const nuevoEstado = !contexto?.simulacionFalloActiva;
    const res = await alternarSimulacionFalloClima(nuevoEstado);
    setContexto(res.data);
    setUltimaLatenciaMs(res.latenciaMs);
    const resIa = await ejecutarRecomendacionIa(
      ACTORES_SESION.TURISTA,
      "trekking, sierra-nevada, sostenible, minca",
      true,
      nuevoEstado,
      nivelIa
    );
    setResultadoIa(resIa.data);
  };

  const manejarToggleNivelIa = async (nuevoNivel: "PERSONALIZADO" | "BASICO") => {
    setNivelIa(nuevoNivel);
    await cambiarVariabilidadIaBackend(nuevoNivel);
    const resIa = await ejecutarRecomendacionIa(
      ACTORES_SESION.TURISTA,
      "trekking, sierra-nevada, sostenible, minca",
      true,
      Boolean(contexto?.simulacionFalloActiva),
      nuevoNivel
    );
    setResultadoIa(resIa.data);
  };

  return (
    <div className="min-h-screen bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* Cabecera Técnica de la Consola /lab */}
      <header className="sticky top-0 z-40 border-b border-sand/15 bg-obsidian/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-sand/25 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-sand hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>VOLVER A STOREFRONT</span>
            </Link>
            <div className="font-display text-2xl tracking-[0.12em] text-sand">
              TYRONAWILDS<span className="text-terracotta">™</span> // SYSTEM
              TELEMETRY &amp; ARCH LAB
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-sand/20 bg-obsidian px-3 py-1.5 font-mono text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {modoConexion === "BACKEND_GATEWAY_LIVE"
                  ? "API GATEWAY :8080 LIVE"
                  : "SEED FALLBACK MODE"}
              </span>
              <span className="text-sand/30">|</span>
              <span className="text-terracotta">{ultimaLatenciaMs} ms</span>
            </div>

            <div className="flex items-center border border-sand/25 bg-obsidian px-2.5 py-1.5">
              <UserCheck className="mr-2 h-3.5 w-3.5 text-terracotta" />
              <select
                value={actorId}
                onChange={(e) => setActorId(e.target.value as PerfilActorId)}
                className="bg-obsidian font-mono text-xs uppercase tracking-wider text-sand focus:outline-none"
              >
                {Object.values(ACTORES_SESION).map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {actor.etiquetaEs}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={cargarTelemetriaLab}
              className="inline-flex items-center gap-1.5 border border-sand/25 px-3 py-1.5 font-mono text-xs uppercase hover:border-terracotta hover:text-terracotta"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>SYNC</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-12">
        {/* Banner Técnico de Diagnóstico */}
        <div className="border border-sand/20 bg-jungle/15 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-sand">
            <Terminal className="h-3.5 w-3.5" />
            <span>DIAGNÓSTICO DE MICROSERVICIOS Y ESCENARIOS DE CALIDAD</span>
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl uppercase tracking-tight text-sand">
            ARCHITECTURE LIVE LAB // CONSOLA DE INGENIERÍA
          </h1>
          <p className="mt-2 max-w-3xl font-mono text-xs text-sand/75 leading-relaxed">
            Entorno aislado de validación para pruebas de estrés de concurrencia
            ACID (RNF-13 / ER-02), verificación de propiedad y auditoría
            asíncrona en RabbitMQ (Secuencia 4.1 / AC-05 / RNF-07), Circuit
            Breaker con degradación a Redis (ER-01) y puntos de variabilidad
            (5.2).
          </p>
        </div>

        {/* Los 3 Paneles Interactivos */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* PANEL 1: CONCURRENCIA ACID */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 01 · RNF-13 &amp; ER-02</span>
                <Zap className="h-4 w-4" />
              </div>
              <h2 className="mt-2 font-display text-3xl uppercase text-sand">
                CONCURRENCIA ACID &amp; BLOQUEO PESIMISTA
              </h2>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Dispara <strong>30 hilos simultáneos</strong> contra un horario
                de Ciudad Perdida con solo <strong>5 cupos disponibles</strong>{" "}
                usando <code>SELECT ... FOR UPDATE</code> en{" "}
                <code>reservas-service (:8083)</code>.
              </p>

              <button
                type="button"
                disabled={ejecutandoConcurrencia}
                onClick={manejarSimulacionConcurrencia}
                className="mt-5 w-full bg-terracotta px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors disabled:opacity-50"
              >
                {ejecutandoConcurrencia
                  ? "EJECUTANDO 30 HILOS CONCURRENTES..."
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
              POST /api/v1/reservas/simulacion-concurrencia
            </div>
          </div>

          {/* PANEL 2: SECUENCIA DE SEGURIDAD 4.1 Y AUDITORÍA */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 02 · SECUENCIA 4.1 (AC-05 / ER-04)</span>
                <Lock className="h-4 w-4" />
              </div>
              <h2 className="mt-2 font-display text-3xl uppercase text-sand">
                PROPIEDAD DEL RECURSO &amp; AUDITORÍA
              </h2>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Ejecuta{" "}
                <code>PUT /api/v1/prestadores/77/servicios/9</code> como{" "}
                <strong>Prestador #41 (Intruso)</strong> vs{" "}
                <strong>Prestador #77 (Dueño)</strong> y verifica la inserción
                en <code>auditoria-service (:8087)</code>.
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

              <div className="mt-4">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase text-sand/70">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-terracotta" />
                    BITÁCORA INMUTABLE (AUDITORIA-SERVICE :8087)
                  </span>
                  <span>APPEND-ONLY</span>
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto border border-sand/15 bg-obsidian divide-y divide-sand/10 font-mono text-[11px]">
                  {auditorias.slice(0, 5).map((aud) => (
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
                      <div className="mt-0.5 text-[10px] text-sand/75">
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

          {/* PANEL 3: CIRCUIT BREAKER RESILIENCIA & VARIABILIDAD 5.2 */}
          <div className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6">
            <div>
              <div className="flex items-center justify-between font-mono text-xs text-terracotta">
                <span>// PANEL 03 · RESILIENCIA ER-01 &amp; VAR 5.2</span>
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="mt-2 font-display text-3xl uppercase text-sand">
                CIRCUIT BREAKER &amp; MÁQUINA DE ESTADOS
              </h2>
              <p className="mt-2 font-mono text-xs text-sand/70 leading-relaxed">
                Simula la caída de la API externa de Clima en{" "}
                <code>integracion-service (:8085)</code> y conmuta en caliente
                la Ficha de Variabilidad 5.2 en{" "}
                <code>recomendacion-service (:8084)</code>.
              </p>

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
                    PERSONALIZADO (PGVECTOR)
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
                    MODO BÁSICO (REGLAS)
                  </button>
                </div>
              </div>

              {resultadoIa && (
                <div className="mt-4 border border-sand/15 bg-obsidian p-3.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-terracotta font-bold">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>TRAZA ORQUESTADOR (PUNTO 4.2):</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {resultadoIa.trazaEstados.map((estado) => (
                      <span
                        key={estado}
                        className="border border-emerald-400/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] text-emerald-300"
                      >
                        {estado}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-sand/15 pt-3 font-mono text-[11px] text-sand/55">
              TIMEOUT: 2000ms · RESILIENCE4J CIRCUIT BREAKER
            </div>
          </div>
        </div>

        {/* Tablero de Indicadores de Capacidad (CU-07 / RF-10) */}
        <div className="mt-10 border border-sand/20 bg-obsidian p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand/15 pb-4">
            <div>
              <span className="font-mono text-xs uppercase text-terracotta">
                // INDICADORES-SERVICE (:8086) · MONITOREO DISTRITAL (CU-07 / RF-10)
              </span>
              <h2 className="mt-1 font-display text-3xl uppercase text-sand">
                CAPACIDAD DE CARGA TURÍSTICA EN TIEMPO REAL
              </h2>
            </div>
            <span className="font-mono text-xs text-sand/60">
              COLA RABBITMQ: indicadores.q
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {indicadores.map((ind) => (
              <div
                key={ind.id}
                className="border border-sand/15 bg-jungle/10 p-4 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-sand/60">{ind.zona}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold ${
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
                <div className="mt-2 font-display text-xl uppercase text-sand">
                  {ind.nombreDestino}
                </div>
                <div className="mt-2 flex justify-between text-[11px]">
                  <span>OCUPACIÓN:</span>
                  <strong>
                    {ind.ocupacionActual}/{ind.capacidadMaxima} (
                    {ind.porcentajeOcupacion}%)
                  </strong>
                </div>
                <div className="mt-2 text-[10px] text-sand/70">
                  Desconcentración: {ind.alternativaSostenibleSugerida}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
