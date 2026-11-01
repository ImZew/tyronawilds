-- =============================================================================
-- TyronaWilds - Indicadores Service (db_indicadores)
-- V1: Tabla indicador_capacidad_destino y datos semilla para Santa Marta
-- =============================================================================

CREATE TABLE IF NOT EXISTS indicador_capacidad_destino (
    id UUID PRIMARY KEY,
    actividad_id UUID UNIQUE NOT NULL,
    nombre_destino VARCHAR(160) NOT NULL,
    zona VARCHAR(100) NOT NULL,
    capacidad_maxima INT NOT NULL,
    ocupacion_actual INT NOT NULL,
    porcentaje_ocupacion NUMERIC(5,2) NOT NULL,
    estado_alerta VARCHAR(30) NOT NULL,
    alternativa_sostenible_sugerida VARCHAR(160),
    ultima_actualizacion TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indicador_estado_alerta ON indicador_capacidad_destino(estado_alerta);

INSERT INTO indicador_capacidad_destino (
    id, actividad_id, nombre_destino, zona, capacidad_maxima, ocupacion_actual,
    porcentaje_ocupacion, estado_alerta, alternativa_sostenible_sugerida, ultima_actualizacion
)
VALUES
    (
        'f0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000009',
        'PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)',
        'Sierra Nevada de Santa Marta',
        400,
        168,
        42.00,
        'NORMAL',
        'Río Don Diego & Conexión Arhuaca',
        NOW()
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'CABO SAN JUAN & SENDERO NUIJPIA',
        'Parque Nacional Natural Tayrona',
        500,
        440,
        88.00,
        'CRITICA',
        'Expedición Bioclimática & Cascadas de Marinka (Minca / Bonda)',
        NOW()
    ),
    (
        'f0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA',
        'Minca / Corregimiento de Bonda',
        300,
        84,
        28.00,
        'NORMAL',
        'Ruta Cafetera Orgánica de Sombra (Minca)',
        NOW()
    ),
    (
        'f0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000004',
        'INMERSIÓN CORALINA ISLA AGUJA & GRANATE',
        'Taganga / Bahía de Granate',
        120,
        78,
        65.00,
        'MODERADA',
        'Travesía Nocturna Centro Histórico & Bahía',
        NOW()
    ),
    (
        'f0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000005',
        'DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA',
        'Piedemonte Sierra Nevada',
        180,
        54,
        30.00,
        'NORMAL',
        'Sendero Bioclimático Minca',
        NOW()
    ),
    (
        'f0000000-0000-0000-0000-000000000006',
        'a0000000-0000-0000-0000-000000000006',
        'TRAVESÍA NOCTURNA CENTRO HISTÓRICO & BAHÍA',
        'Centro Histórico de Santa Marta',
        250,
        88,
        35.20,
        'NORMAL',
        'Camellón de la Bahía & Quinta de San Pedro',
        NOW()
    )
ON CONFLICT (actividad_id) DO NOTHING;
