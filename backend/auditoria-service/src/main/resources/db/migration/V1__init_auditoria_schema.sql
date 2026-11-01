-- =============================================================================
-- TyronaWilds - Auditoría Service (db_auditoria)
-- V1: Tabla inmutable registro_auditoria (Solo inserción INSERT - RNF-07, 2.4b)
-- =============================================================================

CREATE TABLE IF NOT EXISTS registro_auditoria (
    id UUID PRIMARY KEY,
    evento_origen_id UUID,
    usuario_id VARCHAR(100) NOT NULL,
    rol VARCHAR(50),
    accion VARCHAR(120) NOT NULL,
    recurso VARCHAR(255) NOT NULL,
    resultado VARCHAR(50) NOT NULL,
    motivo TEXT,
    ip_origen VARCHAR(60),
    trace_id VARCHAR(100),
    fecha_operacion TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registro_auditoria_fecha_desc
    ON registro_auditoria (fecha_operacion DESC);

CREATE INDEX IF NOT EXISTS idx_registro_auditoria_usuario_id
    ON registro_auditoria (usuario_id);

CREATE INDEX IF NOT EXISTS idx_registro_auditoria_resultado
    ON registro_auditoria (resultado);
