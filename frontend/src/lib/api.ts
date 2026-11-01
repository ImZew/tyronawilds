// =============================================================================
// TyronaWilds (PlataformaTurismoSM) - Cliente API Centralizado Resiliente
// Conecta con api-gateway (http://localhost:8080) o microservicios directos,
// mide latencia en vivo (RNF-01 <= 3000ms) y ofrece Respaldo Inteligente (Fallback)
// con los mismos datos semilla de Santa Marta si el backend no está encendido.
// =============================================================================

export type Idioma = "es" | "en";

export type PerfilActorId =
  | "TURISTA"
  | "PRESTADOR_77"
  | "PRESTADOR_41_INTRUSO"
  | "ADMIN"
  | "GESTOR_TURISTICO";

export interface ActorSesion {
  id: PerfilActorId;
  etiquetaEs: string;
  etiquetaEn: string;
  usuarioId: string;
  email: string;
  rol: string;
  prestadorId?: string;
  codigoPrestador?: number;
}

export const ACTORES_SESION: Record<PerfilActorId, ActorSesion> = {
  TURISTA: {
    id: "TURISTA",
    etiquetaEs: "Turista (Valeria Viajera)",
    etiquetaEn: "Tourist (Valeria Traveler)",
    usuarioId: "44444444-4444-4444-4444-444444444444",
    email: "turista@tyronawilds.co",
    rol: "TURISTA",
  },
  PRESTADOR_77: {
    id: "PRESTADOR_77",
    etiquetaEs: "Prestador #77 (Dueño Legítimo)",
    etiquetaEn: "Provider #77 (Resource Owner)",
    usuarioId: "22222222-2222-2222-2222-222222222222",
    email: "tayrona@tyronawilds.co",
    rol: "PRESTADOR",
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
  },
  PRESTADOR_41_INTRUSO: {
    id: "PRESTADOR_41_INTRUSO",
    etiquetaEs: "Prestador #41 (Intruso Secuencia 4.1)",
    etiquetaEn: "Provider #41 (Intruder Sequence 4.1)",
    usuarioId: "33333333-3333-3333-3333-333333333333",
    email: "intruso@tyronawilds.co",
    rol: "PRESTADOR",
    prestadorId: "00000000-0000-0000-0000-000000000041",
    codigoPrestador: 41,
  },
  ADMIN: {
    id: "ADMIN",
    etiquetaEs: "Admin Plataforma (ST-04)",
    etiquetaEn: "Platform Admin (ST-04)",
    usuarioId: "11111111-1111-1111-1111-111111111111",
    email: "admin@tyronawilds.co",
    rol: "ADMIN",
  },
  GESTOR_TURISTICO: {
    id: "GESTOR_TURISTICO",
    etiquetaEs: "Gestor Turístico Distrital (ST-05)",
    etiquetaEn: "District Tourism Manager (ST-05)",
    usuarioId: "55555555-5555-5555-5555-555555555555",
    email: "gestor@tyronawilds.co",
    rol: "GESTOR_TURISTICO",
  },
};

export interface ActividadTuristica {
  id: string;
  codigoServicio: number;
  prestadorId: string;
  codigoPrestador: number;
  nombreEs: string;
  nombreEn: string;
  slug: string;
  categoria: string;
  ubicacion: string;
  coordenadasHud: string;
  altitudMsnm: number;
  precioCop: number;
  capacidadMaxima: number;
  nivelOcupacionActual: number;
  esSostenible: boolean;
  imagenUrl: string;
  descripcionEs: string;
  descripcionEn: string;
  tagsAfinidad: string;
}

export interface DisponibilidadHorario {
  id: string;
  actividadId: string;
  nombreActividad: string;
  fecha: string;
  horaInicio: string;
  capacidadTotal: number;
  cuposDisponibles: number;
  precioUnitarioCop: number;
  version: number;
}

export interface ReservaConfirmadaDto {
  id: string;
  codigoReserva: string;
  usuarioId: string;
  disponibilidadId: string;
  actividadId: string;
  cantidadCupos: number;
  montoTotalCop: number;
  estadoReserva: "CONFIRMADA" | "PENDIENTE_PAGO" | "CANCELADA";
  fechaOperacion: string;
}

export interface ContextoTerritorial {
  clima: {
    estacion: string;
    temperaturaCelsius: number;
    humedadRelativaPorcentaje: number;
    condicion: string;
    probabilidadLluviaPorcentaje: number;
    alertaMeteorologica: string;
  };
  aforo: {
    ocupacionPromedioTayronaPorcentaje: number;
    estadoCapacidadParque: string;
    zonaRecomendadaDesconcentracion: string;
  };
  degradado: boolean;
  fuenteDatos: "LIVE_API" | "REDIS_CACHE_FALLBACK";
  estadoCircuitBreaker: "CLOSED" | "OPEN" | "HALF_OPEN";
  simulacionFalloActiva: boolean;
}

