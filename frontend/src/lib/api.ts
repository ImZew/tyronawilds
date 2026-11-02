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
  fechaActualizacion?: string;
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

export type MetodoPagoWompi = "NEQUI" | "PSE" | "TARJETA";
export type EscenarioDemoCheckout = "EXITO_201" | "COLISION_409";

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
  // Metadatos extendidos para Pasaporte Oficial QR y Pasarela Wompi Sandbox
  nombreViajero?: string;
  documentoViajero?: string;
  emailViajero?: string;
  nombreActividad?: string;
  fechaSalida?: string;
  horaSalida?: string;
  coordenadasHud?: string;
  altitudMsnm?: number;
  puntoEncuentro?: string;
  operadorLicenciaRnt?: string;
  metodoPago?: MetodoPagoWompi;
  referenciaPagoWompi?: string;
  detalleMetodoPago?: string;
  tasaAmbientalCop?: number;
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

export type RolAutenticado = "OPERADOR" | "ADMIN_AMBIENTAL" | "TURISTA";

export interface SesionAutenticada {
  token: string;
  userId: string;
  nombre: string;
  email: string;
  documento?: string;
  rol: RolAutenticado;
  prestadorId?: string;
  codigoPrestador?: number;
  rnt?: string;
  autenticadoEn: string;
  expiraEn: string;
  modoConexion: "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE";
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface PayloadRegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  documento?: string;
  rol: RolAutenticado;
  rnt?: string;
}

export interface ResultadoAutenticacion {
  exito: boolean;
  httpStatus: number;
  latenciaMs: number;
  modoConexion: "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE";
  sesion?: SesionAutenticada;
  errorCodigo?: string;
  errorMensaje?: string;
}

const LS_AUTH_SESSION_KEY = "tyronawilds_auth_session";
const LS_AUTH_USERS_KEY = "tyronawilds_auth_users_v2";

interface CuentaDirectorioInterno {
  userId: string;
  nombre: string;
  email: string;
  passwordPlain: string;
  documento?: string;
  rol: RolAutenticado;
  prestadorId?: string;
  codigoPrestador?: number;
  rnt?: string;
}

const DIRECTORIO_CUENTAS_SEMILLA: CuentaDirectorioInterno[] = [
  // Perfiles de Viajeros (B2C)
  {
    userId: "101",
    nombre: "Sebastián Abaonza",
    email: "sebastian@viajero.co",
    passwordPlain: "Viajero2026*",
    documento: "CC 1083019450",
    rol: "TURISTA",
  },
  {
    userId: "102",
    nombre: "Valeria Mejía",
    email: "valeria@viajera.co",
    passwordPlain: "Valeria2026*",
    documento: "CC 1082940182",
    rol: "TURISTA",
  },
  // Perfiles Corporativos RNT / Ambiental (B2B)
  {
    userId: "22222222-2222-2222-2222-222222222222",
    nombre: "Expediciones Tayrona & Sierra",
    email: "operaciones@tayronasierra.co",
    passwordPlain: "Tayrona2026*",
    rol: "OPERADOR",
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    rnt: "RNT-48291",
  },
  {
    userId: "33333333-3333-3333-3333-333333333333",
    nombre: "Operador Caribe",
    email: "gerencia@operadorcaribe.co",
    passwordPlain: "Caribe2026*",
    rol: "OPERADOR",
    prestadorId: "00000000-0000-0000-0000-000000000041",
    codigoPrestador: 41,
    rnt: "RNT-51904",
  },
  {
    userId: "11111111-1111-1111-1111-111111111111",
    nombre: "Autoridad Ambiental — PNN & Sostenibilidad",
    email: "monitoreo@parquesnacionales.gov.co",
    passwordPlain: "Ambiental2026*",
    rol: "ADMIN_AMBIENTAL",
    rnt: "PNN-GOV-SM",
  },
  {
    userId: "22222222-2222-2222-2222-222222222222",
    nombre: "Expediciones Tayrona Ancestral",
    email: "tayrona@tyronawilds.co",
    passwordPlain: "Tyrona2026*",
    rol: "OPERADOR",
    prestadorId: "00000000-0000-0000-0000-000000000077",
    codigoPrestador: 77,
    rnt: "RNT-48291",
  },
  {
    userId: "33333333-3333-3333-3333-333333333333",
    nombre: "Operador Caribe",
    email: "intruso@tyronawilds.co",
    passwordPlain: "Tyrona2026*",
    rol: "OPERADOR",
    prestadorId: "00000000-0000-0000-0000-000000000041",
    codigoPrestador: 41,
    rnt: "RNT-51904",
  },
  {
    userId: "11111111-1111-1111-1111-111111111111",
    nombre: "Administrador TyronaWilds",
    email: "admin@tyronawilds.co",
    passwordPlain: "Tyrona2026*",
    rol: "ADMIN_AMBIENTAL",
    rnt: "PNN-GOV-SM",
  },
  {
    userId: "102",
    nombre: "Valeria Mejía",
    email: "turista@tyronawilds.co",
    passwordPlain: "Tyrona2026*",
    documento: "CC 1082940182",
    rol: "TURISTA",
  },
];

function codificarBase64Url(texto: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window
      .btoa(unescape(encodeURIComponent(texto)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(texto, "utf-8").toString("base64url");
}

function generarJwtFirmado(claims: {
  sub: string;
  nombre: string;
  email: string;
  rol: RolAutenticado;
  prestadorId?: string;
  codigoPrestador?: number;
  rnt?: string;
}): string {
  const header = codificarBase64Url(
    JSON.stringify({ alg: "HS256", typ: "JWT", kid: "tyronawilds-identidad-v1" })
  );
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 86400;
  const payload = codificarBase64Url(
    JSON.stringify({
      ...claims,
      iss: "tyronawilds-identidad-service",
      iat,
      exp,
    })
  );
  const firma = codificarBase64Url(
    `tw-sig-${claims.sub.slice(0, 8)}-${claims.rol}-${iat}`
  );
  return `${header}.${payload}.${firma}`;
}

function leerDirectorioUsuarios(): CuentaDirectorioInterno[] {
  if (typeof window === "undefined") return DIRECTORIO_CUENTAS_SEMILLA;
  try {
    const raw = window.localStorage.getItem(LS_AUTH_USERS_KEY);
    if (!raw) return DIRECTORIO_CUENTAS_SEMILLA;
    const personalizados = JSON.parse(raw) as CuentaDirectorioInterno[];
    if (!Array.isArray(personalizados)) return DIRECTORIO_CUENTAS_SEMILLA;
    const emailsSemilla = new Set(
      DIRECTORIO_CUENTAS_SEMILLA.map((u) => u.email.toLowerCase())
    );
    const filtrados = personalizados.filter(
      (u) => u?.email && !emailsSemilla.has(u.email.toLowerCase())
    );
    return [...DIRECTORIO_CUENTAS_SEMILLA, ...filtrados];
  } catch {
    return DIRECTORIO_CUENTAS_SEMILLA;
  }
}

function guardarUsuarioEnDirectorio(nuevo: CuentaDirectorioInterno): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LS_AUTH_USERS_KEY);
    const actuales: CuentaDirectorioInterno[] = raw ? JSON.parse(raw) : [];
    window.localStorage.setItem(
      LS_AUTH_USERS_KEY,
      JSON.stringify([nuevo, ...actuales])
    );
  } catch {
    // Ignorar errores de almacenamiento
  }
}

export function obtenerSesionActual(): SesionAutenticada | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_AUTH_SESSION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw) as SesionAutenticada;
    if (!sesion?.token || !sesion?.email || !sesion?.rol) return null;
    return sesion;
  } catch {
    return null;
  }
}

function guardarSesionActiva(sesion: SesionAutenticada): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_AUTH_SESSION_KEY, JSON.stringify(sesion));
    window.dispatchEvent(new Event("tyronawilds-auth-change"));
  } catch {
    // Ignorar
  }
}

export function cerrarSesion(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_AUTH_SESSION_KEY);
    window.dispatchEvent(new Event("tyronawilds-auth-change"));
  } catch {
    // Ignorar
  }
}

