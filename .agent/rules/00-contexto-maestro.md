# Contexto Maestro y Reglas de Ingeniería - TyronaWilds (PlataformaTurismoSM)

Actúa como un Principal Software Architect construyendo **TyronaWilds** (`PlataformaTurismoSM`), la Plataforma Digital para la Gestión Integrada y Sostenible del Turismo en Santa Marta (Proyecto Final de Arquitectura de Software - Ingeniería de Sistemas, Universidad del Magdalena).

## 1. Stack Tecnológico Oficial (Laboratorio 3 y ADR-001)
- **Marca del Producto**: TyronaWilds (`TYRONAWILDS™` - "Pierde el mapa. Descubre el origen: Sierra Nevada, Tayrona & Caribe").
- **Backend**: Java 21 + Spring Boot 3.3.5 + Spring Cloud 2023.0.3 (Monorepo Maven Multi-Módulo en la carpeta `backend/`, groupId `co.edu.unimagdalena.tyronawilds`).
- **Persistencia**: Un clúster PostgreSQL 16 (`pgvector/pgvector:pg16`, contenedor `tyronawilds-postgres`) con 6 bases de datos lógicas aisladas (Database-per-Service): `db_identidad`, `db_oferta`, `db_reservas`, `db_recomendacion`, `db_indicadores`, `db_auditoria`. Migraciones estrictas con **Flyway**.
- **Caché y Mensajería**: Redis 7 (`tyronawilds-redis`, cache-aside, TTL 300s) y RabbitMQ 3.13 (`tyronawilds-rabbitmq`, exchange topic, colas durables).
- **Frontend (`frontend/`)**: Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion + GSAP + Lenis.

## 2. Catálogo Oficial de Módulos Backend (`co.edu.unimagdalena.tyronawilds`)
1. `contratos-compartidos`: Librería JAR sin lógica de negocio. Contiene DTOs (`record`), `RolUsuario`, `SecurityHeaders` (`X-User-Id`, `X-Rol`, `X-Prestador-Id`, `X-Correlation-Id`), `ApiErrorResponse` (ER-04, ER-05) y eventos de dominio (`EventoAccesoDenegado`, `EventoReservaConfirmada`).
2. `api-gateway` (Puerto 8080): Spring Cloud Gateway, validación JWT con clave pública de `identidad-service`, Rate Limiting e inyección de cabeceras `X-User-Id`, `X-Rol`, `X-Prestador-Id`.
3. `identidad-service` (Puerto 8081, BD `db_identidad`): Registro, login, BCrypt, emisión de JWT y punto de variabilidad `AUTH_PROVEEDORES` (`local`, `google`, `local,google`).
4. `oferta-service` (Puerto 8082, BD `db_oferta` + `pgvector`): Catálogo de atractivos, actividades y prestadores (RF-02, RF-03, RF-07). Autorización por rol y propiedad del recurso: si `prestadorId != recurso.prestadorId` responde `403 Forbidden` (`codigo: "ACCESO_DENEGADO"`) y publica asíncronamente `EventoAccesoDenegado` en RabbitMQ (Secuencia 4.1).
5. `reservas-service` (Puerto 8083, BD `db_reservas`): Gestión de disponibilidad (`DISPONIBILIDAD`) y reservas (`RESERVA`) con transacciones ACID (`@Transactional`) y bloqueo pesimista/optimista (`SELECT ... FOR UPDATE` / `@Version` + `CHECK (cupos_disponibles >= 0)`) para evitar sobreasignación bajo concurrencia (RNF-13, ER-02).
6. `recomendacion-service` (Puerto 8084, BD `db_recomendacion` + `pgvector`): Máquina de estados comprensiva (`Solicitada`, `CargandoPerfil`, `EnriqueciendoContexto`, `ContextoDegradado`, `Ranqueando`, `ModoBasico`, `GenerandoExplicacion`) y variabilidad `RECOMENDACION_NIVEL=BASICO|PERSONALIZADO` con `@ConditionalOnProperty`.
7. `integracion-service` (Puerto 8085): Jerarquía `AdaptadorFuente` (`AdaptadorClima`, `AdaptadorAforo`, `AdaptadorEventos`) con Resilience4j `@CircuitBreaker` (timeout 2s) y caché Redis (`ER-01`).
8. `indicadores-service` (Puerto 8086, BD `db_indicadores`): Reportes y monitoreo de capacidad de carga turística / sostenibilidad (RF-09, RF-10, RF-11).
9. `auditoria-service` (Puerto 8087, BD `db_auditoria`): Consumidor de RabbitMQ (`cola auditoria.q`) solo inserción (`INSERT`), trazabilidad RNF-07.

## 3. Reglas Inquebrantables de Código (SOLID y Arquitectura Hexagonal)
- Estructura de paquetes obligatoria en cada microservicio:
  - `domain.model`, `domain.port.in`, `domain.port.out`, `domain.exception`
  - `application.service`
  - `infrastructure.adapter.in.web`, `infrastructure.adapter.in.messaging`, `infrastructure.adapter.out.persistence`, `infrastructure.config`
- Prohibido usar `@Autowired` en campos; usar siempre inyección por constructor.
- Prohibido exponer entidades `@Entity` de JPA en controladores REST; usar siempre `record` DTOs.
- Prohibido exponer stack traces al usuario (ER-05); usar `@RestControllerAdvice` devolviendo `ApiErrorResponse`.
- Prohibido usar `ddl-auto: update`; toda tabla se crea mediante scripts versionados de Flyway (`V1__*.sql`).

## 4. Dirección de Arte Frontend de TyronaWilds (Estilo Editorial / Brutalista "PIERDE EL MAPA")
- Prohibido el diseño genérico de IA.
- Marca en cabecera: `TYRONAWILDS™` con estética cinematográfica de expedición en Santa Marta (Sierra Nevada, Parque Tayrona, Ciudad Perdida, Minca, Taganga, Bonda).
- Paleta: Negro Obsidiana (`#0A0A0A`), Rojo/Terracota Intenso (`#E63000`), Arena/Hueso (`#F4F0EA`), Verde Selva (`#0D261C`).
- Tipografía Display condensada gigante superpuesta con efecto de profundidad, combinada con micro-interfaz técnica tipo HUD en las esquinas (coordenadas GPS reales, temperatura desde `integracion-service`, estado de Circuit Breaker, aforo en vivo y selector `ES / EN`).