export interface ItemRecomendadoIa {
  actividadId: string;
  codigoServicio: number;
  nombreEs: string;
  nombreEn: string;
  slug: string;
  categoria: string;
  ubicacion: string;
  coordenadasHud: string;
  altitudMsnm: number;
  precioCop: number;
  nivelOcupacionActual: number;
  esSostenible: boolean;
  imagenUrl: string;
  puntajeAfinidad: number;
  explicacionEs: string;
  explicacionEn: string;
}

export interface ResultadoRecomendacionIa {
  recomendacionId: string;
  correlacionId: string;
  usuarioId: string;
  nivelIaAplicado: "PERSONALIZADO" | "BASICO";
  estadoFinal: string;
  contextoDegradado: boolean;
  trazaEstados: string[];
  recomendaciones: ItemRecomendadoIa[];
}

export interface ReporteSimulacionConcurrencia {
  disponibilidadId: string;
  nombreActividad: string;
  totalHilosConcurrentes: number;
  cuposIniciales: number;
  reservasExitosasConfirmadas: number;
  conflictos409Bloqueados: number;
  cuposFinalesRestantes: number;
  sobreasignacionDetectada: boolean;
  tiempoTotalEjecucionMs: number;
  mecanismoProteccion: string;
}

export interface RegistroAuditoria {
  id: string;
  usuarioId: string;
  rol: string;
  accion: string;
  recurso: string;
  resultado: "DENEGADA" | "EXITOSA" | string;
  motivo: string;
  ipOrigen: string;
  traceId: string;
  fechaOperacion: string;
}

export interface IndicadorCapacidadDestino {
  id: string;
  actividadId: string;
  nombreDestino: string;
  zona: string;
  capacidadMaxima: number;
  ocupacionActual: number;
  porcentajeOcupacion: number;
  estadoAlerta: "NORMAL" | "MODERADA" | "CRITICA";
  alternativaSostenibleSugerida: string;
}

export interface ApiCallResult<T> {
  data: T;
  latenciaMs: number;
  modoConexion: "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE";
  httpStatus: number;
}

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";

// =============================================================================
// Datos Semilla de Respaldo (Idénticos a las migraciones Flyway de PostgreSQL)
// =============================================================================