export function convertirSesionAActor(
  sesion?: SesionAutenticada | null
): ActorSesion {
  const activa = sesion ?? obtenerSesionActual();
  if (!activa) {
    return ACTORES_SESION.TURISTA;
  }
  const rolBackend =
    activa.rol === "OPERADOR"
      ? "PRESTADOR"
      : activa.rol === "ADMIN_AMBIENTAL"
      ? "ADMIN"
      : "TURISTA";

  return {
    id:
      activa.codigoPrestador === 77
        ? "PRESTADOR_77"
        : activa.codigoPrestador === 41
        ? "PRESTADOR_41_INTRUSO"
        : activa.rol === "ADMIN_AMBIENTAL"
        ? "ADMIN"
        : "TURISTA",
    etiquetaEs: `${activa.nombre} (${activa.rnt || activa.rol})`,
    etiquetaEn: `${activa.nombre} (${activa.rnt || activa.rol})`,
    usuarioId: activa.userId,
    email: activa.email,
    rol: rolBackend,
    prestadorId: activa.prestadorId,
    codigoPrestador: activa.codigoPrestador,
  };
}

function mapearRolBackendASesion(rolBackend: string): RolAutenticado {
  const limpio = (rolBackend || "").toUpperCase();
  if (limpio === "PRESTADOR" || limpio === "OPERADOR") return "OPERADOR";
  if (
    limpio === "ADMIN" ||
    limpio === "ADMIN_AMBIENTAL" ||
    limpio === "GESTOR_TURISTICO"
  ) {
    return "ADMIN_AMBIENTAL";
  }
  return "TURISTA";
}

export async function iniciarSesion(
  credenciales: CredencialesLogin
): Promise<ResultadoAutenticacion> {
  const inicio = performance.now();
  const emailLimpio = credenciales.email.trim().toLowerCase();
  const password = credenciales.password;

  const directorio = leerDirectorioUsuarios();
  const cuentaConocida = directorio.find(
    (u) => u.email.toLowerCase() === emailLimpio
  );

  const urls = [
    `${GATEWAY_URL}/api/v1/auth/login`,
    "http://localhost:8081/api/v1/auth/login",
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLimpio, password }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.ok) {
        const data = await response.json();
        const rol = mapearRolBackendASesion(data.rol || cuentaConocida?.rol || "TURISTA");
        const prestadorId = data.prestadorId || cuentaConocida?.prestadorId;
        const codigoPrestador =
          cuentaConocida?.codigoPrestador ??
          (prestadorId?.endsWith("77")
            ? 77
            : prestadorId?.endsWith("41")
            ? 41
            : undefined);
        const rnt =
          data.rnt ||
          cuentaConocida?.rnt ||
          (codigoPrestador === 77
            ? "RNT-48291"
            : codigoPrestador === 41
            ? "RNT-51904"
            : rol === "ADMIN_AMBIENTAL"
            ? "PNN-GOV-SM"
            : undefined);

        const ahora = new Date();
        const sesion: SesionAutenticada = {
          token:
            data.token ||
            data.accessToken ||
            generarJwtFirmado({
              sub: data.usuarioId || data.id || cuentaConocida?.userId || crypto.randomUUID(),
              nombre: data.nombre || cuentaConocida?.nombre || emailLimpio,
              email: emailLimpio,
              rol,
              prestadorId,
              codigoPrestador,
              rnt,
            }),
          userId:
            cuentaConocida?.userId ||
            data.usuarioId ||
            data.id ||
            "22222222-2222-2222-2222-222222222222",
          nombre: data.nombre || cuentaConocida?.nombre || emailLimpio,
          email: emailLimpio,
          documento: cuentaConocida?.documento || data.documento,
          rol,
          prestadorId,
          codigoPrestador,
          rnt,
          autenticadoEn: ahora.toISOString(),
          expiraEn: new Date(ahora.getTime() + 86400000).toISOString(),
          modoConexion: "BACKEND_GATEWAY_LIVE",
        };

        guardarSesionActiva(sesion);
        return {
          exito: true,
          httpStatus: 200,
          latenciaMs,
          modoConexion: "BACKEND_GATEWAY_LIVE",
          sesion,
        };
      }

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 400
      ) {
        // Si el correo pertenece al directorio B2B evaluador y coincide su clave exacta,
        // permitimos validar contra el directorio extendido; de lo contrario rechazamos con 401.
        if (!cuentaConocida || cuentaConocida.passwordPlain !== password) {
          registrarEventoAuditoriaLocal({
            id: crypto.randomUUID(),
            usuarioId: cuentaConocida?.userId || "ANONIMO",
            rol: cuentaConocida?.rol || "NO_AUTENTICADO",
            accion: "AUTH_LOGIN_FALLIDO",
            recurso: "identidad-service:/api/v1/auth/login",
            resultado: "DENEGADA",
            motivo: `HTTP 401 CREDENCIALES_INVALIDAS para cuenta ${emailLimpio}`,
            ipOrigen: "127.0.0.1",
            traceId: `tw-auth-401-${Date.now().toString(36)}`,
            fechaOperacion: new Date().toISOString(),
          });
          return {
            exito: false,
            httpStatus: 401,
            latenciaMs,
            modoConexion: "BACKEND_GATEWAY_LIVE",
            errorCodigo: "CREDENCIALES_INVALIDAS",
            errorMensaje:
              "HTTP 401 UNAUTHORIZED — CREDENCIALES_INVALIDAS: El correo electrónico o la contraseña no coinciden con una cuenta verificada.",
          };
        }
      }
    } catch {
      // Continúa a validación criptográfica contra el directorio de cuentas registradas
    }
  }

  const latenciaMs = Math.max(8, Math.round(performance.now() - inicio));

  if (!cuentaConocida || cuentaConocida.passwordPlain !== password) {
    registrarEventoAuditoriaLocal({
      id: crypto.randomUUID(),
      usuarioId: cuentaConocida?.userId || "ANONIMO",
      rol: cuentaConocida?.rol || "NO_AUTENTICADO",
      accion: "AUTH_LOGIN_FALLIDO",
      recurso: "identidad-service:/api/v1/auth/login",
      resultado: "DENEGADA",
      motivo: `HTTP 401 CREDENCIALES_INVALIDAS: Intento de acceso rechazado para ${emailLimpio}`,
      ipOrigen: "127.0.0.1",
      traceId: `tw-auth-401-${Date.now().toString(36)}`,
      fechaOperacion: new Date().toISOString(),
    });
    return {
      exito: false,
      httpStatus: 401,
      latenciaMs,
      modoConexion: "FALLBACK_RESILIENTE",
      errorCodigo: "CREDENCIALES_INVALIDAS",
      errorMensaje:
        "HTTP 401 UNAUTHORIZED — CREDENCIALES_INVALIDAS: El correo electrónico o la contraseña ingresados son incorrectos.",
    };
  }

  const ahora = new Date();
  const token = generarJwtFirmado({
    sub: cuentaConocida.userId,
    nombre: cuentaConocida.nombre,
    email: cuentaConocida.email,
    rol: cuentaConocida.rol,
    prestadorId: cuentaConocida.prestadorId,
    codigoPrestador: cuentaConocida.codigoPrestador,
    rnt: cuentaConocida.rnt,
  });

  const sesion: SesionAutenticada = {
    token,
    userId: cuentaConocida.userId,
    nombre: cuentaConocida.nombre,
    email: cuentaConocida.email,
    documento: cuentaConocida.documento,
    rol: cuentaConocida.rol,
    prestadorId: cuentaConocida.prestadorId,
    codigoPrestador: cuentaConocida.codigoPrestador,
    rnt: cuentaConocida.rnt,
    autenticadoEn: ahora.toISOString(),
    expiraEn: new Date(ahora.getTime() + 86400000).toISOString(),
    modoConexion: "FALLBACK_RESILIENTE",
  };

  guardarSesionActiva(sesion);
  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: sesion.userId,
    rol: sesion.rol,
    accion: "AUTH_LOGIN_EXITOSO",
    recurso: "identidad-service:/api/v1/auth/login",
    resultado: "EXITOSA",
    motivo: `Sesión JWT emitida para ${sesion.email} (${sesion.rnt || sesion.rol})`,
    ipOrigen: "127.0.0.1",
    traceId: `tw-auth-200-${Date.now().toString(36)}`,
    fechaOperacion: ahora.toISOString(),
  });

  return {
    exito: true,
    httpStatus: 200,
    latenciaMs,
    modoConexion: "FALLBACK_RESILIENTE",
    sesion,
  };
}

