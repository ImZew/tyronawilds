# Guion Oficial de Sustentación en Vivo — TyronaWilds (`PlataformaTurismoSM`)

- **Asignatura**: Arquitectura de Software — Ingeniería de Sistemas, Universidad del Magdalena
- **Docente Evaluador**: Ing. Carlos Oliveros
- **Fecha de Sustentación**: 19 de Noviembre
- **URL de Demostración en Vivo**: `http://localhost:3000` (Frontend `TYRONAWILDS™` + Consola **Architecture Live Lab**)
- **Gateway de Microservicios**: `http://localhost:8080` (`api-gateway`)

---

## Preparación Previa (5 minutos antes de iniciar la sustentación)

1. Verificar que los contenedores Docker estén en estado `healthy`:
   ```powershell
   docker ps
   ```
   *(Deben aparecer `tyronawilds-postgres`, `tyronawilds-redis` y `tyronawilds-rabbitmq`).*
2. Asegurarse de que la aplicación esté corriendo en `http://localhost:3000` (o ejecutar `.\start-tyronawilds.ps1`).
3. Tener abierto el navegador en `http://localhost:3000` y una pestaña adicional con RabbitMQ Management (`http://localhost:15672`, usuario `guest` / `guest`).

---

## Orden de Intervención de los 4 Integrantes (Tiempo Estimado: 16–20 Minutos)

---

### BLOQUE 1: Sebastián Abaonza (Minutos 00:00 – 04:30)
**Rol en la Sustentación**: *Arquitectura Global, Borde de Seguridad (`api-gateway`), Autenticación con Variabilidad (`identidad-service`) y Trazabilidad Inmutable (`auditoria-service`).*

