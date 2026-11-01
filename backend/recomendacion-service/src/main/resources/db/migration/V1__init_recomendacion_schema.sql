-- =============================================================================
-- TyronaWilds - Recomendación Service (db_recomendacion)
-- V1: Tablas perfil_turista, historial_recomendacion + pgvector y seed data
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS perfil_turista (
    usuario_id UUID PRIMARY KEY,
    intereses VARCHAR(255) NOT NULL,
    prefiere_sostenible BOOLEAN NOT NULL DEFAULT TRUE,
    presupuesto_max_cop NUMERIC(12,2),
    embedding_texto TEXT,
    actualizado_en TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS historial_recomendacion (
    id UUID PRIMARY KEY,
    correlacion_id VARCHAR(100) NOT NULL,
    usuario_id UUID,
    nivel_ia_aplicado VARCHAR(30) NOT NULL,
    estado_final VARCHAR(40) NOT NULL,
    contexto_degradado BOOLEAN NOT NULL,
    traza_estados TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_historial_rec_usuario_id ON historial_recomendacion(usuario_id);

-- Perfiles Semilla para pruebas de recomendación personalizada (RF-12, Ficha 5.2)
INSERT INTO perfil_turista (
    usuario_id, intereses, prefiere_sostenible, presupuesto_max_cop, embedding_texto, actualizado_en
)
VALUES
    (
        '44444444-4444-4444-4444-444444444444',
        'trekking,sierra-nevada,ancestral,sostenible,minca,cascadas,cafe,avistamiento-aves',
        TRUE,
        2000000.00,
        '[0.88, 0.94, 0.79, 0.91, 0.85, 0.12]',
        NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'sostenible,desconcentracion,minca,bonda,comunitario,arhuaco',
        TRUE,
        2500000.00,
        '[0.95, 0.89, 0.92, 0.76, 0.84, 0.30]',
        NOW()
    )
ON CONFLICT (usuario_id) DO NOTHING;
