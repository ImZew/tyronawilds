# TYRONAWILDS™ (`PlataformaTurismoSM`)

> **"PIERDE EL MAPA. DESCUBRE EL ORIGEN: SIERRA NEVADA, PARQUE TAYRONA & CARIBE."**  
> **Plataforma Digital para la Gestión Integrada, Resiliente y Sostenible del Turismo en el Distrito de Santa Marta, Colombia.**

![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-2023.0.3-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![PostgreSQL pgvector](https://img.shields.io/badge/PostgreSQL_16-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis 7](https://img.shields.io/badge/Redis-7_Alpine-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13_Topic-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Brutalist_HUD-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 1. Visión del Sistema y Propósito Arquitectónico

**TyronaWilds (`PlataformaTurismoSM`)** es una plataforma distribuida de grado empresarial diseñada en el marco de la cátedra de **Arquitectura de Software** del Programa de **Ingeniería de Sistemas de la Universidad del Magdalena** (Docente: **Ing. Carlos Oliveros**).

El sistema resuelve tres problemáticas estructurales del ecosistema turístico de Santa Marta (Sierra Nevada, Ciudad Perdida - Teyuna, Parque Nacional Natural Tayrona, Minca, Bonda y Taganga):
1. **Sobrecarga Ecológica Estacional (`RF-10`)**: Monitoreo en tiempo real de la capacidad de carga de cada ecosistema y desconcentración inteligente de flujos turísticos hacia rutas sostenibles (p. ej., Minca y Río Don Diego cuando Cabo San Juan supera el 80% de ocupación).
2. **Sobreventa en Reservas de Cupo Limitado (`RNF-13`, `ER-02`)**: Control transaccional **ACID** con bloqueo pesimista (`SELECT ... FOR UPDATE`) y optimista (`@Version`) sobre PostgreSQL, garantizando **cero sobreasignación** ante ráfagas concurrentes de reservas.
3. **Asimetría Tecnológica y Desconexión de Servicios Externos (`ER-01`, `RF-08`, `RF-12`)**: Motor de recomendación de **IA Explicable** con búsqueda vectorial (`pgvector`), máquina de estados determinista y tolerancia a fallos mediante **Circuit Breaker (`Resilience4j`)** con degradación elegante hacia **Redis**.

---

## 2. Diagrama de Arquitectura de Microservicios (C4 Contenedores)

```mermaid
flowchart TB
    subgraph Cliente["Capa de Presentación (ClienteWebMovil - Puerto 3000)"]
        UI["Next.js 14 App Router + TypeScript + Tailwind CSS\nEstética Editorial 'PIERDE EL MAPA' + Consola Architecture Live Lab"]
    end

    subgraph Edge["Capa de Borde y Enrutamiento (Puerto 8080)"]
        GW["api-gateway (Spring Cloud Gateway)\nValidación JWT (HMAC-SHA256) + Inyección X-User-Id, X-Rol, X-Prestador-Id, X-Correlation-Id"]
    end

    subgraph Core["Capa de Microservicios de Dominio (Arquitectura Hexagonal + SOLID)"]
        ID["identidad-service (:8081)\nAutenticación JWT + BCrypt\nVariabilidad: AUTH_PROVEEDORES"]
        OF["oferta-service (:8082)\nCatálogo + Control Propiedad RF-03\nCaché Redis + Secuencia 4.1"]
        RE["reservas-service (:8083)\nReservas ACID + PESSIMISTIC_WRITE\nSimulador 30 Hilos Concurrentes"]
        IA["recomendacion-service (:8084)\nOrquestador 7 Estados (4.2) + pgvector\nVariabilidad: RECOMENDACION_NIVEL"]
        IN["integracion-service (:8085)\nJerarquía AdaptadorFuente\nResilience4j Circuit Breaker (<=2s)"]
        IND["indicadores-service (:8086)\nMonitoreo Sostenibilidad RF-10\nTablero Distrital ST-05 (CU-07)"]
        AUD["auditoria-service (:8087)\nBitácora Inmutable Append-Only\nTrazabilidad RNF-07 / ER-04"]
    end

    subgraph Infra["Capa de Persistencia Políglota y Mensajería Asíncrona (Docker)"]
        PG[("PostgreSQL 16 + pgvector (:5432)\n6 Bases Lógicas (Database-per-Service)\nFlyway Migrations")]
        RD[("Redis 7 Alpine (:6379)\nCache-Aside (TTL 300s)\nFallback Clima/Aforo ER-01")]
        MQ[["RabbitMQ 3.13 Topic (:5672 / :15672)\ntyronawilds.events.exchange\nauditoria.q | indicadores.q"]]
    end

    UI -->|"HTTP/REST + JSON\n(RNF-01 <= 3000ms)"| GW
    GW --> ID
    GW --> OF
    GW --> RE
    GW --> IA
    GW --> IN
    GW --> IND
    GW --> AUD

    RE -->|"REST Síncrono\nValidación Oferta"| OF
    IA -->|"REST Síncrono\nCatálogo + Vectores"| OF
    IA -->|"REST Síncrono (Timeout 2s)\nClima y Aforo"| IN

    OF -.->|"EventoAccesoDenegado\n(auditoria.acceso.denegado)"| MQ
    RE -.->|"ReservaConfirmadaEvent\n(reserva.confirmada)"| MQ
    MQ -.->|"Consume auditoria.q"| AUD
    MQ -.->|"Consume indicadores.q"| IND

    ID -->|"db_identidad"| PG
    OF -->|"db_oferta (pgvector)"| PG
    RE -->|"db_reservas (ACID)"| PG
    IA -->|"db_recomendacion (pgvector)"| PG
    IND -->|"db_indicadores"| PG
    AUD -->|"db_auditoria (INSERT-only)"| PG

    OF <-->|"Cache-Aside"| RD
    IN <-->|"Snapshot Contingencia ER-01"| RD
```

---

## 3. Catálogo de Módulos, Puertos, Bases de Datos y Responsables

| # | Módulo Maven / Carpeta | Puerto | Base de Datos / Infra | Patrones y Estándares Clave | Responsable Principal |
| :-: | :--- | :-: | :--- | :--- | :--- |
| 0 | `backend/contratos-compartidos` | `JAR` | Librería Común | `ApiErrorResponse` (`ER-04`/`ER-05`), `SecurityHeaders`, Eventos RabbitMQ | **Equipo Completo** |
| 1 | `backend/api-gateway` | `8080` | Stateless Edge | Spring Cloud Gateway, Filtro JWT Reactivo, Propagación de Identidad y `X-Correlation-Id` | **Sebastián Abaonza** |
| 2 | `backend/identidad-service` | `8081` | `db_identidad` | Hexagonal, `ProveedorAutenticacionPort` (Strategy), Variabilidad `AUTH_PROVEEDORES` | **Sebastián Abaonza** |
| 3 | `backend/auditoria-service` | `8087` | `db_auditoria` | Consumidor RabbitMQ (`auditoria.q`), Tabla Append-Only (`INSERT`), `RNF-07` | **Sebastián Abaonza** |
| 4 | `backend/oferta-service` | `8082` | `db_oferta` + Redis | Control de Propiedad (`prestadorId`), Secuencia 4.1 (`403` + Evento RabbitMQ), `pgvector` | **Melanye Mejía** |
| 5 | `backend/integracion-service` | `8085` | Redis (`ER-01`) | Jerarquía `AdaptadorFuente` (`Clima`, `Aforo`, `Eventos`), `Resilience4j @CircuitBreaker` | **Melanye Mejía** |
| 6 | `backend/reservas-service` | `8083` | `db_reservas` | Transacciones ACID, Bloqueo Pesimista `SELECT ... FOR UPDATE`, Simulador 30 Hilos (`RNF-13`) | **Fabián Valderrama** |
| 7 | `backend/recomendacion-service` | `8084` | `db_recomendacion` | Máquina de 7 Estados (`Punto 4.2`), Similitud Coseno `pgvector`, Variabilidad `5.2`, `RF-12` | **Rigoberto Varilla** |
| 8 | `backend/indicadores-service` | `8086` | `db_indicadores` | Monitoreo de Capacidad Ecológica (`RF-10`, `CU-07`), Consumidor RabbitMQ (`indicadores.q`) | **Rigoberto Varilla** |
| 9 | `frontend/` (`ClienteWebMovil`) | `3000` | Next.js 14 | Dirección de Arte **"PIERDE EL MAPA"**, Telemetría HUD, Consola **Architecture Live Lab** | **Equipo Completo** |

---

## 4. Decisiones de Ingeniería e Implementación Técnica

### 4.1. Arquitectura Hexagonal (Ports & Adapters) y Principios SOLID
Todos los microservicios del monorepo respetan una separación estricta en tres capas concéntricas sin fugas de infraestructura hacia el dominio:
- **`domain.model` / `domain.port.in` / `domain.port.out` / `domain.exception`**: Modelos de negocio puros, interfaces de casos de uso y puertos de salida. Ninguna clase de dominio acopla anotaciones de transporte web.
- **`application.service`**: Orquestadores de casos de uso con inyección por constructor (cero uso de `@Autowired` en campos, cumpliendo **DIP**).
  - *Ejemplo real*: [`OfertaApplicationService`](file:///c:/Users/abaon/tyronawilds/backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/application/service/OfertaApplicationService.java) depende exclusivamente de [`OfertaRepositoryPort`](file:///c:/Users/abaon/tyronawilds/backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/domain/port/out/OfertaRepositoryPort.java) y [`EventoSeguridadPublisherPort`](file:///c:/Users/abaon/tyronawilds/backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/domain/port/out/EventoSeguridadPublisherPort.java).
- **`infrastructure.adapter.in.web` / `messaging` / `out.persistence`**: Controladores REST que reciben y retornan únicamente `record` DTOs inmutables, manejadores globales `@RestControllerAdvice` que devuelven [`ApiErrorResponse`](file:///c:/Users/abaon/tyronawilds/backend/contratos-compartidos/src/main/java/co/edu/unimagdalena/tyronawilds/contratos/dto/ApiErrorResponse.java) sin exponer trazas internas (`ER-05`), y migraciones versionadas con **Flyway** (`ddl-auto: validate`).

---

### 4.2. Transacciones ACID y Control de Concurrencia (`RNF-13`, `ER-02`)
En [`reservas-service`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/java/co/edu/unimagdalena/tyronawilds/reservas/application/service/ReservaApplicationService.java), la creación de una reserva protege el inventario de cupos mediante tres barreras complementarias:
1. **Bloqueo Pesimista en Base de Datos (`PESSIMISTIC_WRITE`)**: [`SpringDataDisponibilidadRepository`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/java/co/edu/unimagdalena/tyronawilds/reservas/infrastructure/adapter/out/persistence/SpringDataDisponibilidadRepository.java) ejecuta `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`), serializando el acceso concurrente sobre la fila del horario solicitado dentro de `@Transactional(isolation = Isolation.READ_COMMITTED)`.
2. **Restricción de Integridad Relacional**: En [`V1__init_reservas_schema.sql`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/resources/db/migration/V1__init_reservas_schema.sql), la tabla `disponibilidad` define `CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= capacidad_total)`.
3. **Respuesta Determinista `409 Conflict` (`ER-02`)**: Cuando los cupos se agotan, [`CupoAgotadoException`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/java/co/edu/unimagdalena/tyronawilds/reservas/domain/exception/CupoAgotadoException.java) consulta horarios alternativos con cupo disponible para la misma actividad y los incluye en el payload del error `409 Conflict`.
4. **Verificación Automatizada y en Vivo**: El test de integración [`ReservaConcurrenciaIntegrationTest`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/test/java/co/edu/unimagdalena/tyronawilds/reservas/ReservaConcurrenciaIntegrationTest.java) y el endpoint `POST /api/v1/reservas/simulacion-concurrencia` disparan **30 hilos simultáneos (`CountDownLatch`)** contra un horario con **5 cupos**, confirmando exactamente **5 reservas (`201 Created`)**, **25 rechazos (`409 Conflict`)** y **0 cupos negativos**.

---

### 4.3. Seguridad en Profundidad y Secuencia 4.1 (`AC-05`, `ER-04`, `RNF-07`)
Implementa paso a paso el **Diagrama de Secuencia 4.1 del Laboratorio 3** (Intento de modificación no autorizada de un servicio turístico ajeno):

```mermaid
sequenceDiagram
    autonumber
    actor P41 as Prestador #41 (Intruso)
    participant GW as api-gateway (:8080)
    participant OF as oferta-service (:8082)
    participant MQ as RabbitMQ (tyronawilds.events.exchange)
    participant AUD as auditoria-service (:8087)
    participant DB as db_auditoria (PostgreSQL)

    P41->>GW: PUT /api/v1/prestadores/77/servicios/9 (JWT de Prestador #41)
    GW->>GW: Valida firma JWT e inyecta X-User-Id, X-Rol=PRESTADOR, X-Prestador-Id=41
    GW->>OF: Reenvía PUT /api/v1/prestadores/77/servicios/9 + Headers
    OF->>OF: OfertaApplicationService verifica propiedad (prestadorAutenticado=41 != dueñoRecurso=77)
    OF--)MQ: Publica EventoAccesoDenegado (routingKey: auditoria.acceso.denegado)
    OF-->>P41: HTTP 403 Forbidden (codigo: "ACCESO_DENEGADO", traceId)
    MQ--)AUD: Entrega mensaje en cola durable auditoria.q
    AUD->>DB: INSERT INTO registro_auditoria (resultado='DENEGADA', motivo='Violación Secuencia 4.1')
```

---

### 4.4. Resiliencia con Circuit Breaker (`ER-01`) y Máquina de Estados de IA (`Punto 4.2`)
- En [`integracion-service`](file:///c:/Users/abaon/tyronawilds/backend/integracion-service/src/main/java/co/edu/unimagdalena/tyronawilds/integracion/application/service/IntegracionContextualService.java), la jerarquía polimórfica [`AdaptadorFuente`](file:///c:/Users/abaon/tyronawilds/backend/integracion-service/src/main/java/co/edu/unimagdalena/tyronawilds/integracion/domain/port/out/AdaptadorFuente.java) (`AdaptadorClima`, `AdaptadorAforo`, `AdaptadorEventos`) está protegida por `@CircuitBreaker(name = "proveedorExternoClima", fallbackMethod = "obtenerContextoDesdeFallback")`. Si el proveedor externo supera el timeout de **2 segundos** o entra en fallo simulado, responde inmediatamente desde el snapshot en **Redis** (`fuenteDatos: "REDIS_CACHE_FALLBACK"`).
- En [`recomendacion-service`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/application/service/OrquestadorRecomendacionService.java), el `OrquestadorRecomendacion` ejecuta y registra la traza completa de la **Máquina de Estados Comprensiva (Punto 4.2 del Laboratorio 3)**:

```mermaid
stateDiagram-v2
    [*] --> Solicitada: POST /api/v1/recomendaciones
    Solicitada --> CargandoPerfil: validarSolicitud()
    CargandoPerfil --> EnriqueciendoContexto: perfilCargado
    EnriqueciendoContexto --> Ranqueando: contextoRecibido [<=2s & PERSONALIZADO]
    EnriqueciendoContexto --> ModoBasico: contextoRecibido [<=2s & BASICO]
    EnriqueciendoContexto --> ContextoDegradado: timeout / CircuitBreaker OPEN (ER-01)
    ContextoDegradado --> Ranqueando: usarCacheContingencia [PERSONALIZADO]
    ContextoDegradado --> ModoBasico: usarCacheContingencia [BASICO]
    Ranqueando --> GenerandoExplicacion: candidatosRanqueados (pgvector + RF-10)
    ModoBasico --> GenerandoExplicacion: candidatosPopulares (Reglas 5.2)
    GenerandoExplicacion --> FINAL_EXITO: ExplicadorRecomendacion (RF-12)
    FINAL_EXITO --> [*]
```

---

### 4.5. Puntos de Variabilidad Arquitectónica (`Punto 5.2` del Laboratorio 3)
1. **`NIVEL_RECOMENDACION_IA` (`recomendacion-service`)**:
   - Controlado por `app.recomendacion.nivel: ${RECOMENDACION_NIVEL:PERSONALIZADO}` en [`application.yml`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/resources/application.yml) y conmutable en caliente mediante `POST /api/v1/recomendaciones/configuracion`.
   - Alterna entre [`MotorRecomendacionPersonalizadoAdapter`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/infrastructure/adapter/out/ia/MotorRecomendacionPersonalizadoAdapter.java) (similitud coseno `pgvector` + penalización ecológica `RF-10`) y [`MotorRecomendacionBasicoAdapter`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/infrastructure/adapter/out/ia/MotorRecomendacionBasicoAdapter.java) (heurística ligera sin costo de inferencia vectorial).
2. **`PROVEEDOR_AUTENTICACION` (`identidad-service`)**:
   - Controlado por `app.auth.proveedores: ${AUTH_PROVEEDORES:local,google}` en [`application.yml`](file:///c:/Users/abaon/tyronawilds/backend/identidad-service/src/main/resources/application.yml).
   - Resuelve dinámicamente las implementaciones de [`ProveedorAutenticacionPort`](file:///c:/Users/abaon/tyronawilds/backend/identidad-service/src/main/java/co/edu/unimagdalena/tyronawilds/identidad/domain/port/out/ProveedorAutenticacionPort.java): [`LocalProveedorAutenticacionAdapter`](file:///c:/Users/abaon/tyronawilds/backend/identidad-service/src/main/java/co/edu/unimagdalena/tyronawilds/identidad/infrastructure/adapter/out/security/LocalProveedorAutenticacionAdapter.java) (BCrypt) y [`GoogleOAuth2ProveedorAdapter`](file:///c:/Users/abaon/tyronawilds/backend/identidad-service/src/main/java/co/edu/unimagdalena/tyronawilds/identidad/infrastructure/adapter/out/security/GoogleOAuth2ProveedorAdapter.java) (OAuth2).

---

## 5. Guía Rápida de Despliegue y Ejecución

### Requisitos Previos
- **Docker Desktop** activo (PostgreSQL 16 + `pgvector`, Redis 7, RabbitMQ 3.13).
- **JDK 21** y **Maven 3.9+**.
- **Node.js 20+** y **npm**.

### Opción A: Arranque Automatizado en 1 Comando (Windows PowerShell)
```powershell
.\start-tyronawilds.ps1
```
Para detener todos los procesos y contenedores limpiamente:
```powershell
.\stop-tyronawilds.ps1
```

### Opción B: Ejecución Paso a Paso Manual
1. **Levantar la infraestructura Docker**:
   ```powershell
   docker compose up -d
   ```
2. **Compilar y ejecutar las pruebas de los 9 módulos del Backend**:
   ```powershell
   cd backend
   mvn clean test install
   ```
3. **Levantar el Frontend (`ClienteWebMovil`)**:
   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd run dev
   ```
   Abrir en el navegador: **http://localhost:3000**

---

## 6. Credenciales Semilla de Prueba (Password: `Tyrona2026*`)

| Actor del Sistema | Correo Electrónico | Contraseña | Rol JWT | `prestadorId` / Código Público | Propósito de Prueba |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Turista** (`ST-01`) | `turista@tyronawilds.co` | `Tyrona2026*` | `TURISTA` | `N/A` | Exploración de catálogo, reservas ACID (`CU-03`) y recomendaciones IA (`CU-06`) |
| **Prestador Dueño** (`ST-02`) | `tayrona@tyronawilds.co` | `Tyrona2026*` | `PRESTADOR` | `00000000-0000-0000-0000-000000000077` (`#77`) | Propietario legítimo del Servicio `#9` (Ciudad Perdida - Teyuna) -> `200 OK` |
| **Prestador Intruso** (`ST-03`) | `intruso@tyronawilds.co` | `Tyrona2026*` | `PRESTADOR` | `00000000-0000-0000-0000-000000000041` (`#41`) | Actor atacante en la **Secuencia 4.1** contra el Servicio `#9` del Prestador `#77` -> `403 Forbidden` |
| **Administrador** (`ST-04`) | `admin@tyronawilds.co` | `Tyrona2026*` | `ADMIN` | `N/A` | Supervisión global y consulta de bitácora en `auditoria-service` |
| **Gestor Distrital** (`ST-05`) | `gestor@tyronawilds.co` | `Tyrona2026*` | `GESTOR_TURISTICO` | `N/A` | Monitoreo de indicadores de capacidad ecológica (`CU-07` / `RF-10`) |

---

## 7. Créditos Académicos

- **Universidad del Magdalena** — Facultad de Ingeniería — Programa de Ingeniería de Sistemas (Santa Marta D.T.C.H., Colombia).
- **Asignatura**: Arquitectura de Software — **Docente**: Ing. Carlos Oliveros.
- **Equipo de Arquitectura y Desarrollo**:
  - **Sebastián Abaonza** (`api-gateway`, `identidad-service`, `auditoria-service`, Infraestructura Docker & DevOps).
  - **Melanye Mejía** (`oferta-service`, `integracion-service`, Resiliencia `CircuitBreaker` & Caché Redis).
  - **Fabián Valderrama** (`reservas-service`, Concurrencia ACID, Bloqueo Pesimista & Pruebas Multihilo).
  - **Rigoberto Varilla** (`recomendacion-service`, `indicadores-service`, Máquina de Estados IA, `pgvector` & Sostenibilidad).