#### 1. ¿Qué debe explicar conceptualmente?
- Presentar la visión de **TyronaWilds (`PlataformaTurismoSM`)** y su arquitectura de microservicios desacoplada bajo **Database-per-Service** (6 bases lógicas en PostgreSQL 16 + `pgvector`, Redis 7 y RabbitMQ 3.13).
- Explicar el patrón **API Gateway (`:8080`)** y la **Defensa en Profundidad (`AC-05`)**: el Gateway valida el token JWT mediante [`JwtAuthenticationGlobalFilter`](file:///c:/Users/abaon/tyronawilds/backend/api-gateway/src/main/java/co/edu/unimagdalena/tyronawilds/gateway/filter/JwtAuthenticationGlobalFilter.java) e inyecta las cabeceras confiables `X-User-Id`, `X-Rol`, `X-Prestador-Id` y `X-Correlation-Id`.
- Mostrar la **Ficha de Variabilidad `PROVEEDOR_AUTENTICACION`** en [`identidad-service`](file:///c:/Users/abaon/tyronawilds/backend/identidad-service/src/main/java/co/edu/unimagdalena/tyronawilds/identidad/application/service/IdentidadApplicationService.java) (`AUTH_PROVEEDORES=local,google`), implementada mediante el patrón **Strategy** (`ProveedorAutenticacionPort`).
- Explicar por qué `auditoria-service` (`:8087`) es una bitácora **Append-Only (solo `INSERT`)** alimentada asíncronamente desde la cola durable `auditoria.q` de RabbitMQ (`RNF-07`).

#### 2. ¿Qué debe demostrar en vivo en `http://localhost:3000`?
1. En la **Barra HUD Superior**, mostrar el indicador de latencia en milisegundos (`RNF-01 <= 3000ms`), el conmutador bilingüe **`ES / EN` (`RNF-12`)** y activar por unos segundos el botón **`CONTRASTE` (`WCAG AA ON` — `RNF-11`)**.
2. Abrir el **Selector de Sesión/Rol** en la esquina superior derecha y mostrar los 5 perfiles cargados (`Turista`, `Prestador #77 Dueño`, `Prestador #41 Intruso`, `Admin`, `Gestor Turístico`).
3. Bajar a la sección **03 // ARCHITECTURE LIVE LAB → PANEL 02 (SECUENCIA 4.1)**:
   - Hacer clic en el botón rojo **`ATACAR COMO PRESTADOR #41 (403)`**.
   - Señalar cómo el sistema devuelve inmediatamente **`HTTP 403 · ACCESO_DENEGADO`** con un `traceId` único y cómo en la **Bitácora Inmutable (`AUDITORIA-SERVICE :8087`)** aparece registrado el evento `[DENEGADA] MODIFICAR_OFERTA_AJENA`.

---

### BLOQUE 2: Melanye Mejía (Minutos 04:30 – 09:00)
**Rol en la Sustentación**: *Gestión de Oferta Turística (`oferta-service`), Verificación de Propiedad del Recurso (Secuencia 4.1) e Integración Resiliente con Circuit Breaker (`integracion-service`).*

#### 1. ¿Qué debe explicar conceptualmente?
- Explicar la **Arquitectura Hexagonal** dentro de [`oferta-service`](file:///c:/Users/abaon/tyronawilds/backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/application/service/OfertaApplicationService.java): cómo el caso de uso verifica no solo que el rol sea `PRESTADOR`, sino que el `prestadorId` autenticado coincida con el dueño legítimo de la actividad en PostgreSQL (`db_oferta`).
- Detallar qué ocurre cuando el **Prestador #41** intenta ejecutar `PUT /api/v1/prestadores/77/servicios/9` (Servicio #9: *Ciudad Perdida - Teyuna*, perteneciente al **Prestador #77**): se lanza [`AccesoDenegadoRecursoException`](file:///c:/Users/abaon/tyronawilds/backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/domain/exception/AccesoDenegadoRecursoException.java), se publica el evento `EventoAccesoDenegado` en RabbitMQ y el `@RestControllerAdvice` retorna `ApiErrorResponse` sin exponer stack traces (`ER-05`).
- Explicar la jerarquía polimórfica [`AdaptadorFuente`](file:///c:/Users/abaon/tyronawilds/backend/integracion-service/src/main/java/co/edu/unimagdalena/tyronawilds/integracion/domain/port/out/AdaptadorFuente.java) (`AdaptadorClima`, `AdaptadorAforo`, `AdaptadorEventos`) en `integracion-service` (`:8085`) y la protección con **Resilience4j `@CircuitBreaker`** (`ER-01`, timeout máximo de 2 segundos y fallback a caché **Redis**).

#### 2. ¿Qué debe demostrar en vivo en `http://localhost:3000`?
1. En el **PANEL 02 (SECUENCIA 4.1)**, hacer clic ahora en el botón verde **`EJECUTAR COMO DUEÑO #77 (200)`** para contrastar cómo el propietario legítimo sí obtiene **`HTTP 200 · OPERACION_AUTORIZADA`**.
2. Pasar al **PANEL 03 (CIRCUIT BREAKER & CONTINGENCIA REDIS — `ER-01`)**:
   - Mostrar que inicialmente el estado es **`CLOSED (LIVE_API)`** y en el Hero superior aparece `29.4°C · SOLEADO_BRISA_CARIBE | LIVE_API (CB: CLOSED)`.
   - Hacer clic en el botón ámbar **`SIMULAR CAÍDA API CLIMA -> FALLBACK REDIS (ER-01)`**.
   - Mostrar cómo el indicador cambia instantáneamente a **`OPEN (REDIS_CACHE_FALLBACK)`** en menos de 2 segundos sin romper la experiencia del turista.

---

### BLOQUE 3: Fabián Valderrama (Minutos 09:00 – 13:30)
**Rol en la Sustentación**: *Motor Transaccional de Reservas (`reservas-service`), Control de Concurrencia ACID (`RNF-13`), Prevención de Sobreventa (`ER-02`) y Pruebas Multihilo.*

#### 1. ¿Qué debe explicar conceptualmente?
- Explicar el diseño del modelo de datos en `db_reservas` ([`V1__init_reservas_schema.sql`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/resources/db/migration/V1__init_reservas_schema.sql)): separación entre `disponibilidad` (con restricción `CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= capacidad_total)` y columna `version`) y `reservas`.
- Explicar cómo [`ReservaApplicationService`](file:///c:/Users/abaon/tyronawilds/backend/reservas-service/src/main/java/co/edu/unimagdalena/tyronawilds/reservas/application/service/ReservaApplicationService.java) adquiere un **bloqueo pesimista de escritura (`LockModeType.PESSIMISTIC_WRITE` -> `SELECT ... FOR UPDATE`)** dentro de `@Transactional(isolation = Isolation.READ_COMMITTED)`.
- Explicar el manejo del escenario **`ER-02`**: si un turista solicita más cupos de los disponibles, se rechaza con **`HTTP 409 Conflict`** sugiriendo horarios alternativos para la misma expedición.

#### 2. ¿Qué debe demostrar en vivo en `http://localhost:3000`?
1. En la **Sección 01 // EXPEDICIONES**, hacer clic en **`RESERVAR CUPO`** sobre la tarjeta **01 // PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)**:
   - Hacer clic primero en **`PROBAR CONFLICTO 409 (ER-02)`** para demostrar cómo el sistema bloquea una solicitud que excede el cupo y sugiere el horario alternativo del día siguiente (`2026-11-16 06:00`).
   - Luego hacer clic en **`CONFIRMAR RESERVA ACID (HTTP 201)`** con 2 cupos para mostrar la confirmación transaccional con código `TW-XXXXXX` y la emisión del evento `ReservaConfirmadaEvent` a RabbitMQ.
2. Bajar al **PANEL 01 (CONCURRENCIA ACID & BLOQUEO PESIMISTA — `RNF-13`)**:
   - Hacer clic en **`LANZAR RÁFAGA: 30 HILOS vs 5 CUPOS`**.
   - Señalar las métricas devueltas en vivo:
     - **Hilos disparados**: `30`
     - **Cupos iniciales**: `5`
     - **Confirmadas (`HTTP 201`)**: `5`
     - **Rechazadas (`HTTP 409`)**: `25`
     - **Cupos finales restantes**: `0 (SOBREVENTA = 0 / FALSE)`.

---

### BLOQUE 4: Rigoberto Varilla (Minutos 13:30 – 18:00)
**Rol en la Sustentación**: *Motor de Recomendación IA Explicable (`recomendacion-service`), Máquina de Estados Comprensiva (`Punto 4.2`), Variabilidad `5.2` y Monitoreo de Capacidad Ecológica (`indicadores-service`).*

#### 1. ¿Qué debe explicar conceptualmente?
- Explicar la **Máquina de Estados Comprensiva del `OrquestadorRecomendacion` (Punto 4.2 del Laboratorio 3)** implementada en [`OrquestadorRecomendacionService`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/application/service/OrquestadorRecomendacionService.java): cómo transita por `Solicitada` → `CargandoPerfil` → `EnriqueciendoContexto` → (`ContextoDegradado` si hay fallo de clima `ER-01`) → (`Ranqueando` con similitud coseno `pgvector` o `ModoBasico` según la variabilidad `5.2`) → `GenerandoExplicacion` → `FINAL_EXITO`.
- Explicar el cumplimiento de **`RF-10` y `RF-12` (IA Ética y Explicable)**: cómo el motor penaliza automáticamente los destinos con ocupación crítica ($\ge 80\%$, como *Cabo San Juan* al 88%) y prioriza alternativas sostenibles de baja carga (*Minca / Cascadas de Marinka* al 28%), adjuntando una explicación en lenguaje natural generada por [`ExplicadorRecomendacion`](file:///c:/Users/abaon/tyronawilds/backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/application/service/ExplicadorRecomendacion.java).
- Explicar cómo `indicadores-service` (`:8086`) escucha los eventos de RabbitMQ (`indicadores.q`) y alimenta el tablero del **Gestor Turístico Distrital (`ST-05` / `CU-07`)**.

#### 2. ¿Qué debe demostrar en vivo en `http://localhost:3000`?
1. En la **Sección 02 // MOTOR IA (4.2)**:
   - Mostrar el **Diagrama en Vivo de la Máquina de Estados (Punto 4.2)** con los estados iluminados como `TRANSITADO` o `OMITIDO`.
   - Activar el botón **`SIMULAR CONTEXTO DEGRADADO (ER-01)`** para que el profesor observe cómo se ilumina el estado `[04A] ContextoDegradado` en color ámbar sin abortar la recomendación.
   - Conmutar entre **`IA: PERSONALIZADO (PGVECTOR)`** e **`IA: MODO BÁSICO (REGLAS 5.2)`** para demostrar en vivo la **Ficha de Variabilidad 5.2**, observando cómo el flujo conmuta entre `[05A] Ranqueando` y `[05B] ModoBasico` y cómo cambia el bloque verde de **Justificación Transparente (`RF-12`)** en las 3 tarjetas recomendadas.
2. Cerrar en la **Sección 04 // CAPACIDAD (CU-07 — `INDICADORES-SERVICE :8086`)**:
   - Mostrar las 4 tarjetas del **Monitoreo Distrital de Sostenibilidad**, destacando la alerta `CRITICA` en *Cabo San Juan (88%)* y su ruta sugerida de desconcentración hacia *Minca / Corregimiento de Bonda (28%)*.

---

## Respuestas Rápidas a Posibles Preguntas del Profesor Carlos Oliveros

| Posible Pregunta del Evaluador | Respuesta Técnica Precisa + Evidencia en el Proyecto |
| :--- | :--- |
| **1. ¿Cómo garantizan que ningún microservicio exponga entidades JPA ni stack traces al cliente?** | Todos los controladores en `infrastructure.adapter.in.web` usan exclusivamente `record` DTOs de Java 21, y cada microservicio incluye un `GlobalExceptionHandler` (`@RestControllerAdvice`) que transforma cualquier excepción en el contrato estandarizado `ApiErrorResponse` (`contratos-compartidos`) cumpliendo `ER-04` y `ER-05`. |
| **2. ¿Dónde se evidencia el cumplimiento del Principio de Inversión de Dependencias (DIP - SOLID)?** | Los servicios de aplicación (`application.service`) solo conocen interfaces de `domain.port.in` y `domain.port.out`. Jamás importan clases de Spring Data JPA, RabbitMQ ni Redis directamente; los adaptadores de infraestructura implementan esos puertos y se inyectan exclusivamente por constructor. |
| **3. ¿Qué pasa si RabbitMQ o el API de Clima tardan más de 2 segundos en responder durante una recomendación?** | En `recomendacion-service` (`RestClientConfig`) y en `integracion-service` (`@CircuitBreaker`), el timeout HTTP está fijado en `2000ms`. Si se supera, el `OrquestadorRecomendacion` transita al estado `ContextoDegradado` y sirve la recomendación usando la caché de contingencia de Redis (`ER-01`), manteniendo el tiempo total bajo los `3000ms` exigidos por `RNF-01`. |
| **4. ¿Por qué `auditoria-service` no tiene endpoints `PUT` ni `DELETE`?** | Por cumplimiento estricto de `RNF-07` y los puntos `2.1` y `2.4b` del Laboratorio 3: la tabla `registro_auditoria` en `db_auditoria` es una bitácora forense inmutable (*Append-Only*), donde únicamente se permite la operación `INSERT` tras consumir eventos de seguridad o negocio desde RabbitMQ. |