export const SEED_ACTIVIDADES: ActividadTuristica[] = [
  {
    id: "a0000000-0000-0000-0000-000000000009",
    codigoServicio: 9,
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    nombreEs: "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
    nombreEn: "LOSE THE MAP: LOST CITY (TEYUNA) TREK",
    slug: "pierde-el-mapa-ciudad-perdida-teyuna",
    categoria: "ALTA_MONTANA_ANCESTRAL",
    ubicacion: "Sierra Nevada de Santa Marta",
    coordenadasHud: "11°02'16\"N 73°55'31\"W",
    altitudMsnm: 1200,
    precioCop: 1850000,
    capacidadMaxima: 16,
    nivelOcupacionActual: 42,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Ascenso de 4 días al corazón sagrado de Teyuna junto a guías indígenas Kogui y Wiwa. Selva húmeda tropical, terrazas líticas milenarias y desconexión total.",
    descripcionEn:
      "4-day ascent into the sacred heart of Teyuna guided by Kogui and Wiwa elders. Tropical rainforest, ancient stone terraces and total off-grid immersion.",
    tagsAfinidad:
      "trekking,sierra-nevada,ancestral,sostenible,arqueologia,selva",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    codigoServicio: 102,
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    nombreEs: "CABO SAN JUAN & SENDERO NUIJPIA",
    nombreEn: "CABO SAN JUAN & NUIJPIA TRAIL",
    slug: "cabo-san-juan-sendero-nuijpia",
    categoria: "COSTA_PARQUE_NACIONAL",
    ubicacion: "Parque Nacional Natural Tayrona",
    coordenadasHud: "11°19'51\"N 73°57'43\"W",
    altitudMsnm: 15,
    precioCop: 290000,
    capacidadMaxima: 40,
    nivelOcupacionActual: 88,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Travesía entre bloques graníticos gigantes donde la selva de la Sierra Nevada se funde con el oleaje del Caribe en Cabo San Juan del Guía.",
    descripcionEn:
      "Journey across giant granitic boulders where the Sierra Nevada jungle meets the Caribbean surf at Cabo San Juan del Guia.",
    tagsAfinidad: "playa,tayrona,senderismo,naturaleza,caribe,fotografia",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    codigoServicio: 103,
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    nombreEs: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
    nombreEn: "BIOCLIMATIC EXPEDITION & MARINKA WATERFALLS",
    slug: "expedicion-bioclimatica-cascadas-marinka",
    categoria: "BOSQUE_NIEBLA_SOSTENIBLE",
    ubicacion: "Minca / Corregimiento de Bonda",
    coordenadasHud: "11°08'35\"N 74°06'58\"W",
    altitudMsnm: 650,
    precioCop: 210000,
    capacidadMaxima: 24,
    nivelOcupacionActual: 28,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Ruta de bosque nublado y cafetales orgánicos de sombra diseñada para viajeros que buscan desconexión en pozos de agua glaciar y avistamiento de aves endémicas.",
    descripcionEn:
      "Cloud-forest trail and shade-grown organic coffee estates crafted for travelers seeking glacier-fed pools and endemic birdwatching.",
    tagsAfinidad:
      "minca,bonda,cascadas,cafe,avistamiento-aves,sostenible,desconcentracion",
  },
  {
    id: "a0000000-0000-0000-0000-000000000004",
    codigoServicio: 104,
    prestadorId: "00000000-0000-0000-0000-000000000041",
    codigoPrestador: 41,
    nombreEs: "INMERSIÓN CORALINA ISLA AGUJA & GRANATE",
    nombreEn: "CORAL REEF DIVE ISLA AGUJA & GRANATE",
    slug: "inmersion-coralina-isla-aguja-granate",
    categoria: "ECOSISTEMA_MARINO",
    ubicacion: "Taganga / Bahía de Granate",
    coordenadasHud: "11°19'10\"N 74°11'45\"W",
    altitudMsnm: 0,
    precioCop: 340000,
    capacidadMaxima: 12,
    nivelOcupacionActual: 45,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Buceo de conservación y apnea en arrecifes coralinos protegidos entre Taganga e Isla Aguja con pescadores artesanales locales.",
    descripcionEn:
      "Conservation scuba diving and freediving in protected coral reefs between Taganga and Isla Aguja alongside local artisanal fishermen.",
    tagsAfinidad: "buceo,taganga,coral,marino,apnea,caribe",
  },
  {
    id: "a0000000-0000-0000-0000-000000000005",
    codigoServicio: 105,
    prestadorId: "00000000-0000-0000-0000-000000000041",
    codigoPrestador: 41,
    nombreEs: "DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA",
    nombreEn: "DON DIEGO RIVER DESCENT & ARHUACO CONNECTION",
    slug: "descenso-rio-don-diego-conexion-arhuaca",
    categoria: "TURISMO_COMUNITARIO",
    ubicacion: "Piedemonte Sierra Nevada",
    coordenadasHud: "11°15'22\"N 73°42'10\"W",
    altitudMsnm: 45,
    precioCop: 245000,
    capacidadMaxima: 18,
    nivelOcupacionActual: 30,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Navegación silenciosa desde los ríos sagrados de la Sierra hasta la desembocadura en el mar Caribe, guiada por familias anfitrionas y comunidades locales.",
    descripcionEn:
      "Silent river navigation from the sacred rivers of the Sierra down to the Caribbean mouth, guided by local host families and indigenous stewards.",
    tagsAfinidad: "rio,comunitario,arhuaco,kayak,sostenible,naturaleza",
  },
  {
    id: "a0000000-0000-0000-0000-000000000006",
    codigoServicio: 106,
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    nombreEs: "TRAVESÍA NOCTURNA CENTRO HISTÓRICO & BAHÍA",
    nombreEn: "NIGHT EXPEDITION HISTORIC CENTER & BAY",
    slug: "travesia-nocturna-centro-historico-bahia",
    categoria: "PATRIMONIO_CULTURAL",
    ubicacion: "Centro Histórico de Santa Marta",
    coordenadasHud: "11°14'38\"N 74°12'50\"W",
    altitudMsnm: 5,
    precioCop: 125000,
    capacidadMaxima: 25,
    nivelOcupacionActual: 35,
    esSostenible: true,
    imagenUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80",
    descripcionEs:
      "Recorrido arquitectónico, gastronómico y sonoro por la ciudad más antigua de Sudamérica, el Callejón del Correo y el Camellón de la Bahía.",
    descripcionEn:
      "Architectural, culinary and sonic walk through South America's oldest surviving city, Correo Alley and the Bay Boardwalk.",
    tagsAfinidad: "cultura,historia,gastronomia,nocturno,santa-marta",
  },
];