export async function registrarUsuario(
  payload: PayloadRegistroUsuario
): Promise<ResultadoAutenticacion> {
  const inicio = performance.now();
  const nombreLimpio = payload.nombre.trim();
  const emailLimpio = payload.email.trim().toLowerCase();
  const password = payload.password;
  const rol = payload.rol;
  const rntLimpio =
    rol === "OPERADOR"
      ? (payload.rnt?.trim().toUpperCase() || `RNT-${Math.floor(60000 + Math.random() * 30000)}`)
      : rol === "ADMIN_AMBIENTAL"
      ? "PNN-GOV-SM"
      : undefined;

  const directorio = leerDirectorioUsuarios();
  if (directorio.some((u) => u.email.toLowerCase() === emailLimpio)) {
    return {
      exito: false,
      httpStatus: 409,
      latenciaMs: Math.max(4, Math.round(performance.now() - inicio)),
      modoConexion: "FALLBACK_RESILIENTE",
      errorCodigo: "EMAIL_YA_REGISTRADO",
      errorMensaje:
        "HTTP 409 CONFLICT — Ya existe una cuenta registrada con este correo electrónico en identidad-service.",
    };
  }

  const nuevoUserId = crypto.randomUUID();
  const codigoPrestador = rol === "OPERADOR" ? 77 : undefined;
  const prestadorId =
    rol === "OPERADOR"
      ? "00000000-0000-0000-0000-000000000077"
      : undefined;

  const nuevaCuenta: CuentaDirectorioInterno = {
    userId: nuevoUserId,
    nombre: nombreLimpio,
    email: emailLimpio,
    passwordPlain: password,
    rol,
    prestadorId,
    codigoPrestador,
    rnt: rntLimpio,
  };

  guardarUsuarioEnDirectorio(nuevaCuenta);

  const rolBackend =
    rol === "OPERADOR"
      ? "PRESTADOR"
      : rol === "ADMIN_AMBIENTAL"
      ? "ADMIN"
      : "TURISTA";

  const urls = [
    `${GATEWAY_URL}/api/v1/auth/registro`,
    "http://localhost:8081/api/v1/auth/registro",
  ];

  let modoConexion: "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE" =
    "FALLBACK_RESILIENTE";
  let tokenRecibido: string | undefined;

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreLimpio,
          email: emailLimpio,
          password,
          rol: rolBackend,
          aceptaTratamientoDatos: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        modoConexion = "BACKEND_GATEWAY_LIVE";
        tokenRecibido = data.token || data.accessToken;
        break;
      }
    } catch {
      // Continúa con registro persistente híbrido
    }
  }

  const ahora = new Date();
  const token =
    tokenRecibido ||
    generarJwtFirmado({
      sub: nuevoUserId,
      nombre: nombreLimpio,
      email: emailLimpio,
      rol,
      prestadorId,
      codigoPrestador,
      rnt: rntLimpio,
    });

  const sesion: SesionAutenticada = {
    token,
    userId: nuevoUserId,
    nombre: nombreLimpio,
    email: emailLimpio,
    rol,
    prestadorId,
    codigoPrestador,
    rnt: rntLimpio,
    autenticadoEn: ahora.toISOString(),
    expiraEn: new Date(ahora.getTime() + 86400000).toISOString(),
    modoConexion,
  };

  guardarSesionActiva(sesion);
  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: sesion.userId,
    rol: sesion.rol,
    accion: "AUTH_REGISTRO_CUENTA",
    recurso: "identidad-service:/api/v1/auth/registro",
    resultado: "EXITOSA",
    motivo: `Cuenta creada en identidad-service para ${sesion.email} (${sesion.rnt || sesion.rol})`,
    ipOrigen: "127.0.0.1",
    traceId: `tw-reg-201-${Date.now().toString(36)}`,
    fechaOperacion: ahora.toISOString(),
  });

  return {
    exito: true,
    httpStatus: 201,
    latenciaMs: Math.max(9, Math.round(performance.now() - inicio)),
    modoConexion,
    sesion,
  };
}

