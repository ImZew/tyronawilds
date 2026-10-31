-- =============================================================================
-- TyronaWilds (PlataformaTurismoSM)
-- Inicialización del Clúster PostgreSQL 16 (Database-per-Service + pgvector)
-- =============================================================================

CREATE DATABASE db_identidad;
CREATE DATABASE db_oferta;
CREATE DATABASE db_reservas;
CREATE DATABASE db_recomendacion;
CREATE DATABASE db_indicadores;
CREATE DATABASE db_auditoria;

-- Activar extensión pgvector en db_oferta
\connect db_oferta;
CREATE EXTENSION IF NOT EXISTS vector;

-- Activar extensión pgvector en db_recomendacion
\connect db_recomendacion;
CREATE EXTENSION IF NOT EXISTS vector;