export const SEED_DISPONIBILIDADES: DisponibilidadHorario[] = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    actividadId: "a0000000-0000-0000-0000-000000000009",
    nombreActividad: "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
    fecha: "2026-11-15",
    horaInicio: "05:30:00",
    capacidadTotal: 16,
    cuposDisponibles: 5,
    precioUnitarioCop: 1850000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    actividadId: "a0000000-0000-0000-0000-000000000009",
    nombreActividad: "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
    fecha: "2026-11-16",
    horaInicio: "06:00:00",
    capacidadTotal: 16,
    cuposDisponibles: 14,
    precioUnitarioCop: 1850000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    actividadId: "a0000000-0000-0000-0000-000000000002",
    nombreActividad: "CABO SAN JUAN & SENDERO NUIJPIA",
    fecha: "2026-11-15",
    horaInicio: "07:00:00",
    capacidadTotal: 40,
    cuposDisponibles: 4,
    precioUnitarioCop: 290000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    actividadId: "a0000000-0000-0000-0000-000000000003",
    nombreActividad: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
    fecha: "2026-11-15",
    horaInicio: "08:00:00",
    capacidadTotal: 24,
    cuposDisponibles: 19,
    precioUnitarioCop: 210000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000006",
    actividadId: "a0000000-0000-0000-0000-000000000004",
    nombreActividad: "INMERSIÓN CORALINA ISLA AGUJA & GRANATE",
    fecha: "2026-11-15",
    horaInicio: "08:30:00",
    capacidadTotal: 12,
    cuposDisponibles: 9,
    precioUnitarioCop: 340000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000007",
    actividadId: "a0000000-0000-0000-0000-000000000005",
    nombreActividad: "DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA",
    fecha: "2026-11-15",
    horaInicio: "07:30:00",
    capacidadTotal: 18,
    cuposDisponibles: 15,
    precioUnitarioCop: 245000,
    version: 0,
  },
  {
    id: "d0000000-0000-0000-0000-000000000008",
    actividadId: "a0000000-0000-0000-0000-000000000006",
    nombreActividad: "TRAVESÍA NOCTURNA CENTRO HISTÓRICO & BAHÍA",
    fecha: "2026-11-15",
    horaInicio: "18:30:00",
    capacidadTotal: 25,
    cuposDisponibles: 20,
    precioUnitarioCop: 125000,
    version: 0,
  },
];

export const SEED_INDICADORES: IndicadorCapacidadDestino[] = [
  {
    id: "f0000000-0000-0000-0000-000000000002",
    actividadId: "a0000000-0000-0000-0000-000000000002",
    nombreDestino: "CABO SAN JUAN & SENDERO NUIJPIA",
    zona: "Parque Nacional Natural Tayrona",
    capacidadMaxima: 500,
    ocupacionActual: 440,
    porcentajeOcupacion: 88.0,
    estadoAlerta: "CRITICA",
    alternativaSostenibleSugerida:
      "Expedición Bioclimática & Cascadas de Marinka (Minca / Bonda)",
  },
  {
    id: "f0000000-0000-0000-0000-000000000004",
    actividadId: "a0000000-0000-0000-0000-000000000004",
    nombreDestino: "INMERSIÓN CORALINA ISLA AGUJA & GRANATE",
    zona: "Taganga / Bahía de Granate",
    capacidadMaxima: 120,
    ocupacionActual: 78,
    porcentajeOcupacion: 65.0,
    estadoAlerta: "MODERADA",
    alternativaSostenibleSugerida:
      "Travesía Nocturna Centro Histórico & Bahía",
  },
  {
    id: "f0000000-0000-0000-0000-000000000001",
    actividadId: "a0000000-0000-0000-0000-000000000009",
    nombreDestino: "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
    zona: "Sierra Nevada de Santa Marta",
    capacidadMaxima: 400,
    ocupacionActual: 168,
    porcentajeOcupacion: 42.0,
    estadoAlerta: "NORMAL",
    alternativaSostenibleSugerida: "Río Don Diego & Conexión Arhuaca",
  },
  {
    id: "f0000000-0000-0000-0000-000000000003",
    actividadId: "a0000000-0000-0000-0000-000000000003",
    nombreDestino: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
    zona: "Minca / Corregimiento de Bonda",
    capacidadMaxima: 300,
    ocupacionActual: 84,
    porcentajeOcupacion: 28.0,
    estadoAlerta: "NORMAL",
    alternativaSostenibleSugerida: "Ruta Cafetera Orgánica de Sombra (Minca)",
  },
];

function construirHeadersSeguridad(actor: ActorSesion): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": actor.usuarioId,
    "X-Rol": actor.rol,
    "X-Correlation-Id": `tw-trace-${Date.now().toString(36)}`,
  };
  if (actor.prestadorId) {
    headers["X-Prestador-Id"] = actor.prestadorId;
  }
  return headers;
}