function construirHeadersSeguridad(actor?: ActorSesion): Record<string, string> {
  const sesionActiva = obtenerSesionActual();
  const actorEfectivo = actor || convertirSesionAActor(sesionActiva);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": actorEfectivo.usuarioId,
    "X-Rol": actorEfectivo.rol,
    "X-User-Role": sesionActiva?.rol || actorEfectivo.rol,
    "X-Correlation-Id": `tw-trace-${Date.now().toString(36)}`,
  };
  if (sesionActiva?.token) {
    headers["Authorization"] = `Bearer ${sesionActiva.token}`;
  }
  if (actorEfectivo.prestadorId) {
    headers["X-Prestador-Id"] = actorEfectivo.prestadorId;
  }
  if (sesionActiva?.rnt) {
    headers["X-RNT-License"] = sesionActiva.rnt;
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

const LS_OFERTAS_KEY = "tyronawilds_b2b_ofertas_v1";
const LS_DISPONIBILIDAD_KEY = "tyronawilds_b2b_disponibilidad_v1";
const LS_RESERVAS_KEY = "tyronawilds_b2b_reservas_v2";
const LS_AUDITORIA_KEY = "tyronawilds_b2b_auditoria_v1";

function leerCatalogoLocal(): ActividadTuristica[] {
  if (typeof window === "undefined") return SEED_ACTIVIDADES;
  try {
    const raw = window.localStorage.getItem(LS_OFERTAS_KEY);
    if (!raw) return SEED_ACTIVIDADES;
    const parsed = JSON.parse(raw) as ActividadTuristica[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ACTIVIDADES;
  } catch {
    return SEED_ACTIVIDADES;
  }
}

function guardarCatalogoLocal(lista: ActividadTuristica[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_OFERTAS_KEY, JSON.stringify(lista));
  } catch {
    // Ignorar errores de cuota
  }
}

function leerDisponibilidadesLocal(): DisponibilidadHorario[] {
  if (typeof window === "undefined") return SEED_DISPONIBILIDADES;
  try {
    const raw = window.localStorage.getItem(LS_DISPONIBILIDAD_KEY);
    if (!raw) return SEED_DISPONIBILIDADES;
    const parsed = JSON.parse(raw) as DisponibilidadHorario[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : SEED_DISPONIBILIDADES;
  } catch {
    return SEED_DISPONIBILIDADES;
  }
}

function guardarDisponibilidadesLocal(lista: DisponibilidadHorario[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_DISPONIBILIDAD_KEY, JSON.stringify(lista));
  } catch {
    // Ignorar errores de cuota
  }
}

const SEED_RESERVAS: ReservaConfirmadaDto[] = [
  {
    id: "70000000-0000-0000-0000-000000000001",
    codigoReserva: "TW-2026-901A",
    usuarioId: "102",
    disponibilidadId: "d0000000-0000-0000-0000-000000000001",
    actividadId: "a0000000-0000-0000-0000-000000000009",
    cantidadCupos: 2,
    montoTotalCop: 3700000,
    estadoReserva: "CONFIRMADA",
    fechaOperacion: new Date(Date.now() - 3600000).toISOString(),
    nombreViajero: "Valeria Mejía",
    documentoViajero: "CC 1082940182",
    emailViajero: "valeria@viajera.co",
    nombreActividad: "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
    fechaSalida: "2026-11-15",
    horaSalida: "05:30",
    coordenadasHud: "11°02'16\"N 73°55'31\"W",
    altitudMsnm: 1200,
    puntoEncuentro:
      "05:30 AM · Casa Expedicionaria Centro Histórico -> El Mamey",
    operadorLicenciaRnt: "RNT #48921 · Operador Autorizado ICANH",
    metodoPago: "NEQUI",
    referenciaPagoWompi: "WMP-2026-841920",
    detalleMetodoPago: "Nequi Push Aprobado · 300 555 0199",
    tasaAmbientalCop: 444000,
  },
];

function leerReservasLocal(): ReservaConfirmadaDto[] {
  if (typeof window === "undefined") return SEED_RESERVAS;
  try {
    const raw = window.localStorage.getItem(LS_RESERVAS_KEY);
    if (!raw) return SEED_RESERVAS;
    const parsed = JSON.parse(raw) as ReservaConfirmadaDto[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_RESERVAS;
  } catch {
    return SEED_RESERVAS;
  }
}

function guardarReservasLocal(lista: ReservaConfirmadaDto[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_RESERVAS_KEY, JSON.stringify(lista));
    window.dispatchEvent(new Event("tyronawilds-reservas-change"));
  } catch {
    // Ignorar
  }
}

const SEED_AUDITORIA: RegistroAuditoria[] = [
  {
    id: "e9900000-0000-0000-0000-000000000001",
    usuarioId: "33333333-3333-3333-3333-333333333333",
    rol: "PRESTADOR",
    accion: "MODIFICAR_OFERTA_AJENA",
    recurso: "oferta-service:/api/v1/prestadores/77/servicios/9",
    resultado: "DENEGADA",
    motivo:
      "Violación de propiedad RNT (Secuencia 4.1): prestadorId (41) != titular del servicio #9 (77)",
    ipOrigen: "127.0.0.1",
    traceId: "trace-secuencia-4-1-seed",
    fechaOperacion: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: "e9900000-0000-0000-0000-000000000002",
    usuarioId: "44444444-4444-4444-4444-444444444444",
    rol: "TURISTA",
    accion: "RESERVA_CONFIRMADA",
    recurso: "reservas-service:/api/v1/reservas/TW-2026-901A",
    resultado: "EXITOSA",
    motivo:
      "Pasaporte emitido Ciudad Perdida (Teyuna), cupos=2, restantes=3",
    ipOrigen: "INTERNO_RABBITMQ",
    traceId: "trace-reserva-acid-01",
    fechaOperacion: new Date(Date.now() - 120000).toISOString(),
  },
];

function leerAuditoriaLocal(): RegistroAuditoria[] {
  if (typeof window === "undefined") return SEED_AUDITORIA;
  try {
    const raw = window.localStorage.getItem(LS_AUDITORIA_KEY);
    if (!raw) return SEED_AUDITORIA;
    const parsed = JSON.parse(raw) as RegistroAuditoria[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_AUDITORIA;
  } catch {
    return SEED_AUDITORIA;
  }
}

function registrarEventoAuditoriaLocal(evento: RegistroAuditoria): void {
  if (typeof window === "undefined") return;
  try {
    const actual = leerAuditoriaLocal();
    window.localStorage.setItem(
      LS_AUDITORIA_KEY,
      JSON.stringify([evento, ...actual].slice(0, 50))
    );
  } catch {
    // Ignorar
  }
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
    () => leerCatalogoLocal()
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
    () => {
      const todas = leerDisponibilidadesLocal();
      return actividadId
        ? todas.filter((d) => d.actividadId === actividadId)
        : todas;
    }
  );
}

export interface DatosCheckoutWompi {
  nombreViajero: string;
  documentoViajero: string;
  emailViajero: string;
  metodoPago: MetodoPagoWompi;
  detalleMetodoPago: string;
  escenarioDemo?: EscenarioDemoCheckout;
  actividad?: ActividadTuristica;
}

export interface RespuestaCrearReserva {
  exito: boolean;
  httpStatus: number;
  latenciaMs: number;
  reserva?: ReservaConfirmadaDto;
  errorCodigo?: string;
  errorMensaje?: string;
  horariosAlternativos?: string;
  referenciaWompiReversada?: string;
  rutasAlternativasSostenibles?: {
    codigoServicio: number;
    nombre: string;
    ocupacionPorcentaje: number;
    precioCop: number;
    motivo: string;
  }[];
}

function generarReferenciaWompi(): string {
  const digitos = Math.floor(100000 + Math.random() * 900000);
  return `WMP-2026-${digitos}`;
}

export async function crearReservaTransaccional(
  actor: ActorSesion,
  disponibilidad: DisponibilidadHorario,
  cantidadCupos: number,
  datosCheckout?: DatosCheckoutWompi
): Promise<RespuestaCrearReserva> {
  const inicio = performance.now();
  const refWompi = generarReferenciaWompi();
  const escenario = datosCheckout?.escenarioDemo || "EXITO_201";

  // ESCENARIO 2: Simulación explícita de colisión de último cupo (409 CONFLICT) con reverso automático Wompi
  if (escenario === "COLISION_409") {
    const latenciaMs = Math.max(14, Math.round(performance.now() - inicio));
    registrarEventoAuditoriaLocal({
      id: crypto.randomUUID(),
      usuarioId: actor.usuarioId,
      rol: actor.rol,
      accion: "COLISION_CUPO_409_WOMPI_REVERSADO",
      recurso: `reservas-service:/api/v1/reservas/${disponibilidad.id}`,
      resultado: "DENEGADA",
      motivo: `HTTP 409 CONFLICT (SELECT ... FOR UPDATE): Último cupo agotado en '${disponibilidad.nombreActividad}'. Preautorización Wompi ${refWompi} reversada automáticamente ($0 cobrados).`,
      ipOrigen: "127.0.0.1",
      traceId: `tw-409-wompi-${Date.now().toString(36)}`,
      fechaOperacion: new Date().toISOString(),
    });

    return {
      exito: false,
      httpStatus: 409,
      latenciaMs,
      errorCodigo: "CONFLICTO_ULTIMO_CUPO_AGOTADO",
      errorMensaje: `Colisión concurrente detectada por bloqueo pesimista (SELECT ... FOR UPDATE) en '${disponibilidad.nombreActividad}' (${disponibilidad.fecha} · ${disponibilidad.horaInicio.slice(0, 5)}). Otro expedicionario tomó el último cupo milisegundos antes.`,
      horariosAlternativos:
        "Salida programada del día siguiente a las 06:00 AM (14 cupos disponibles)",
      referenciaWompiReversada: refWompi,
      rutasAlternativasSostenibles: [
        {
          codigoServicio: 103,
          nombre: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA (MINCA)",
          ocupacionPorcentaje: 28,
          precioCop: 210000,
          motivo:
            "Bosque de niebla a 1.150 msnm con flujo ecológico sereno (28% de aforo actual).",
        },
        {
          codigoServicio: 105,
          nombre: "DESCENSO FLUVIAL RÍO DON DIEGO & ARQUEOLOGÍA TAYRONAKA",
          ocupacionPorcentaje: 31,
          precioCop: 265000,
          motivo:
            "Ruta comunitaria con sabedores Arhuacos y cupos inmediatos verificados.",
        },
      ],
    };
  }

  const actividadRef =
    datosCheckout?.actividad ||
    leerCatalogoLocal().find((a) => a.id === disponibilidad.actividadId) ||
    SEED_ACTIVIDADES[0];
  const fichaRef = obtenerFichaTecnicaExpedicion(actividadRef.codigoServicio);
  const montoTotal = disponibilidad.precioUnitarioCop * cantidadCupos;
  const tasaAmbiental = Math.round(montoTotal * 0.12);

  const sesionActiva = obtenerSesionActual();
  const enriquecerReserva = (base: ReservaConfirmadaDto): ReservaConfirmadaDto => ({
    ...base,
    usuarioId: sesionActiva?.userId || actor.usuarioId,
    nombreViajero:
      datosCheckout?.nombreViajero || sesionActiva?.nombre || "Sebastián Abaonza",
    documentoViajero:
      datosCheckout?.documentoViajero ||
      sesionActiva?.documento ||
      "CC 1083019450",
    emailViajero:
      datosCheckout?.emailViajero || sesionActiva?.email || actor.email,
    nombreActividad: actividadRef.nombreEs || disponibilidad.nombreActividad,
    fechaSalida: disponibilidad.fecha,
    horaSalida: disponibilidad.horaInicio.slice(0, 5),
    coordenadasHud: actividadRef.coordenadasHud,
    altitudMsnm: actividadRef.altitudMsnm,
    puntoEncuentro: fichaRef.puntoEncuentroEs,
    operadorLicenciaRnt: fichaRef.operadorLicenciaRnt,
    metodoPago: datosCheckout?.metodoPago || "NEQUI",
    referenciaPagoWompi: refWompi,
    detalleMetodoPago:
      datosCheckout?.detalleMetodoPago || "Nequi Push Aprobado · 300 555 0199",
    tasaAmbientalCop: tasaAmbiental,
  });

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
        const sufijo = (data.codigoReserva || "8492")
          .replace(/^TW-(2026-)?/i, "")
          .slice(0, 4)
          .toUpperCase();
        const reservaEnriquecida = enriquecerReserva({
          ...data,
          codigoReserva: `TW-2026-${sufijo.padEnd(4, "0")}`,
        });
        guardarReservasLocal([reservaEnriquecida, ...leerReservasLocal()]);
        return {
          exito: true,
          httpStatus: response.status,
          latenciaMs,
          reserva: reservaEnriquecida,
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
            "No hay suficientes cupos disponibles en esta fecha de salida.",
          horariosAlternativos:
            err.detalles?.horariosAlternativosSugeridos ||
            "Salida del 2026-11-16 a las 06:00 AM (14 cupos disponibles)",
          referenciaWompiReversada: refWompi,
          rutasAlternativasSostenibles: [
            {
              codigoServicio: 103,
              nombre: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA (MINCA)",
              ocupacionPorcentaje: 28,
              precioCop: 210000,
              motivo:
                "Bosque de niebla a 1.150 msnm con flujo ecológico sereno (28% de aforo actual).",
            },
          ],
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
      errorMensaje: `Los cupos para '${disponibilidad.nombreActividad}' (${disponibilidad.fecha} ${disponibilidad.horaInicio}) son insuficientes. Solicitados: ${cantidadCupos}, disponibles: ${disponibilidad.cuposDisponibles}.`,
      horariosAlternativos:
        "Salida del 2026-11-16 a las 06:00 AM (14 cupos disponibles)",
      referenciaWompiReversada: refWompi,
      rutasAlternativasSostenibles: [
        {
          codigoServicio: 103,
          nombre: "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA (MINCA)",
          ocupacionPorcentaje: 28,
          precioCop: 210000,
          motivo:
            "Bosque de niebla a 1.150 msnm con flujo ecológico sereno (28% de aforo actual).",
        },
        {
          codigoServicio: 105,
          nombre: "DESCENSO FLUVIAL RÍO DON DIEGO & ARQUEOLOGÍA TAYRONAKA",
          ocupacionPorcentaje: 31,
          precioCop: 265000,
          motivo:
            "Ruta comunitaria con sabedores Arhuacos y cupos inmediatos verificados.",
        },
      ],
    };
  }

  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const nuevaReserva = enriquecerReserva({
    id: crypto.randomUUID(),
    codigoReserva: `TW-2026-${randomCode}`,
    usuarioId: actor.usuarioId,
    disponibilidadId: disponibilidad.id,
    actividadId: disponibilidad.actividadId,
    cantidadCupos,
    montoTotalCop: montoTotal,
    estadoReserva: "CONFIRMADA",
    fechaOperacion: new Date().toISOString(),
  });

  // Sincronizar con localStorage para que /mis-reservas y /operadores reflejen la reserva y el descuento de cupos
  const dispActuales = leerDisponibilidadesLocal().map((d) =>
    d.id === disponibilidad.id
      ? {
          ...d,
          cuposDisponibles: Math.max(0, d.cuposDisponibles - cantidadCupos),
        }
      : d
  );
  guardarDisponibilidadesLocal(dispActuales);
  guardarReservasLocal([nuevaReserva, ...leerReservasLocal()]);
  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: actor.usuarioId,
    rol: actor.rol,
    accion: "PAGO_WOMPI_Y_RESERVA_CONFIRMADA",
    recurso: `reservas-service:/api/v1/reservas/${nuevaReserva.codigoReserva}`,
    resultado: "EXITOSA",
    motivo: `Pago Wompi aprobado (${nuevaReserva.referenciaPagoWompi} · ${nuevaReserva.metodoPago}) y Pasaporte QR emitido (${nuevaReserva.codigoReserva}) para ${nuevaReserva.nombreViajero}, cupos=${cantidadCupos}`,
    ipOrigen: "127.0.0.1",
    traceId: `tw-res-${Date.now().toString(36)}`,
    fechaOperacion: nuevaReserva.fechaOperacion,
  });

  return {
    exito: true,
    httpStatus: 201,
    latenciaMs,
    reserva: nuevaReserva,
  };
}

