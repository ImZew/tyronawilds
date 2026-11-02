# Guion Oficial de Sustentación en Vivo (v1.6.0) — TyronaWilds (`PlataformaTurismoSM`)

- **Asignatura**: Arquitectura de Software — Ingeniería de Sistemas, Universidad del Magdalena
- **Docente Evaluador**: Ing. Carlos Oliveros
- **Fecha de Sustentación**: 19 de Noviembre
- **URL en Producción (Vercel)**: [https://tyronawilds.vercel.app](https://tyronawilds.vercel.app)
- **URL Local (Conectada a Docker + 8 Microservicios)**: `http://localhost:3000` + Gateway `http://localhost:8080`
- **Repositorio GitHub (Gitflow `main` / `develop` / `v1.6.0`)**: [https://github.com/ImZew/tyronawilds](https://github.com/ImZew/tyronawilds)

---

## Preparación Previa (5 minutos antes de iniciar la sustentación)

1. **Entorno Local + Docker** (o abrir directamente `https://tyronawilds.vercel.app` como respaldo instantáneo):
   ```powershell
   docker ps
   .\start-tyronawilds.ps1
   ```
2. Abrir en el navegador 3 pestañas listas:
   - **Pestaña 1**: Storefront Comercial (`/` → `http://localhost:3000` o `https://tyronawilds.vercel.app`).
   - **Pestaña 2**: Laboratorio de Telemetría y Concurrencia (`/lab`).
   - **Pestaña 3**: Grafo de Red y Ramas Gitflow en GitHub (`Insights -> Network` / selector de ramas `main`, `develop`, `feature/*`, `fix/*`, `release/v1.6.0` y tags `v1.1.0`..`v1.6.0`).

---

## Orden de Intervención de los 4 Integrantes (Tiempo Total: 16–20 Minutos)

---

### BLOQUE 1: Sebastián Abaonza (Minutos 00:00 – 04:30)
**Rol en la Sustentación**: *Arquitectura Global, Estrategia Gitflow, Borde de Seguridad (`api-gateway`), Autenticación Real JWT (`identidad-service`), Privacidad RLS por Turista y Bitácora Inmutable (`auditoria-service`).*

#### 1. Sustento Arquitectónico (1.5 min)
- Presentar **TyronaWilds (`PlataformaTurismoSM`)** y su arquitectura de microservicios bajo **Database-per-Service** (6 bases lógicas en PostgreSQL 16 + `pgvector`, Redis 7 y RabbitMQ 3.13) y **Arquitectura Hexagonal + SOLID**.
- Mostrar brevemente en GitHub el flujo **Gitflow** (`main`, `develop`, `feature/*`, `fix/*`, `release/v1.6.0` y tags `v1.1.0` a `v1.6.0`).
- Explicar el patrón **API Gateway (`:8080`)** y la **Defensa en Profundidad (`AC-05`)**: validación de firma JWT HMAC-SHA256 en [`JwtAuthenticationGlobalFilter`](../backend/api-gateway/src/main/java/co/edu/unimagdalena/tyronawilds/gateway/filter/JwtAuthenticationGlobalFilter.java), CORS estricto, cabeceras CSP (`next.config.mjs`) y políticas **Row-Level Security (RLS)** en PostgreSQL ([`V3__enable_rls_policies.sql`](../backend/identidad-service/src/main/resources/db/migration/V3__enable_rls_policies.sql)).
- Explicar la **Ficha de Variabilidad `PROVEEDOR_AUTENTICACION`** (`AUTH_PROVEEDORES=local,google`) mediante el patrón **Strategy** (`ProveedorAutenticacionPort`) en `identidad-service`.

#### 2. Demostración en Vivo (3 min)
1. **Navbar Condicional sin Sesión (`/`)**:
   - Mostrar que cuando un visitante entra sin sesión a `/`, la barra superior **oculta** `MIS RESERVAS` y `PORTAL OPERADORES`, mostrando solo las anclas públicas y el botón **`INICIAR SESIÓN`**.
   - Abrir cualquier expedición en `/` y señalar que el bloque de Checkout exige autenticación previa: *"INICIA SESIÓN COMO VIAJERO PARA RESERVAR Y EMITIR TU PASAPORTE QR"*.
2. **Inicio de Sesión como Turista 1 (Cuenta Limpia) en `/login`**:
   - Ir a `/login`, desplegar el acordeón de **5 Cuentas de Evaluación Académica** y hacer clic en **`Turista 1 — Sebastián Abaonza (Cuenta Limpia)`** (`sebastian@viajero.co`).
   - Iniciar sesión: mostrar cómo la Navbar ahora despliega **`MIS RESERVAS (0)`** y el nombre `Sebastián Abaonza`, ocultando por completo `PORTAL OPERADORES`.
   - Entrar a **`/mis-reservas`** y demostrar que su billetera inicia completamente vacía (*"SIN PASAPORTES EMITIDOS // AÚN NO HAS RESERVADO NINGUNA EXPEDICIÓN EN TU CUENTA"*).
3. **Demostración de Aislamiento RLS cambiando a Turista 2 (`Valeria Mejía`)**:
   - Cerrar sesión (`SALIR`), volver a `/login` y elegir en 1 clic **`Turista 2 — Valeria Mejía (Con Reserva Activa)`** (`valeria@viajera.co`).
   - Entrar a `/mis-reservas` y mostrar que Valeria visualiza **únicamente** su pasaporte preexistente **`TW-2026-901A`** (*Ciudad Perdida - Teyuna*), demostrando que cada turista tiene su billetera aislada.

---

### BLOQUE 2: Fabián Valderrama (Minutos 04:30 – 09:00)
**Rol en la Sustentación**: *Motor Transaccional de Reservas (`reservas-service`), Pasarela Wompi Sandbox en 1 Clic, Reverso Automático ante Colisión ACID (`HTTP 409 Conflict` — `RNF-13` / `ER-02`) y Pruebas Multihilo.*

#### 1. Sustento Arquitectónico (1.5 min)
- Explicar el control de concurrencia en [`ReservaApplicationService`](../backend/reservas-service/src/main/java/co/edu/unimagdalena/tyronawilds/reservas/application/service/ReservaApplicationService.java): uso de `@Transactional(isolation = Isolation.READ_COMMITTED)` junto con **bloqueo pesimista (`LockModeType.PESSIMISTIC_WRITE` → `SELECT ... FOR UPDATE`)** en `SpringDataDisponibilidadRepository` y la restricción relacional `CHECK (cupos_disponibles >= 0)`.
- Explicar la atomicidad del flujo de pago **Wompi Sandbox**: si dos viajeros compiten por el último cupo al mismo milisegundo, la transacción perdedora recibe **`HTTP 409 Conflict`**, revierte el descuento de inventario y ejecuta el **reverso automático de la preautorización Wompi (`$0 COP` debitados)** sugiriendo rutas alternativas de baja carga.

#### 2. Demostración en Vivo (3 min)
1. **Regresar a `Turista 1 (Sebastián Abaonza)` y abrir una Expedición en `/`**:
   - Iniciar sesión como `Sebastián Abaonza` (cuya billetera tenía `0` reservas) y abrir el Drawer de **01 // PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)**.
   - Mostrar que el **Paso 1** ya precargó automáticamente su nombre (`Sebastián Abaonza`), correo (`sebastian@viajero.co`) y documento (`CC 1083019450`) desde la sesión JWT.
2. **Escenario de Colisión ACID (`409 Conflict`) con Reverso Wompi**:
   - Avanzar al **Paso 2 (`WOMPI SANDBOX PAY`)**, elegir **NEQUI** o **PSE** con el botón **`Autocompletar datos de prueba`**, seleccionar en el selector de demostración **`ESCENARIO 2: SIMULAR COLISIÓN DE ÚLTIMO CUPO (409 CONFLICT + REVERSO WOMPI)`** y pulsar pagar.
   - Señalar la alerta **`HTTP 409 CONFLICT — COLISIÓN DE ÚLTIMO CUPO DETECTADA`**, el comprobante de **reverso automático en Wompi (`$0 COP` debitados)** y las tarjetas de desconcentración ecológica.
3. **Compra Exitosa (`201 Created`) y Emisión de Pasaporte QR en `/mis-reservas`**:
   - Cambiar el selector a **`ESCENARIO 1: PAGO APROBADO + RESERVA ACID (201 CREATED)`** y confirmar el pago.
   - Mostrar en el **Paso 3** el **Pasaporte Oficial de Expedición con Código QR SVG**, firma criptográfica `SHA-256` y desglose de tasa ambiental PNN (12%).
   - Ir a **`/mis-reservas`** y verificar que el contador subió a **`MIS RESERVAS (1)`** y que esa nueva reserva pertenece exclusivamente a `Sebastián Abaonza`.
4. **Ráfaga Multihilo en `/lab`**:
   - En la pestaña `/lab` (**Panel 01**), disparar **`LANZAR RÁFAGA: 30 HILOS vs 5 CUPOS`** y mostrar `Confirmadas (201): 5`, `Rechazadas (409): 25`, `Cupos Restantes: 0 (SOBREVENTA = FALSE)`.

---

### BLOQUE 3: Melanye Mejía (Minutos 09:00 – 13:30)
**Rol en la Sustentación**: *Portal B2B de Operadores (`/operadores`), Gestión de Oferta (`oferta-service`), Secuencia 4.1 (`403 Forbidden` vs `200 OK` + Auditoría RabbitMQ) y Resiliencia con Circuit Breaker (`integracion-service` — `ER-01`).*

#### 1. Sustento Arquitectónico (1.5 min)
- Explicar la **Secuencia 4.1 del Laboratorio 3** en [`OfertaApplicationService`](../backend/oferta-service/src/main/java/co/edu/unimagdalena/tyronawilds/oferta/application/service/OfertaApplicationService.java): validación estricta de que el `X-Prestador-Id` autenticado coincida con el propietario legítimo del servicio turístico. Si no coincide, lanza `AccesoDenegadoRecursoException`, publica `EventoAccesoDenegado` en RabbitMQ (`auditoria.acceso.denegado` → `auditoria.q`) y retorna `HTTP 403 Forbidden` (`ApiErrorResponse` sin exponer stack traces, cumpliendo `ER-04` y `ER-05`).
- Explicar la jerarquía polimórfica [`AdaptadorFuente`](../backend/integracion-service/src/main/java/co/edu/unimagdalena/tyronawilds/integracion/domain/port/out/AdaptadorFuente.java) (`AdaptadorClima`, `AdaptadorAforo`, `AdaptadorEventos`) protegida con **Resilience4j `@CircuitBreaker`** (`timeout <= 2s` y contingencia en **Redis** para `ER-01`).

#### 2. Demostración en Vivo (3 min)
1. **Ingreso al Portal B2B `/operadores` como `Operador Externo #41 (Intruso)`**:
   - Ir a `/login`, elegir en 1 clic **`Operador Externo #41 (Intruso — Prueba 403)`** (`intruso41@tyronawilds.co`) y entrar a **`/operadores`** (notar que en la Navbar aparece el botón destacado **`PORTAL OPERADORES`**).
   - En la pestaña **Mis Expediciones & Precios**, intentar modificar el precio de la expedición **`#9 — PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)`** (cuyo titular es el Operador `#77`).
   - Mostrar el bloqueo en vivo **`HTTP 403 FORBIDDEN · ACCESO_DENEGADO`** con su `traceId` y abrir la pestaña **Bitácora de Auditoría (`:8087`)** en `/operadores` para evidenciar el registro forense inmutable `[DENEGADA] PUT /api/v1/prestadores/77/servicios/9`.
2. **Contraste como `Operador Titular #77 (Dueño)`**:
   - Usar el conmutador rápido superior en `/operadores` para cambiar a **`Operador Titular #77`** (`operador77@tyronawilds.co`).
   - Actualizar el precio de la expedición `#9` y mostrar la respuesta **`HTTP 200 OK · TARIFA SINCRONIZADA`**, además del **Manifiesto Global de Reservas** donde el operador sí visualiza las reservas de todos los viajeros.
3. **Circuit Breaker y Contingencia Redis (`ER-01`) en `/lab`**:
   - En `/lab` (**Panel 03**), hacer clic en **`SIMULAR CAÍDA API CLIMA -> FALLBACK REDIS (ER-01)`** y mostrar la transición inmediata de `CLOSED (LIVE_API)` a `OPEN (REDIS_CACHE_FALLBACK)` en menos de 2 segundos.

---

### BLOQUE 4: Rigoberto Varilla (Minutos 13:30 – 18:00)
**Rol en la Sustentación**: *Concierge de IA Explicable (`recomendacion-service`), Máquina de 7 Estados (`Punto 4.2`), Ficha de Variabilidad `5.2` (`pgvector` vs Reglas) y Gobernanza Ambiental (`indicadores-service` — `RF-10` / `CU-07`).*

#### 1. Sustento Arquitectónico (1.5 min)
- Explicar la **Máquina de Estados Comprensiva (Punto 4.2 del Laboratorio 3)** en [`OrquestadorRecomendacionService`](../backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/application/service/OrquestadorRecomendacionService.java): transición determinista por `Solicitada` → `CargandoPerfil` → `EnriqueciendoContexto` → (`ContextoDegradado` ante `ER-01`) → (`Ranqueando` con similitud coseno `pgvector` o `ModoBasico` según la variabilidad `5.2`) → `GenerandoExplicacion` → `FINAL_EXITO`.
- Explicar cómo el motor cumple **`RF-10` y `RF-12` (IA Ética y Explicable)**: penaliza destinos saturados ($\ge 80\%$, como *Cabo San Juan* al 88%) y prioriza ecosistemas de baja carga (*Minca / Cascadas de Marinka* al 28%), adjuntando una justificación transparente generada por [`ExplicadorRecomendacion`](../backend/recomendacion-service/src/main/java/co/edu/unimagdalena/tyronawilds/recomendacion/application/service/ExplicadorRecomendacion.java).

#### 2. Demostración en Vivo (3 min)
1. **Concierge Comercial Baquiano AI en `/`**:
   - En la sección **02 // BAQUIANO AI — CONCIERGE DE EXPEDICIONES** de `/`, seleccionar el perfil de viajero (*Biodiversidad & Calma* o *Conexión Ancestral*), ejecutar la curaduría y desplegar el panel **"¿Por qué nuestro Baquiano sugiere estas rutas hoy?"** para mostrar la explicación contextual en lenguaje natural (`RF-12`).
2. **Máquina de 7 Estados y Variabilidad `5.2` en `/lab`**:
   - En `/lab`, mostrar el diagrama interactivo de los 7 estados del `OrquestadorRecomendacion`.
   - Alternar en vivo entre **`IA: PERSONALIZADO (PGVECTOR)`** e **`IA: MODO BÁSICO (REGLAS 5.2)`** y activar **`SIMULAR CONTEXTO DEGRADADO (ER-01)`**, mostrando cómo se iluminan los estados `[04A] ContextoDegradado`, `[05A] Ranqueando` y `[05B] ModoBasico`.
3. **Pulso del Territorio y Gobernanza PNN (`RF-10` / `CU-07`)**:
   - Mostrar la sección **03 // PULSO DEL TERRITORIO** en `/` (y la vista de **Gobernanza Ambiental PNN** en `/operadores`), destacando el semáforo de capacidad ecológica en *Cabo San Juan (88% — CRÍTICA)* y el desvío sugerido hacia *Minca (28% — ÓPTIMA)*.

---

## Respuestas Rápidas a Preguntas de Evaluación

| Pregunta Frecuente del Evaluador | Respuesta Técnica + Evidencia en Código |
| :--- | :--- |
| **1. ¿Cómo garantizan que ningún turista vea las reservas de otro viajero?** | Mediante doble barrera: en el backend, las migraciones `V3__enable_rls_policies.sql` en `db_reservas` y `db_identidad` activan `ROW LEVEL SECURITY` filtrando por `app.current_user_id`; y en el cliente/gateway, `consultarMisReservas()` exige sesión JWT activa y filtra estrictamente por `usuarioId === sesion.userId` y `emailViajero === sesion.email`. |
| **2. ¿Qué ocurre con el dinero del viajero en Wompi si falla la reserva por colisión `409 Conflict`?** | El proceso es atómico: si `reservas-service` detecta `CupoAgotadoException` bajo bloqueo pesimista `SELECT ... FOR UPDATE`, hace rollback de la transacción en PostgreSQL y dispara la anulación/reverso inmediato de la referencia `WMP-REV-*` en el sandbox de pago (`$0 COP` debitados). |
| **3. ¿Cómo aplicaron Gitflow en el ciclo de ingeniería del proyecto?** | El repositorio mantiene ramas permanentes `main` (producción con tags SemVer `v1.1.0` a `v1.6.0`) y `develop` (integración), junto con ramas de funcionalidad (`feature/b2b-portal-operadores`, `feature/jwt-auth-gate`, `feature/wompi-sandbox-gateway`, `feature/docs-architecture-gitflow`), corrección (`fix/tourist-rls-isolation`) y lanzamiento (`release/v1.6.0`) integradas con `git merge --no-ff`. |
| **4. ¿Por qué `auditoria-service` no expone endpoints `PUT` ni `DELETE`?** | Por cumplimiento de `RNF-07` y `ER-04`: la tabla `registro_auditoria` en `db_auditoria` es una bitácora forense inmutable (*Append-Only*), alimentada asíncronamente desde la cola durable `auditoria.q` de RabbitMQ. |