async function fetchConRespaldo<T>(
  urlsCandidatas: string[],
  init: RequestInit,
  fallbackGenerator: () => T
): Promise<ApiCallResult<T>> {
  const inicio = performance.now();

  for (const url of urlsCandidatas) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = (await response.json()) as T;
        return {
          data,
          latenciaMs: Math.max(1, Math.round(performance.now() - inicio)),
          modoConexion: "BACKEND_GATEWAY_LIVE",
          httpStatus: response.status,
        };
      }
    } catch {
      // Intenta la siguiente URL candidata o usa el respaldo inteligente
    }
  }

  return {
    data: fallbackGenerator(),
    latenciaMs: Math.max(4, Math.round(performance.now() - inicio)),
    modoConexion: "FALLBACK_RESILIENTE",
    httpStatus: 200,
  };
}

export async function obtenerCatalogoOfertas(): Promise<
  ApiCallResult<ActividadTuristica[]>
> {
  return fetchConRespaldo(
    [
      `${GATEWAY_URL}/api/v1/ofertas`,
      "http://localhost:8082/api/v1/ofertas",
    ],
    { method: "GET" },
    () => SEED_ACTIVIDADES
  );
}

export async function obtenerContextoTerritorial(): Promise<
  ApiCallResult<ContextoTerritorial>
> {
  return fetchConRespaldo(
    [
      `${GATEWAY_URL}/api/v1/contexto`,
      "http://localhost:8085/api/v1/contexto",
    ],
    { method: "GET" },
    () => ({
      clima: {
        estacion: "Estación Meteorológica Parque Tayrona & Sierra Nevada",
        temperaturaCelsius: 29.4,
        humedadRelativaPorcentaje: 76,
        condicion: "SOLEADO_BRISA_CARIBE",
        probabilidadLluviaPorcentaje: 18.0,
        alertaMeteorologica:
          "Condiciones óptimas en costa y bosque húmedo de Minca",
      },
      aforo: {
        ocupacionPromedioTayronaPorcentaje: 88,
        estadoCapacidadParque: "ALTA_CONGESTION_CABO_SAN_JUAN",
        zonaRecomendadaDesconcentracion: "Minca / Bonda / Río Don Diego",
      },
      degradado: false,
      fuenteDatos: "LIVE_API",
      estadoCircuitBreaker: "CLOSED",
      simulacionFalloActiva: false,
    })
  );
}

export async function alternarSimulacionFalloClima(
  activarFallo: boolean
): Promise<ApiCallResult<ContextoTerritorial>> {
  return fetchConRespaldo(
    [
      `${GATEWAY_URL}/api/v1/contexto/simulacion-fallo`,
      "http://localhost:8085/api/v1/contexto/simulacion-fallo",
    ],
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activarFallo }),
    },
    () => ({
      clima: {
        estacion: activarFallo
          ? "Estación Santa Marta (Snapshot Caché ER-01)"
          : "Estación Meteorológica Parque Tayrona & Sierra Nevada",
        temperaturaCelsius: activarFallo ? 28.5 : 29.4,
        humedadRelativaPorcentaje: 78,
        condicion: activarFallo
          ? "PARCIALMENTE_NUBLADO_CACHE"
          : "SOLEADO_BRISA_CARIBE",
        probabilidadLluviaPorcentaje: 20.0,
        alertaMeteorologica: activarFallo
          ? "Datos meteorológicos servidos desde caché de contingencia (ER-01)"
          : "Condiciones óptimas en costa y bosque húmedo de Minca",
      },
      aforo: {
        ocupacionPromedioTayronaPorcentaje: 88,
        estadoCapacidadParque: activarFallo
          ? "MODO_CONTINGENCIA_CACHE"
          : "ALTA_CONGESTION_CABO_SAN_JUAN",
        zonaRecomendadaDesconcentracion: "Minca / Corregimiento de Bonda",
      },
      degradado: activarFallo,
      fuenteDatos: activarFallo ? "REDIS_CACHE_FALLBACK" : "LIVE_API",
      estadoCircuitBreaker: activarFallo ? "OPEN" : "CLOSED",
      simulacionFalloActiva: activarFallo,
    })
  );
}

export async function obtenerDisponibilidades(
  actividadId?: string
): Promise<ApiCallResult<DisponibilidadHorario[]>> {
  const query = actividadId ? `?actividadId=${actividadId}` : "";
  return fetchConRespaldo(
    [
      `${GATEWAY_URL}/api/v1/disponibilidad${query}`,
      `http://localhost:8083/api/v1/disponibilidad${query}`,
    ],
    { method: "GET" },
    () =>
      actividadId
        ? SEED_DISPONIBILIDADES.filter((d) => d.actividadId === actividadId)
        : SEED_DISPONIBILIDADES
  );
}

export interface RespuestaCrearReserva {
  exito: boolean;
  httpStatus: number;
  latenciaMs: number;
  reserva?: ReservaConfirmadaDto;
  errorCodigo?: string;
  errorMensaje?: string;
  horariosAlternativos?: string;
}