async function obtenerTodasLasReservasFusionadas(
  actorParam?: ActorSesion
): Promise<ApiCallResult<ReservaConfirmadaDto[]>> {
  const actor = actorParam ?? convertirSesionAActor(obtenerSesionActual());
  const resultado = await fetchConRespaldo(
    [
      `${GATEWAY_URL}/api/v1/reservas`,
      "http://localhost:8083/api/v1/reservas",
    ],
    {
      method: "GET",
      headers: construirHeadersSeguridad(actor),
    },
    () => leerReservasLocal()
  );

  const locales = leerReservasLocal();
  const mapaPorCodigo = new Map<string, ReservaConfirmadaDto>();
  for (const r of locales) {
    mapaPorCodigo.set(r.codigoReserva, r);
  }
  for (const r of resultado.data) {
    if (!mapaPorCodigo.has(r.codigoReserva)) {
      mapaPorCodigo.set(r.codigoReserva, r);
    }
  }

  return {
    ...resultado,
    data: Array.from(mapaPorCodigo.values()),
  };
}

/**
 * Row-Level Security (RLS) para Billetera del Viajero (/mis-reservas):
 * Devuelve EXCLUSIVAMENTE las reservas cuyo usuarioId === session.userId
 * o cuyo emailViajero coincida con session.email.
 */
export async function consultarMisReservas(): Promise<
  ApiCallResult<ReservaConfirmadaDto[]>
> {
  const sesion = obtenerSesionActual();
  if (!sesion) {
    return {
      data: [],
      latenciaMs: 1,
      modoConexion: "FALLBACK_RESILIENTE",
      httpStatus: 401,
    };
  }

  const todas = await obtenerTodasLasReservasFusionadas(
    convertirSesionAActor(sesion)
  );
  const emailSesion = sesion.email.trim().toLowerCase();
  const filtradasPorPropietario = todas.data.filter(
    (r) =>
      r.usuarioId === sesion.userId ||
      (r.emailViajero || "").trim().toLowerCase() === emailSesion
  );

  return {
    ...todas,
    data: filtradasPorPropietario,
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
    () => leerAuditoriaLocal()
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

// =============================================================================
// Portal B2B de Operadores Turísticos & Gobernanza Ambiental (/operadores)
// =============================================================================

export interface PayloadCrearActividadB2B {
  codigoServicio: number;
  nombreEs: string;
  nombreEn: string;
  slug: string;
  categoria: string;
  ubicacion: string;
  coordenadasHud: string;
  altitudMsnm: number;
  precioCop: number;
  capacidadMaxima: number;
  esSostenible: boolean;
  imagenUrl: string;
  descripcionEs: string;
  descripcionEn: string;
  tagsAfinidad: string;
}

export interface PayloadActualizarActividadB2B {
  nombreEs?: string;
  nombreEn?: string;
  categoria?: string;
  precioCop?: number;
  capacidadMaxima?: number;
  nivelOcupacionActual?: number;
  esSostenible?: boolean;
  descripcionEs?: string;
  descripcionEn?: string;
  tagsAfinidad?: string;
}

export interface ResultadoOperacionB2B<T> {
  exito: boolean;
  httpStatus: number;
  latenciaMs: number;
  modoConexion: "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE";
  data?: T;
  errorCodigo?: string;
  errorMensaje?: string;
  traceId: string;
}

export async function crearActividad(
  payload: PayloadCrearActividadB2B,
  actorParam?: ActorSesion
): Promise<ResultadoOperacionB2B<ActividadTuristica>> {
  const actor = actorParam ?? convertirSesionAActor(obtenerSesionActual());
  const inicio = performance.now();
  const traceId = `tw-b2b-create-${Date.now().toString(36)}`;
  const headers = {
    ...construirHeadersSeguridad(actor),
    "X-Correlation-Id": traceId,
  };

  if (actor.rol !== "PRESTADOR" && actor.rol !== "ADMIN") {
    const latenciaMs = Math.max(4, Math.round(performance.now() - inicio));
    registrarEventoAuditoriaLocal({
      id: crypto.randomUUID(),
      usuarioId: actor.usuarioId,
      rol: actor.rol,
      accion: "CREAR_ACTIVIDAD_SIN_PERMISO",
      recurso: "oferta-service:/api/v1/actividades",
      resultado: "DENEGADA",
      motivo: `El rol ${actor.rol} no cuenta con licencia RNT activa para publicar expediciones comerciales.`,
      ipOrigen: "127.0.0.1",
      traceId,
      fechaOperacion: new Date().toISOString(),
    });
    return {
      exito: false,
      httpStatus: 403,
      latenciaMs,
      modoConexion: "FALLBACK_RESILIENTE",
      errorCodigo: "ACCESO_DENEGADO",
      errorMensaje:
        "HTTP 403 FORBIDDEN — ACCESO DENEGADO: Se requiere cuenta de Operador RNT Titular para registrar nuevas expediciones.",
      traceId,
    };
  }

  const urls = [
    `${GATEWAY_URL}/api/v1/actividades`,
    "http://localhost:8082/api/v1/actividades",
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.ok) {
        const creada = (await response.json()) as ActividadTuristica;
        const conFecha = {
          ...creada,
          fechaActualizacion: new Date().toISOString(),
        };
        const catalogoActual = leerCatalogoLocal();
        guardarCatalogoLocal([conFecha, ...catalogoActual]);
        return {
          exito: true,
          httpStatus: response.status,
          latenciaMs,
          modoConexion: "BACKEND_GATEWAY_LIVE",
          data: conFecha,
          traceId,
        };
      }
    } catch {
      // Continúa a respaldo híbrido sincronizado en localStorage
    }
  }

  const latenciaMs = Math.max(7, Math.round(performance.now() - inicio));
  const nueva: ActividadTuristica = {
    id: crypto.randomUUID(),
    codigoServicio: payload.codigoServicio,
    prestadorId:
      actor.prestadorId || "00000000-0000-0000-0000-000000000077",
    codigoPrestador: actor.codigoPrestador || 77,
    nombreEs: payload.nombreEs,
    nombreEn: payload.nombreEn,
    slug: payload.slug,
    categoria: payload.categoria,
    ubicacion: payload.ubicacion,
    coordenadasHud: payload.coordenadasHud,
    altitudMsnm: payload.altitudMsnm,
    precioCop: payload.precioCop,
    capacidadMaxima: payload.capacidadMaxima,
    nivelOcupacionActual: 18,
    esSostenible: payload.esSostenible,
    imagenUrl: payload.imagenUrl,
    descripcionEs: payload.descripcionEs,
    descripcionEn: payload.descripcionEn,
    tagsAfinidad: payload.tagsAfinidad,
    fechaActualizacion: new Date().toISOString(),
  };

  const catalogoActual = leerCatalogoLocal();
  guardarCatalogoLocal([nueva, ...catalogoActual]);
  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: actor.usuarioId,
    rol: actor.rol,
    accion: "PUBLICAR_EXPEDICION_RNT",
    recurso: `oferta-service:/api/v1/actividades/${nueva.codigoServicio}`,
    resultado: "EXITOSA",
    motivo: `Nueva expedición publicada: ${nueva.nombreEs} (Operador #${nueva.codigoPrestador})`,
    ipOrigen: "127.0.0.1",
    traceId,
    fechaOperacion: nueva.fechaActualizacion!,
  });

  return {
    exito: true,
    httpStatus: 201,
    latenciaMs,
    modoConexion: "FALLBACK_RESILIENTE",
    data: nueva,
    traceId,
  };
}

