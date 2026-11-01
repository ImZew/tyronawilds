-- =============================================================================
-- TyronaWilds (PlataformaTurismoSM) - Migración V2: Row Level Security (RLS)
-- Base de Datos: db_reservas (reservas-service)
-- Estándar: Defensa en Profundidad y Aislamiento de Registros por Propietario
-- =============================================================================

ALTER TABLE disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Lectura pública de disponibilidad de horarios para consulta de catálogo y checkout
DROP POLICY IF EXISTS policy_disponibilidad_lectura_publica ON disponibilidad;
CREATE POLICY policy_disponibilidad_lectura_publica
    ON disponibilidad
    FOR SELECT
    USING (true);

-- Actualización transaccional de cupos permitida al rol de aplicación del microservicio
DROP POLICY IF EXISTS policy_disponibilidad_escritura_app ON disponibilidad;
CREATE POLICY policy_disponibilidad_escritura_app
    ON disponibilidad
    FOR ALL
    USING (
        current_user = 'postgres'
        OR COALESCE(current_setting('app.current_user_role', true), '') IN ('ADMIN', 'PRESTADOR', 'TURISTA')
    );

-- Política de propiedad en reservas: un usuario solo accede/modifica sus propias reservas
-- o el motor transaccional de reservas-service actúa bajo el contexto autenticado
DROP POLICY IF EXISTS policy_reservas_propiedad_usuario ON reservas;
CREATE POLICY policy_reservas_propiedad_usuario
    ON reservas
    FOR ALL
    USING (
        current_user = 'postgres'
        OR COALESCE(current_setting('app.current_user_role', true), '') = 'ADMIN'
        OR COALESCE(current_setting('app.current_user_id', true), '') = usuario_id::text
    )
    WITH CHECK (
        current_user = 'postgres'
        OR COALESCE(current_setting('app.current_user_role', true), '') = 'ADMIN'
        OR COALESCE(current_setting('app.current_user_id', true), '') = usuario_id::text
    );