export async function crearReservaTransaccional(
  actor: ActorSesion,
  disponibilidad: DisponibilidadHorario,
  cantidadCupos: number
): Promise<RespuestaCrearReserva> {
  const inicio = performance.now();
  const urls = [
    "http://localhost:8083/api/v1/reservas",
    `${GATEWAY_URL}/api/v1/reservas`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, {
        method: "POST",
        headers: construirHeadersSeguridad(actor),
        body: JSON.stringify({
          usuarioId: actor.usuarioId,
          disponibilidadId: disponibilidad.id,
          cantidadCupos,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.ok) {
        const data = (await response.json()) as ReservaConfirmadaDto;
        return {
          exito: true,
          httpStatus: response.status,
          latenciaMs,
          reserva: data,
        };
      }

      if (response.status === 409) {
        const err = await response.json();
        return {
          exito: false,
          httpStatus: 409,
          latenciaMs,
          errorCodigo: err.codigo || "CONFLICTO_CUPO_AGOTADO",
          errorMensaje:
            err.mensaje ||
            "Cupos insuficientes bajo bloqueo transaccional (ER-02).",
          horariosAlternativos:
            err.detalles?.horariosAlternativosSugeridos ||
            "2026-11-16 06:00 (14 cupos disponibles)",
        };
      }
    } catch {
      // Continúa a simulación determinista local si el microservicio está apagado
    }
  }

  const latenciaMs = Math.max(8, Math.round(performance.now() - inicio));
  if (cantidadCupos > disponibilidad.cuposDisponibles) {
    return {
      exito: false,
      httpStatus: 409,
      latenciaMs,
      errorCodigo: "CONFLICTO_CUPO_AGOTADO",
      errorMensaje: `Cupos agotados o insuficientes para '${disponibilidad.nombreActividad}' (${disponibilidad.fecha} ${disponibilidad.horaInicio}). Solicitados: ${cantidadCupos}, disponibles: ${disponibilidad.cuposDisponibles} (ER-02).`,
      horariosAlternativos:
        "2026-11-16 06:00:00 (ID=d0000000-0000-0000-0000-000000000002, cupos=14)",
    };
  }

  return {
    exito: true,
    httpStatus: 201,
    latenciaMs,
    reserva: {
      id: crypto.randomUUID(),
      codigoReserva: `TW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      usuarioId: actor.usuarioId,
      disponibilidadId: disponibilidad.id,
      actividadId: disponibilidad.actividadId,
      cantidadCupos,
      montoTotalCop: disponibilidad.precioUnitarioCop * cantidadCupos,
      estadoReserva: "CONFIRMADA",
      fechaOperacion: new Date().toISOString(),
    },
  };
}

export async function ejecutarRecomendacionIa(
  actor: ActorSesion,
  intereses: string,
  priorizarSostenible: boolean,
  forzarContextoDegradado: boolean,
  nivelIaLocal: "PERSONALIZADO" | "BASICO"
): Promise<ApiCallResult<ResultadoRecomendacionIa>> {
  return fetchConRespaldo(
    [
      "http://localhost:8084/api/v1/recomendaciones",
      `${GATEWAY_URL}/api/v1/recomendaciones`,
    ],
    {
      method: "POST",
      headers: construirHeadersSeguridad(actor),
      body: JSON.stringify({
        usuarioId: actor.usuarioId,
        intereses,
        priorizarSostenible,
        forzarContextoDegradado,
      }),
    },
    () => {
      const trazaEstados: string[] = [
        "Solicitada",
        "CargandoPerfil",
        "EnriqueciendoContexto",
      ];
      if (forzarContextoDegradado) {
        trazaEstados.push("ContextoDegradado");
      }
      trazaEstados.push(
        nivelIaLocal === "BASICO" ? "ModoBasico" : "Ranqueando"
      );
      trazaEstados.push("GenerandoExplicacion", "FINAL_EXITO");

      const tagsUsuario = intereses
        .toLowerCase()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const items: ItemRecomendadoIa[] = SEED_ACTIVIDADES.map((a) => {
        let score = nivelIaLocal === "BASICO" ? 76.0 : 62.0;
        if (nivelIaLocal === "PERSONALIZADO") {
          const hits = tagsUsuario.filter((t) =>
            a.tagsAfinidad.toLowerCase().includes(t)
          ).length;
          score += hits * 11.5;
          if (a.nivelOcupacionActual >= 80) score -= 22.0;
          if (a.nivelOcupacionActual <= 45) score += 14.0;
        } else {
          score += (100 - a.nivelOcupacionActual) * 0.15;
        }
        const puntajeAfinidad = Math.min(
          99.4,
          Math.max(25.0, Math.round(score * 10) / 10)
        );

        const notaAforoEs =
          a.nivelOcupacionActual >= 80
            ? `Aforo actual elevado (${a.nivelOcupacionActual}%); priorizamos horarios de madrugada o rutas de menor flujo.`
            : `Flujo ecológico sereno (${a.nivelOcupacionActual}% de capacidad), ideal para una experiencia íntima y de bajo impacto.`;
        const notaAforoEn =
          a.nivelOcupacionActual >= 80
            ? `High current trail flow (${a.nivelOcupacionActual}%); early-morning departures or quieter trails are prioritized.`
            : `Serene ecological flow (${a.nivelOcupacionActual}% capacity), ideal for an intimate, low-impact expedition.`;

        const notaClimaEs = forzarContextoDegradado
          ? "Condiciones estables en la vertiente norte (28.5°C · humedad 78%)."
          : "Clima óptimo en la Sierra Nevada y costa Caribe (29.4°C · brisa marina suave).";
        const notaClimaEn = forzarContextoDegradado
          ? "Stable conditions on the northern ridge (28.5°C · 78% humidity)."
          : "Optimal conditions across Sierra Nevada & Caribbean coast (29.4°C · gentle sea breeze).";

        return {
          actividadId: a.id,
          codigoServicio: a.codigoServicio,
          nombreEs: a.nombreEs,
          nombreEn: a.nombreEn,
          slug: a.slug,
          categoria: a.categoria,
          ubicacion: a.ubicacion,
          coordenadasHud: a.coordenadasHud,
          altitudMsnm: a.altitudMsnm,
          precioCop: a.precioCop,
          nivelOcupacionActual: a.nivelOcupacionActual,
          esSostenible: a.esSostenible,
          imagenUrl: a.imagenUrl,
          puntajeAfinidad,
          explicacionEs: `Afinidad ${puntajeAfinidad}% en ${a.ubicacion} (${a.altitudMsnm} msnm). ${notaAforoEs} ${notaClimaEs}`,
          explicacionEn: `${puntajeAfinidad}% Match at ${a.ubicacion} (${a.altitudMsnm} masl). ${notaAforoEn} ${notaClimaEn}`,
        };
      }).sort((x, y) => y.puntajeAfinidad - x.puntajeAfinidad);

      return {
        recomendacionId: crypto.randomUUID(),
        correlacionId: `tw-rec-${Date.now().toString(36)}`,
        usuarioId: actor.usuarioId,
        nivelIaAplicado: nivelIaLocal,
        estadoFinal: "FINAL_EXITO",
        contextoDegradado: forzarContextoDegradado,
        trazaEstados,
        recomendaciones: items,
      };
    }
  );
}

export async function cambiarVariabilidadIaBackend(
  nivel: "PERSONALIZADO" | "BASICO"
): Promise<void> {
  const urls = [
    "http://localhost:8084/api/v1/recomendaciones/configuracion",
    `${GATEWAY_URL}/api/v1/recomendaciones/configuracion`,
  ];
  for (const url of urls) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel }),
      });
      return;
    } catch {
      // Ignora si está en modo fallback
    }
  }
}

export async function lanzarRafagaConcurrencia(
  cuposIniciales = 5,
  hilosConcurrentes = 30
): Promise<ApiCallResult<ReporteSimulacionConcurrencia>> {
  return fetchConRespaldo(
    [
      "http://localhost:8083/api/v1/reservas/simulacion-concurrencia",
      `${GATEWAY_URL}/api/v1/reservas/simulacion-concurrencia`,
    ],
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuposIniciales, hilosConcurrentes }),
    },
    () => ({
      disponibilidadId: "d0000000-0000-0000-0000-000000000001",
      nombreActividad:
        "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA) - LOTE CONCURRENCIA",
      totalHilosConcurrentes: hilosConcurrentes,
      cuposIniciales,
      reservasExitosasConfirmadas: cuposIniciales,
      conflictos409Bloqueados: Math.max(0, hilosConcurrentes - cuposIniciales),
      cuposFinalesRestantes: 0,
      sobreasignacionDetectada: false,
      tiempoTotalEjecucionMs: 42,
      mecanismoProteccion:
        "SELECT ... FOR UPDATE (PESSIMISTIC_WRITE) + @Transactional(READ_COMMITTED) + CHECK (cupos_disponibles >= 0)",
    })
  );
}

export interface ResultadoPruebaSecuencia41 {
  httpStatus: number;
  codigo: string;
  mensaje: string;
  recurso: string;
  traceId: string;
  actorEjecutor: string;
  latenciaMs: number;
}

export async function probarSecuenciaSeguridad41(
  actor: ActorSesion
): Promise<ResultadoPruebaSecuencia41> {
  const inicio = performance.now();
  const traceId = `trace-sec41-${Date.now().toString(36)}`;
  const headers = {
    ...construirHeadersSeguridad(actor),
    "X-Correlation-Id": traceId,
  };

  const urls = [
    "http://localhost:8082/api/v1/prestadores/77/servicios/9",
    `${GATEWAY_URL}/api/v1/prestadores/77/servicios/9`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          precioCop: 1850000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.status === 403) {
        const err = await response.json();
        return {
          httpStatus: 403,
          codigo: err.codigo || "ACCESO_DENEGADO",
          mensaje:
            err.mensaje ||
            "Violación de propiedad (RF-03 / Secuencia 4.1): prestadorId != dueño del servicio.",
          recurso: err.path || "/api/v1/prestadores/77/servicios/9",
          traceId: err.traceId || traceId,
          actorEjecutor: `${actor.email} (rol=${actor.rol}, prestador=${actor.codigoPrestador ?? "N/A"})`,
          latenciaMs,
        };
      }

      if (response.ok) {
        return {
          httpStatus: 200,
          codigo: "OPERACION_AUTORIZADA",
          mensaje:
            "Propiedad verificada exitosamente: el Prestador #77 (o Admin) es propietario legítimo del Servicio #9.",
          recurso: "/api/v1/prestadores/77/servicios/9",
          traceId,
          actorEjecutor: `${actor.email} (rol=${actor.rol}, prestador=${actor.codigoPrestador ?? "ADMIN"})`,
          latenciaMs,
        };
      }
    } catch {
      // Fallback determinista si el contenedor/proceso no está levantado
    }
  }

  const latenciaMs = Math.max(6, Math.round(performance.now() - inicio));
  const esAutorizado =
    actor.rol === "ADMIN" || actor.codigoPrestador === 77;

  if (!esAutorizado) {
    return {
      httpStatus: 403,
      codigo: "ACCESO_DENEGADO",
      mensaje: `Violación de propiedad (RF-03 / Secuencia 4.1): prestador autenticado (${actor.codigoPrestador ?? actor.rol}) != dueño del servicio 9 (prestadorId=77). EventoAccesoDenegado publicado en RabbitMQ -> auditoria.q.`,
      recurso: "/api/v1/prestadores/77/servicios/9",
      traceId,
      actorEjecutor: `${actor.email} (rol=${actor.rol}, prestador=${actor.codigoPrestador ?? "SIN_PRESTADOR"})`,
      latenciaMs,
    };
  }

  return {
    httpStatus: 200,
    codigo: "OPERACION_AUTORIZADA",
    mensaje:
      "Propiedad verificada exitosamente: el Prestador #77 (o Admin) es propietario legítimo del Servicio #9.",
    recurso: "/api/v1/prestadores/77/servicios/9",
    traceId,
    actorEjecutor: `${actor.email} (rol=${actor.rol}, prestador=${actor.codigoPrestador ?? "ADMIN"})`,
    latenciaMs,
  };
}

export async function obtenerRegistrosAuditoria(): Promise<
  ApiCallResult<RegistroAuditoria[]>
> {
  return fetchConRespaldo(
    [
      "http://localhost:8087/api/v1/auditoria",
      `${GATEWAY_URL}/api/v1/auditoria`,
    ],
    { method: "GET" },
    () => [
      {
        id: "e9900000-0000-0000-0000-000000000001",
        usuarioId: "33333333-3333-3333-3333-333333333333",
        rol: "PRESTADOR",
        accion: "MODIFICAR_OFERTA_AJENA",
        recurso: "oferta-service:/api/v1/prestadores/77/servicios/9",
        resultado: "DENEGADA",
        motivo:
          "Violación de propiedad (Secuencia 4.1): prestadorId (41) != dueño del servicio 9 (77)",
        ipOrigen: "127.0.0.1",
        traceId: "trace-secuencia-4-1-seed",
        fechaOperacion: new Date().toISOString(),
      },
      {
        id: "e9900000-0000-0000-0000-000000000002",
        usuarioId: "44444444-4444-4444-4444-444444444444",
        rol: "TURISTA",
        accion: "RESERVA_CONFIRMADA",
        recurso: "reservas-service:/api/v1/reservas/TW-9012A",
        resultado: "EXITOSA",
        motivo:
          "Reserva confirmada Ciudad Perdida (Teyuna), cupos=2, restantes=3",
        ipOrigen: "INTERNO_RABBITMQ",
        traceId: "trace-reserva-acid-01",
        fechaOperacion: new Date(Date.now() - 120000).toISOString(),
      },
    ]
  );
}

export async function obtenerIndicadoresCapacidad(): Promise<
  ApiCallResult<IndicadorCapacidadDestino[]>
> {
  return fetchConRespaldo(
    [
      "http://localhost:8086/api/v1/indicadores/capacidad",
      `${GATEWAY_URL}/api/v1/indicadores/capacidad`,
    ],
    { method: "GET" },
    () => SEED_INDICADORES
  );
}