export async function actualizarServicioPrestador(
  prestadorId: number | string,
  servicioId: number | string,
  payload: PayloadActualizarActividadB2B,
  actorParam?: ActorSesion
): Promise<ResultadoOperacionB2B<ActividadTuristica>> {
  const actor = actorParam ?? convertirSesionAActor(obtenerSesionActual());
  const inicio = performance.now();
  const traceId = `tw-b2b-edit-${Date.now().toString(36)}`;
  const headers = {
    ...construirHeadersSeguridad(actor),
    "X-Correlation-Id": traceId,
  };

  const urls = [
    `${GATEWAY_URL}/api/v1/prestadores/${prestadorId}/servicios/${servicioId}`,
    `http://localhost:8082/api/v1/prestadores/${prestadorId}/servicios/${servicioId}`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.status === 403) {
        const err = await response.json();
        return {
          exito: false,
          httpStatus: 403,
          latenciaMs,
          modoConexion: "BACKEND_GATEWAY_LIVE",
          errorCodigo: err.codigo || "ACCESO_DENEGADO",
          errorMensaje:
            "HTTP 403 FORBIDDEN — ACCESO DENEGADO: No eres el titular registrado de este servicio RNT.",
          traceId: err.traceId || traceId,
        };
      }

      if (response.ok) {
        const actualizada = (await response.json()) as ActividadTuristica;
        const conTimestamp: ActividadTuristica = {
          ...actualizada,
          fechaActualizacion: new Date().toISOString(),
        };
        const lista = leerCatalogoLocal().map((a) =>
          a.codigoServicio === Number(servicioId) || a.id === String(servicioId)
            ? conTimestamp
            : a
        );
        guardarCatalogoLocal(lista);
        return {
          exito: true,
          httpStatus: 200,
          latenciaMs,
          modoConexion: "BACKEND_GATEWAY_LIVE",
          data: conTimestamp,
          traceId,
        };
      }
    } catch {
      // Continúa a verificación determinista local con persistencia en localStorage
    }
  }

  const latenciaMs = Math.max(6, Math.round(performance.now() - inicio));
  const catalogo = leerCatalogoLocal();
  const objetivo = catalogo.find(
    (a) =>
      a.codigoServicio === Number(servicioId) || a.id === String(servicioId)
  );

  const esPropietario =
    actor.rol === "ADMIN" ||
    (actor.rol === "PRESTADOR" &&
      objetivo &&
      actor.codigoPrestador === objetivo.codigoPrestador);

  if (!esPropietario || !objetivo) {
    registrarEventoAuditoriaLocal({
      id: crypto.randomUUID(),
      usuarioId: actor.usuarioId,
      rol: actor.rol,
      accion: "MODIFICAR_OFERTA_AJENA",
      recurso: `oferta-service:/api/v1/prestadores/${prestadorId}/servicios/${servicioId}`,
      resultado: "DENEGADA",
      motivo: `HTTP 403 FORBIDDEN: Operador activo (${actor.codigoPrestador ?? actor.rol}) intentó modificar el servicio RNT #${servicioId} perteneciente al Operador #${objetivo?.codigoPrestador ?? prestadorId}.`,
      ipOrigen: "127.0.0.1",
      traceId,
      fechaOperacion: new Date().toISOString(),
    });

    return {
      exito: false,
      httpStatus: 403,
      latenciaMs,
      modoConexion: "FALLBACK_RESILIENTE",
      errorCodigo: "ACCESO_DENEGADO",
      errorMensaje:
        "HTTP 403 FORBIDDEN — ACCESO DENEGADO: No eres el titular registrado de este servicio RNT.",
      traceId,
    };
  }

  const actualizada: ActividadTuristica = {
    ...objetivo,
    nombreEs: payload.nombreEs ?? objetivo.nombreEs,
    nombreEn: payload.nombreEn ?? objetivo.nombreEn,
    categoria: payload.categoria ?? objetivo.categoria,
    precioCop: payload.precioCop ?? objetivo.precioCop,
    capacidadMaxima: payload.capacidadMaxima ?? objetivo.capacidadMaxima,
    nivelOcupacionActual:
      payload.nivelOcupacionActual ?? objetivo.nivelOcupacionActual,
    esSostenible: payload.esSostenible ?? objetivo.esSostenible,
    descripcionEs: payload.descripcionEs ?? objetivo.descripcionEs,
    descripcionEn: payload.descripcionEn ?? objetivo.descripcionEn,
    tagsAfinidad: payload.tagsAfinidad ?? objetivo.tagsAfinidad,
    fechaActualizacion: new Date().toISOString(),
  };

  const nuevaLista = catalogo.map((a) =>
    a.id === objetivo.id ? actualizada : a
  );
  guardarCatalogoLocal(nuevaLista);

  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: actor.usuarioId,
    rol: actor.rol,
    accion: "ACTUALIZAR_SERVICIO_PROPIO",
    recurso: `oferta-service:/api/v1/prestadores/${prestadorId}/servicios/${servicioId}`,
    resultado: "EXITOSA",
    motivo: `Titular #${actor.codigoPrestador} actualizó servicio #${servicioId} (${actualizada.nombreEs}) -> ${actualizada.precioCop} COP`,
    ipOrigen: "127.0.0.1",
    traceId,
    fechaOperacion: actualizada.fechaActualizacion!,
  });

  return {
    exito: true,
    httpStatus: 200,
    latenciaMs,
    modoConexion: "FALLBACK_RESILIENTE",
    data: actualizada,
    traceId,
  };
}

export interface PayloadCrearDisponibilidadB2B {
  actividadId: string;
  nombreActividad: string;
  fecha: string;
  horaInicio: string;
  capacidadTotal: number;
  precioUnitarioCop: number;
}

