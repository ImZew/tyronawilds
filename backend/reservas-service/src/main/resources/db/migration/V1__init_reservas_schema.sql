-- =============================================================================
-- TyronaWilds - Reservas Service (db_reservas)
-- V1: Tablas disponibilidad y reserva con invariantes CHECK y seed data Santa Marta
-- =============================================================================

CREATE TABLE IF NOT EXISTS disponibilidad (
    id UUID PRIMARY KEY,
    actividad_id UUID NOT NULL,
    nombre_actividad VARCHAR(160) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    capacidad_total INT NOT NULL CHECK (capacidad_total > 0),
    cupos_disponibles INT NOT NULL CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= capacidad_total),
    precio_unitario_cop NUMERIC(12,2) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (actividad_id, fecha, hora_inicio)
);

CREATE TABLE IF NOT EXISTS reserva (
    id UUID PRIMARY KEY,
    codigo_reserva VARCHAR(30) UNIQUE NOT NULL,
    usuario_id UUID NOT NULL,
    disponibilidad_id UUID NOT NULL REFERENCES disponibilidad(id),
    actividad_id UUID NOT NULL,
    cantidad_cupos INT NOT NULL CHECK (cantidad_cupos > 0),
    monto_total_cop NUMERIC(12,2) NOT NULL,
    estado_reserva VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    fecha_operacion TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_actividad_fecha
    ON disponibilidad(actividad_id, fecha);

CREATE INDEX IF NOT EXISTS idx_reserva_usuario_id
    ON reserva(usuario_id);

-- Disponibilidades Semilla vinculadas a los UUIDs oficiales de oferta-service
INSERT INTO disponibilidad (
    id, actividad_id, nombre_actividad, fecha, hora_inicio,
    capacidad_total, cupos_disponibles, precio_unitario_cop, version
)
VALUES
    -- 1. Ciudad Perdida (Teyuna) - Horario crítico con SOLO 5 cupos disponibles (listo para prueba RNF-13 / ER-02)
    (
        'd0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000009',
        'PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)',
        '2026-11-15',
        '05:30:00',
        16,
        5,
        1850000.00,
        0
    ),
    -- 1b. Ciudad Perdida (Teyuna) - Horario alternativo sugerido por ER-02 con 14 cupos libres
    (
        'd0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000009',
        'PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)',
        '2026-11-16',
        '06:00:00',
        16,
        14,
        1850000.00,
        0
    ),
    -- 2. Cabo San Juan & Sendero Nuijpia (Parque Tayrona) - Alta demanda (solo 4 cupos)
    (
        'd0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000002',
        'CABO SAN JUAN & SENDERO NUIJPIA',
        '2026-11-15',
        '07:00:00',
        40,
        4,
        290000.00,
        0
    ),
    -- 2b. Cabo San Juan alternativo
    (
        'd0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000002',
        'CABO SAN JUAN & SENDERO NUIJPIA',
        '2026-11-17',
        '07:00:00',
        40,
        22,
        290000.00,
        0
    ),
    -- 3. Expedición Bioclimática & Cascadas de Marinka (Minca / Bonda - Alternativa Sostenible RF-10)
    (
        'd0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000003',
        'EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA',
        '2026-11-15',
        '08:00:00',
        24,
        19,
        210000.00,
        0
    ),
    -- 4. Inmersión Coralina Isla Aguja & Granate (Taganga)
    (
        'd0000000-0000-0000-0000-000000000006',
        'a0000000-0000-0000-0000-000000000004',
        'INMERSIÓN CORALINA ISLA AGUJA & GRANATE',
        '2026-11-15',
        '08:30:00',
        12,
        9,
        340000.00,
        0
    ),
    -- 5. Descenso Río Don Diego & Conexión Arhuaca
    (
        'd0000000-0000-0000-0000-000000000007',
        'a0000000-0000-0000-0000-000000000005',
        'DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA',
        '2026-11-15',
        '07:30:00',
        18,
        15,
        245000.00,
        0
    ),
    -- 6. Travesía Nocturna Centro Histórico & Bahía
    (
        'd0000000-0000-0000-0000-000000000008',
        'a0000000-0000-0000-0000-000000000006',
        'TRAVESÍA NOCTURNA CENTRO HISTÓRICO & BAHÍA',
        '2026-11-15',
        '18:30:00',
        25,
        20,
        125000.00,
        0
    )
ON CONFLICT (id) DO NOTHING;
