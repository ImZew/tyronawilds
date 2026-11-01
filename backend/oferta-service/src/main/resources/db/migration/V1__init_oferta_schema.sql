-- =============================================================================
-- TyronaWilds - Oferta Service (db_oferta)
-- V1: Tablas prestadores y actividades_turisticas + Seed Data Santa Marta
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS prestadores (
    id UUID PRIMARY KEY,
    codigo_publico BIGINT UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo_operador VARCHAR(40) NOT NULL,
    email_contacto VARCHAR(150),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS actividades_turisticas (
    id UUID PRIMARY KEY,
    codigo_servicio BIGINT UNIQUE NOT NULL,
    prestador_id UUID NOT NULL REFERENCES prestadores(id),
    codigo_prestador BIGINT NOT NULL,
    nombre_es VARCHAR(160) NOT NULL,
    nombre_en VARCHAR(160) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    ubicacion VARCHAR(120) NOT NULL,
    coordenadas_hud VARCHAR(80) NOT NULL,
    altitud_msnm INT NOT NULL,
    precio_cop NUMERIC(12,2) NOT NULL,
    capacidad_maxima INT NOT NULL,
    nivel_ocupacion_actual INT NOT NULL DEFAULT 35,
    es_sostenible BOOLEAN NOT NULL DEFAULT TRUE,
    imagen_url TEXT NOT NULL,
    descripcion_es TEXT NOT NULL,
    descripcion_en TEXT NOT NULL,
    tags_afinidad VARCHAR(255) NOT NULL,
    ultima_actualizacion TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actividades_categoria ON actividades_turisticas(categoria);
CREATE INDEX IF NOT EXISTS idx_actividades_prestador_id ON actividades_turisticas(prestador_id);
CREATE INDEX IF NOT EXISTS idx_actividades_codigo_servicio ON actividades_turisticas(codigo_servicio);

-- 1. Prestadores Semilla (77: Dueño legítimo | 41: Operador intruso para Secuencia 4.1)
INSERT INTO prestadores (id, codigo_publico, nombre, tipo_operador, email_contacto, activo)
VALUES
    (
        '00000000-0000-0000-0000-000000000077',
        77,
        'Expediciones Tayrona & Sierra',
        'PRESTADOR',
        'tayrona@tyronawilds.co',
        TRUE
    ),
    (
        '00000000-0000-0000-0000-000000000041',
        41,
        'Operador Caribe',
        'PEQUENO_OPERADOR',
        'intruso@tyronawilds.co',
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Seis Expediciones Icónicas de Santa Marta (incluyendo codigo_servicio = 9 del prestador 77)
INSERT INTO actividades_turisticas (
    id, codigo_servicio, prestador_id, codigo_prestador,
    nombre_es, nombre_en, slug, categoria, ubicacion, coordenadas_hud,
    altitud_msnm, precio_cop, capacidad_maxima, nivel_ocupacion_actual,
    es_sostenible, imagen_url, descripcion_es, descripcion_en, tags_afinidad, ultima_actualizacion
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000009',
        9,
        '00000000-0000-0000-0000-000000000077',
        77,
        'PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)',
        'LOSE THE MAP: LOST CITY (TEYUNA) TREK',
        'pierde-el-mapa-ciudad-perdida-teyuna',
        'ALTA_MONTANA_ANCESTRAL',
        'Sierra Nevada de Santa Marta',
        '11°02''16"N 73°55''31"W',
        1200,
        1850000.00,
        16,
        42,
        TRUE,
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80',
        'Ascenso de 4 días al corazón sagrado de Teyuna junto a guías indígenas Kogui y Wiwa. Selva húmeda tropical, terrazas líticas milenarias y desconexión total.',
        '4-day ascent into the sacred heart of Teyuna guided by Kogui and Wiwa elders. Tropical rainforest, ancient stone terraces and total off-grid immersion.',
        'trekking,sierra-nevada,ancestral,sostenible,arqueologia,selva',
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        102,
        '00000000-0000-0000-0000-000000000077',
        77,
        'CABO SAN JUAN & SENDERO NUIJPIA',
        'CABO SAN JUAN & NUIJPIA TRAIL',
        'cabo-san-juan-sendero-nuijpia',
        'COSTA_PARQUE_NACIONAL',
        'Parque Nacional Natural Tayrona',
        '11°19''51"N 73°57''43"W',
        15,
        290000.00,
        40,
        88,
        TRUE,
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
        'Travesía entre bloques graníticos gigantes donde la selva de la Sierra Nevada se funde con el oleaje del Caribe en Cabo San Juan del Guía.',
        'Journey across giant granitic boulders where the Sierra Nevada jungle meets the Caribbean surf at Cabo San Juan del Guia.',
        'playa,tayrona,senderismo,naturaleza,caribe,fotografia',
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        103,
        '00000000-0000-0000-0000-000000000077',
        77,
        'EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA',
        'BIOCLIMATIC EXPEDITION & MARINKA WATERFALLS',
        'expedicion-bioclimatica-cascadas-marinka',
        'BOSQUE_NIEBLA_SOSTENIBLE',
        'Minca / Corregimiento de Bonda',
        '11°08''35"N 74°06''58"W',
        650,
        210000.00,
        24,
        28,
        TRUE,
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80',
        'Alternativa ecológica prioritaria para desconcentrar el Parque Tayrona (RF-10). Avistamiento de aves endémicas, cafetales orgánicos de sombra y pozos de agua glaciar.',
        'Priority ecological alternative designed to decompress Tayrona Park (RF-10). Endemic birdwatching, shade-grown organic coffee and glacier-fed pools.',
        'minca,bonda,cascadas,cafe,avistamiento-aves,sostenible,desconcentracion',
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        104,
        '00000000-0000-0000-0000-000000000041',
        41,
        'INMERSIÓN CORALINA ISLA AGUJA & GRANATE',
        'CORAL REEF DIVE ISLA AGUJA & GRANATE',
        'inmersion-coralina-isla-aguja-granate',
        'ECOSISTEMA_MARINO',
        'Taganga / Bahía de Granate',
        '11°19''10"N 74°11''45"W',
        0,
        340000.00,
        12,
        45,
        TRUE,
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80',
        'Buceo de conservación y apnea en arrecifes coralinos protegidos entre Taganga e Isla Aguja con pescadores artesanales locales.',
        'Conservation scuba diving and freediving in protected coral reefs between Taganga and Isla Aguja alongside local artisanal fishermen.',
        'buceo,taganga,coral,marino,apnea,caribe',
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000005',
        105,
        '00000000-0000-0000-0000-000000000041',
        41,
        'DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA',
        'DON DIEGO RIVER DESCENT & ARHUACO CONNECTION',
        'descenso-rio-don-diego-conexion-arhuaca',
        'TURISMO_COMUNITARIO',
        'Piedemonte Sierra Nevada',
        '11°15''22"N 73°42''10"W',
        45,
        245000.00,
        18,
        30,
        TRUE,
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80',
        'Navegación silenciosa desde los ríos sagrados de la Sierra hasta la desembocadura en el mar Caribe, operado por pequeños operadores comunitarios (ST-03).',
        'Silent river navigation from the sacred rivers of the Sierra down to the Caribbean mouth, operated by local community micro-operators (ST-03).',
        'rio,comunitario,arhuaco,kayak,sostenible,naturaleza',
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000006',
        106,
        '00000000-0000-0000-0000-000000000077',
        77,
        'TRAVESÍA NOCTURNA CENTRO HISTÓRICO & BAHÍA',
        'NIGHT EXPEDITION HISTORIC CENTER & BAY',
        'travesia-nocturna-centro-historico-bahia',
        'PATRIMONIO_CULTURAL',
        'Centro Histórico de Santa Marta',
        '11°14''38"N 74°12''50"W',
        5,
        125000.00,
        25,
        35,
        TRUE,
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80',
        'Recorrido arquitectónico, gastronómico y sonoro por la ciudad más antigua de Sudamérica, el Callejón del Correo y el Camellón de la Bahía.',
        'Architectural, culinary and sonic walk through South America''s oldest surviving city, Correo Alley and the Bay Boardwalk.',
        'cultura,historia,gastronomia,nocturno,santa-marta',
        NOW()
    )
ON CONFLICT (codigo_servicio) DO NOTHING;