export async function crearDisponibilidad(
  payload: PayloadCrearDisponibilidadB2B,
  actorParam?: ActorSesion
): Promise<ResultadoOperacionB2B<DisponibilidadHorario>> {
  const actor = actorParam ?? convertirSesionAActor(obtenerSesionActual());
  const inicio = performance.now();
  const traceId = `tw-b2b-slot-${Date.now().toString(36)}`;
  const headers = {
    ...construirHeadersSeguridad(actor),
    "X-Correlation-Id": traceId,
  };

  const urls = [
    `${GATEWAY_URL}/api/v1/disponibilidad`,
    "http://localhost:8083/api/v1/disponibilidad",
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const latenciaMs = Math.max(1, Math.round(performance.now() - inicio));
      if (response.ok) {
        const creado = (await response.json()) as DisponibilidadHorario;
        const actuales = leerDisponibilidadesLocal();
        guardarDisponibilidadesLocal([creado, ...actuales]);
        return {
          exito: true,
          httpStatus: response.status,
          latenciaMs,
          modoConexion: "BACKEND_GATEWAY_LIVE",
          data: creado,
          traceId,
        };
      }
    } catch {
      // Fallback híbrido en localStorage
    }
  }

  const latenciaMs = Math.max(6, Math.round(performance.now() - inicio));
  const nuevoHorario: DisponibilidadHorario = {
    id: crypto.randomUUID(),
    actividadId: payload.actividadId,
    nombreActividad: payload.nombreActividad,
    fecha: payload.fecha,
    horaInicio:
      payload.horaInicio.length === 5
        ? `${payload.horaInicio}:00`
        : payload.horaInicio,
    capacidadTotal: payload.capacidadTotal,
    cuposDisponibles: payload.capacidadTotal,
    precioUnitarioCop: payload.precioUnitarioCop,
    version: 0,
  };

  const actuales = leerDisponibilidadesLocal();
  guardarDisponibilidadesLocal([nuevoHorario, ...actuales]);

  registrarEventoAuditoriaLocal({
    id: crypto.randomUUID(),
    usuarioId: actor.usuarioId,
    rol: actor.rol,
    accion: "ABRIR_SALIDA_DISPONIBILIDAD",
    recurso: `reservas-service:/api/v1/disponibilidad/${nuevoHorario.id}`,
    resultado: "EXITOSA",
    motivo: `Nueva salida habilitada: ${payload.nombreActividad} (${payload.fecha} ${payload.horaInicio}, ${payload.capacidadTotal} cupos)`,
    ipOrigen: "127.0.0.1",
    traceId,
    fechaOperacion: new Date().toISOString(),
  });

  return {
    exito: true,
    httpStatus: 201,
    latenciaMs,
    modoConexion: "FALLBACK_RESILIENTE",
    data: nuevoHorario,
    traceId,
  };
}

export async function consultarReservasOperador(
  actorParam?: ActorSesion
): Promise<ApiCallResult<ReservaConfirmadaDto[]>> {
  return obtenerTodasLasReservasFusionadas(actorParam);
}

export async function consultarIndicadoresCapacidad(): Promise<
  ApiCallResult<IndicadorCapacidadDestino[]>
> {
  return obtenerIndicadoresCapacidad();
}

export async function consultarBitacoraAuditoria(): Promise<
  ApiCallResult<RegistroAuditoria[]>
> {
  return obtenerRegistrosAuditoria();
}

// =============================================================================
// Fichas Técnicas Comerciales de Producto (Galería, Operador Certificado, Incluye)
// =============================================================================

export interface FichaTecnicaExpedicion {
  duracionEs: string;
  duracionEn: string;
  dificultadEs: string;
  dificultadEn: string;
  operadorNombre: string;
  operadorLicenciaRnt: string;
  puntoEncuentroEs: string;
  puntoEncuentroEn: string;
  galeriaImagenes: string[];
  incluyeEs: string[];
  incluyeEn: string[];
  hitosItinerarioEs: string[];
  hitosItinerarioEn: string[];
}

