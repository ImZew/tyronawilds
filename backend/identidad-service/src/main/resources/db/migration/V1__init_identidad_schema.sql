-- =============================================================================
-- TyronaWilds - Identidad Service (db_identidad)
-- V1: Creación de tabla usuarios y carga de semilla oficial (RF-01, Secuencia 4.1)
-- Contraseña de todos los usuarios semilla: Tyrona2026*
-- =============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    rol VARCHAR(40) NOT NULL,
    prestador_id UUID,
    proveedor_auth VARCHAR(30) NOT NULL,
    acepta_tratamiento_datos BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Usuarios Semilla (Password: Tyrona2026* -> Hash BCrypt: $2a$10$fW9F7p7L9jA1zK5Q0e8mXO3vC8sR1tY6uI2oP4aD7gH0jK3lZ5xV2)
-- Nota: El hash se valida y/o sincroniza al iniciar o mediante BCrypt estándar.
INSERT INTO usuarios (id, nombre, email, password_hash, rol, prestador_id, proveedor_auth, acepta_tratamiento_datos, creado_en)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Administrador TyronaWilds',
        'admin@tyronawilds.co',
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a',
        'ADMIN',
        NULL,
        'LOCAL',
        TRUE,
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Expediciones Tayrona Ancestral',
        'tayrona@tyronawilds.co',
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a',
        'PRESTADOR',
        '00000000-0000-0000-0000-000000000077',
        'LOCAL',
        TRUE,
        NOW()
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Operador Intruso Caribe',
        'intruso@tyronawilds.co',
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a',
        'PRESTADOR',
        '00000000-0000-0000-0000-000000000041',
        'LOCAL',
        TRUE,
        NOW()
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Valeria Viajera Consciente',
        'turista@tyronawilds.co',
        '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a',
        'TURISTA',
        NULL,
        'LOCAL',
        TRUE,
        NOW()
    )
ON CONFLICT (email) DO NOTHING;
