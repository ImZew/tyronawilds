-- =============================================================================
-- TyronaWilds (PlataformaTurismoSM) - Migración V2: Row Level Security (RLS)
-- Base de Datos: db_oferta (oferta-service)
-- Estándar: Defensa en Profundidad y Propiedad de Recursos (RF-03 / Secuencia 4.1)
-- =============================================================================

ALTER TABLE prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_turisticas ENABLE ROW LEVEL SECURITY;

-- Lectura pública del catálogo de prestadores y actividades turísticas (CU-01 / CU-02)
DROP POLICY IF EXISTS policy_prestadores_lectura_publica ON prestadores;
CREATE POLICY policy_prestadores_lectura_publica
    ON prestadores
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS policy_actividades_lectura_publica ON actividades_turisticas;
CREATE POLICY policy_actividades_lectura_publica
    ON actividades_turisticas
    FOR SELECT
    USING (true);

-- Política de escritura/modificación restringida al propietario legítimo del recurso (prestador_id)
-- o al rol de aplicación / ADMIN tras validación en OfertaApplicationService
DROP POLICY IF EXISTS policy_actividades_propiedad_prestador ON actividades_turisticas;
CREATE POLICY policy_actividades_propiedad_prestador
    ON actividades_turisticas
    FOR ALL
    USING (
        current_user = 'postgres'
        OR COALESCE(current_setting('app.current_user_role', true), '') = 'ADMIN'
        OR COALESCE(current_setting('app.current_user_id', true), '') = prestador_id::text
    )
    WITH CHECK (
        current_user = 'postgres'
        OR COALESCE(current_setting('app.current_user_role', true), '') = 'ADMIN'
        OR COALESCE(current_setting('app.current_user_id', true), '') = prestador_id::text
    );