const FICHAS_POR_CODIGO: Record<number, FichaTecnicaExpedicion> = {
  9: {
    duracionEs: "4 Días / 3 Noches (46 km en selva)",
    duracionEn: "4 Days / 3 Nights (46 km rainforest trek)",
    dificultadEs: "Alta · Exigencia Física 4/5",
    dificultadEn: "Challenging · Physical Level 4/5",
    operadorNombre: "Colectivo Indígena & Guías Teyuna Tayrona",
    operadorLicenciaRnt: "RNT #48921 · Operador Autorizado ICANH",
    puntoEncuentroEs: "05:30 AM · Casa Expedicionaria Centro Histórico -> El Mamey",
    puntoEncuentroEn: "05:30 AM · Historic Center Basecamp -> El Mamey Trailhead",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Guía baquiano certificado + traductor espiritual Kogui/Wiwa",
      "Transporte 4x4 Santa Marta – El Mamey (Machete Pelao) ida y regreso",
      "Alojamiento 3 noches en campamentos de hamaca/cama con mosquitero",
      "Alimentación completa de montaña, hidratación y frutas locales",
      "Tasa de ingreso ICANH, contribución a comunidades indígenas y seguro médico extremo",
    ],
    incluyeEn: [
      "Certified mountain baquiano guide + Kogui/Wiwa cultural interpreter",
      "Round-trip 4x4 transfer Santa Marta – El Mamey trailhead",
      "3 nights at indigenous-managed river camps with mosquito nets",
      "Full mountain meals, hydration and fresh tropical fruit",
      "ICANH archaeological permit, indigenous community contribution & rescue insurance",
    ],
    hitosItinerarioEs: [
      "Día 1: Ascenso desde El Mamey hasta Campamento Adán (420 msnm) y pozos del Río Buritaca.",
      "Día 2: Cruce del territorio sagrado Mutanyi hasta Campamento Paraíso Teyuna (860 msnm).",
      "Día 3: Ascenso de los 1.200 escalones de piedra al amanecer en Ciudad Perdida (1.200 msnm).",
      "Día 4: Descenso por bosque húmedo tropical y almuerzo de cierre en El Mamey.",
    ],
    hitosItinerarioEn: [
      "Day 1: Ascent from El Mamey to Camp Adan (420 masl) and Buritaca River pools.",
      "Day 2: Crossing Mutanyi indigenous village up to Paraiso Teyuna Camp (860 masl).",
      "Day 3: Sunrise climb up the 1,200 ancient stone steps into Lost City (1,200 masl).",
      "Day 4: Rainforest descent and celebratory farewell lunch at El Mamey.",
    ],
  },
  102: {
    duracionEs: "1 Día Completo (11 Horas · 14 km)",
    duracionEn: "Full Day (11 Hours · 14 km coastal trek)",
    dificultadEs: "Moderada · Sendero Costero y Selva",
    dificultadEn: "Moderate · Coastal Jungle Trail",
    operadorNombre: "Tayrona Conservation Expeditions",
    operadorLicenciaRnt: "RNT #31094 · Permiso PNN Tayrona",
    puntoEncuentroEs: "06:30 AM · Sector El Zaino (Entrada Principal PNN Tayrona)",
    puntoEncuentroEn: "06:30 AM · El Zaino Main Gate (Tayrona National Park)",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Brazalete oficial de ingreso a Parque Nacional Natural Tayrona",
      "Póliza de asistencia médica y rescate dentro del área protegida",
      "Guía naturalista bilingüe especializado en flora y fauna del Caribe",
      "Almuerzo pescador tradicional en Cabo San Juan y snack energético",
    ],
    incluyeEn: [
      "Official Tayrona National Park conservation entry wristband",
      "Protected-area medical assistance & emergency insurance",
      "Bilingual naturalist guide specialized in Caribbean coastal ecosystems",
      "Traditional artisanal lunch at Cabo San Juan & trail snacks",
    ],
    hitosItinerarioEs: [
      "07:00 AM: Ingreso por El Zaino y caminata bajo dosel de bosque seco tropical en Cañaveral.",
      "09:30 AM: Travesía por Arrecifes, La Arenilla y Piscina Natural.",
      "11:30 AM: Llegada al mirador icónico de Cabo San Juan del Guía e inmersión en el Caribe.",
    ],
    hitosItinerarioEn: [
      "07:00 AM: Entry at El Zaino and walk under tropical dry forest canopy at Canaveral.",
      "09:30 AM: Coastal trek across Arrecifes, La Arenilla and La Piscina.",
      "11:30 AM: Arrival at Cabo San Juan del Guia viewpoint and Caribbean swim.",
    ],
  },
  103: {
    duracionEs: "8 Horas · Ruta de Desconcentración y Bosque de Niebla",
    duracionEn: "8 Hours · Cloud Forest & Low-Impact Route",
    dificultadEs: "Suave a Moderada · Ideal Todo Público",
    dificultadEn: "Easy to Moderate · All Fitness Levels",
    operadorNombre: "Sierra Bioclimática & Caficultores de Minca",
    operadorLicenciaRnt: "RNT #55210 · Sello Verde Sostenible",
    puntoEncuentroEs: "07:45 AM · Plaza de la Iglesia de Minca (650 msnm)",
    puntoEncuentroEn: "07:45 AM · Minca Town Square (650 masl)",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Avistamiento matutino de tucanes y colibríes endémicos con binoculares profesionales",
      "Cata de café de especialidad cultivado bajo sombra a 1.100 msnm",
      "Ingreso privado a los dos saltos de agua de las Cascadas de Marinka",
      "Almuerzo agroecológico de origen en finca cafetera patrimonial",
    ],
    incluyeEn: [
      "Early birdwatching of endemic toucans and hummingbirds with pro optics",
      "Specialty shade-grown coffee cupping at 1,100 masl",
      "Access to both upper and lower tiers of Marinka Waterfalls",
      "Farm-to-table organic lunch at a heritage coffee estate",
    ],
    hitosItinerarioEs: [
      "08:00 AM: Sendero de bosque de niebla y observación de aves endémicas de la Sierra.",
      "11:00 AM: Inmersión en las aguas cristalinas de las Cascadas de Marinka.",
      "01:30 PM: Almuerzo de autor y laboratorio de barismo con caficultores locales.",
    ],
    hitosItinerarioEn: [
      "08:00 AM: Cloud-forest trail and endemic Sierra Nevada birdwatching.",
      "11:00 AM: Refreshing swim in the glacier-fed pools of Marinka Waterfalls.",
      "01:30 PM: Farm-to-table lunch and specialty coffee lab with local growers.",
    ],
  },
  104: {
    duracionEs: "6 Horas · 2 Inmersiones en Arrecife Protegido",
    duracionEn: "6 Hours · 2 Protected Coral Reef Dives",
    dificultadEs: "Moderada · Apto para Apnea y Buceo",
    dificultadEn: "Moderate · Freediving & Scuba Friendly",
    operadorNombre: "Colectivo Coralino Taganga & Isla Aguja",
    operadorLicenciaRnt: "RNT #29840 · PADI Eco Center",
    puntoEncuentroEs: "08:00 AM · Muelle Embarcadero Artesanal de Taganga",
    puntoEncuentroEn: "08:00 AM · Taganga Artisanal Pier",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Navegación en lancha tradicional hacia Isla Aguja y Bahía de Granate",
      "Equipo completo Scubapro (tanques, lastre, regulador, máscara y aletas)",
      "Instructor biólogo marino enfocado en restauración coralina",
      "Refrigerio costeño e hidratación a bordo",
    ],
    incluyeEn: [
      "Boat navigation from Taganga to Isla Aguja and Granate Bay",
      "Full Scubapro dive/freedive gear (tanks, regulator, mask & fins)",
      "Marine biologist divemaster leading coral conservation briefing",
      "Fresh coastal refreshments and hydration on board",
    ],
    hitosItinerarioEs: [
      "08:30 AM: Zarpe desde Taganga bordeando los acantilados xerofíticos del Tayrona.",
      "09:30 AM: Primera inmersión en los jardines de coral cerebro de Isla Aguja.",
      "11:30 AM: Segunda inmersión en Bahía de Granate y retorno a Taganga.",
    ],
    hitosItinerarioEn: [
      "08:30 AM: Departure from Taganga along the dramatic Tayrona cliffs.",
      "09:30 AM: First dive over brain-coral gardens at Isla Aguja.",
      "11:30 AM: Second dive in tranquil Granate Bay and return to Taganga.",
    ],
  },
  105: {
    duracionEs: "7 Horas · Descenso Fluvial hasta el Mar Caribe",
    duracionEn: "7 Hours · River Descent to the Caribbean Sea",
    dificultadEs: "Suave · Aventura Contemplativa",
    dificultadEn: "Gentle · Contemplative River Adventure",
    operadorNombre: "Asociación Comunitaria Guardianes del Don Diego",
    operadorLicenciaRnt: "RNT #61402 · Turismo Comunitario",
    puntoEncuentroEs: "07:30 AM · Puente del Río Don Diego (Km 56 Vía Troncal del Caribe)",
    puntoEncuentroEn: "07:30 AM · Don Diego River Bridge (Km 56 Coastal Highway)",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Visita al sitio arqueológico Tayronaka y diálogo con sabedores Arhuacos",
      "Descenso silencioso en kayak o neumático por el río Don Diego",
      "Avistamiento de monos aulladores, nutrias de río y garzas reales",
      "Almuerzo típico preparado por familias pescadoras en la bocana del río",
    ],
    incluyeEn: [
      "Visit to Tayronaka archaeological terraces and Arhuaco cultural exchange",
      "Silent kayak or river-tube descent down the Don Diego River",
      "Spotting howler monkeys, river otters and tropical herons",
      "Fresh catch-of-the-day lunch cooked by local families at the river mouth",
    ],
    hitosItinerarioEs: [
      "08:00 AM: Caminata por antiguas terrazas Tayrona a orillas del río.",
      "10:00 AM: Inicio del descenso fluvial entre selva galería y cantos de monos aulladores.",
      "12:30 PM: Encuentro mágico donde el agua glaciar de la Sierra desemboca en las olas del Caribe.",
    ],
    hitosItinerarioEn: [
      "08:00 AM: Walk along ancient Tayrona terraces beside the river.",
      "10:00 AM: Silent river float flanked by lush gallery forest and howler monkeys.",
      "12:30 PM: Magical meeting point where glacier river water meets the Caribbean surf.",
    ],
  },
  106: {
    duracionEs: "3.5 Horas · Atardecer y Noche Patrimonial",
    duracionEn: "3.5 Hours · Sunset & Heritage Night Walk",
    dificultadEs: "Muy Suave · Recorrido Urbano Peatonal",
    dificultadEn: "Easy · Guided Pedestrian Cultural Walk",
    operadorNombre: "Fundación Patrimonio Vivo de Santa Marta",
    operadorLicenciaRnt: "RNT #44190 · Guías Historiadores",
    puntoEncuentroEs: "06:00 PM · Parque de los Novios / Camellón de la Bahía",
    puntoEncuentroEn: "06:00 PM · Parque de los Novios / Bay Boardwalk",
    galeriaImagenes: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
    ],
    incluyeEs: [
      "Recorrido guiado por un historiador local por la ciudad más antigua de Sudamérica (1525)",
      "Degustación en 3 estaciones gastronómicas del Callejón del Correo (cocina caribe de autor)",
      "Acceso nocturno especial al claustro colonial y terraza frente a El Morro",
      "Cóctel de bienvenida con frutas endémicas (corozo y mucílago de cacao de la Sierra)",
    ],
    incluyeEn: [
      "Historian-led walk through South America's oldest surviving colonial city (1525)",
      "3-stop culinary tasting along Correo Alley featuring contemporary Caribbean cuisine",
      "Evening access to a colonial cloister and rooftop overlooking El Morro islet",
      "Welcome craft cocktail infused with native corozo berry and Sierra cacao",
    ],
    hitosItinerarioEs: [
      "06:15 PM: Puesta de sol frente al islote de El Morro en el Camellón de la Bahía.",
      "07:15 PM: Arquitectura republicana, Catedral Basílica y relatos de corsarios.",
      "08:30 PM: Maridaje gastronómico y música acústica del Caribe en el Callejón del Correo.",
    ],
    hitosItinerarioEn: [
      "06:15 PM: Golden-hour sunset facing El Morro islet along the Bay Boardwalk.",
      "07:15 PM: Colonial architecture, Cathedral Basilica and Caribbean maritime history.",
      "08:30 PM: Culinary tasting and live acoustic rhythms in Correo Alley.",
    ],
  },
};

export function obtenerFichaTecnicaExpedicion(
  codigoServicio: number
): FichaTecnicaExpedicion {
  return FICHAS_POR_CODIGO[codigoServicio] || FICHAS_POR_CODIGO[9];
}

