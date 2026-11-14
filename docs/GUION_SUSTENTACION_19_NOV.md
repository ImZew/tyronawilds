# Guion Maestro de Sustentación — Tyrona Wilds (`v2.2.2`)

- **Evento:** Sustentación de Proyecto de Ingeniería de Sistemas — Universidad del Magdalena
- **Versión en Producción:** `v2.2.2` ([`https://tyronawilds.vercel.app/`](https://tyronawilds.vercel.app/))
- **Póster Oficial A0:** [`docs/poster/Poster_TyronaWilds_v2.2.2.pptx`](./poster/Poster_TyronaWilds_v2.2.2.pptx)

---

## 1. Apertura Ejecutiva (Minuto 0:00 – 1:30) — Secciones 1, 2 y 3 del Póster

> *"Buenos días al jurado evaluador. Presentamos **Tyrona Wilds (`v2.2.2`)**, un ecosistema web multipágina y de microservicios transaccionales diseñado para gestionar de forma sostenible y segura las expediciones ecoturísticas en Santa Marta, el Parque Nacional Natural Tayrona y la Sierra Nevada de Santa Marta, el sistema montañoso litoral más alto del planeta (`0 msnm` a `5.775 msnm`)."*

- **Problema que resolvemos (Sección 2):**
  1. **Riesgo de sobrecarga ecológica en áreas protegidas:** Las reservas informales por chat o planillas desconectadas generan sobreventa de los cupos diarios establecidos por Parques Nacionales Naturales (PNN).
  2. **Informalidad e inseguridad operativa:** Turistas ingresan a rutas de alta exigencia (como Teyuna o Cerro Kennedy) sin validación del Registro Nacional de Turismo (**RNT**), sin póliza de asistencia activa y sin conocer el estado hidrometeorológico real.
- **Justificación de Ingeniería (Sección 3):**
  - Unificamos en una sola plataforma **cartografía topográfica 3D interactiva**, **control transaccional ACID de cupos**, **asistencia inteligente Baquiano AI** y **verificación criptográfica mediante Pasaporte QR**.

---

## 2. Arquitectura Seleccionada (Minuto 1:30 – 3:30) — Sección 6 del Póster

Señalar el diagrama central de la **Sección 6 (`6. ARQUITECTURA SELECCIONADA`)** en [`Poster_TyronaWilds_v2.2.2.pptx`](./poster/Poster_TyronaWilds_v2.2.2.pptx):

1. **Columna Izquierda (`CLIENTE`):**
   - Acceso dual desde **Web App** (portal multipágina con Diorama Topográfico 3D) y **Móvil / Pasaporte QR** para validación rápida en puestos de control PNN.
2. **Columna Central (4 Niveles desacoplados):**
   - **Capa de Presentación (`Next.js 14`, `TypeScript`, `Tailwind CSS`):** Arquitectura multipágina (`/`, `/expediciones`, `/baquiano`, `/pulso`, `/login`, `/mis-reservas`, `/operadores`, `/lab`) con soporte nativo de **Modo Claro Editorial y Modo Oscuro (`html.dark`)**.
   - **Capa de Servicios (`Node.js / API Gateway` + `Microservicios & JWT`):** Orquestación hacia `identidad-service`, `baquiano-ai`, `pulso-service` y `auditoria-service` con autenticación JWT firmada.
   - **Capa de Persistencia (`ACID` + `ORM / RNT`):** Bloqueo pesimista (`SELECT ... FOR UPDATE`) para garantizar cero sobreventa ante ráfagas concurrentes y validación de vigencia de operadores RNT.
   - **Base de Datos (`PostgreSQL`):** Persistencia relacional de reservas, cupos por fecha, pólizas PNN y registro inmutable de auditoría.
3. **Columna Derecha (`SERVICIOS EXTERNOS`):**
   - Integración con **API Clima IDEAM / DIMAR** para telemetría bioclimática y **Wompi Sandbox & Notificaciones** para liquidación de pagos y emisión de pólizas.

---

## 3. Demostración en Vivo del Prototipo Funcional (Minuto 3:30 – 6:30) — Sección 7 del Póster

Invitar al jurado a escanear el **Código QR de la Sección 7** (`https://tyronawilds.vercel.app/`) y recorrer los 3 hitos visuales:

### Hito 1: Diorama Topográfico 3D de 7 Cotas, Vista Satélite 2D y Perfil Longitudinal (`/`)
- Mostrar el **Diorama Topográfico 3D** con las **7 capas hipsométricas (`translateZ(8px)` a `translateZ(92px)`)**, la batimetría del Mar Caribe y los caudales animados de los ríos Don Diego y Buritaca.
- Alternar en vivo entre **Vista Relieve 3D** y **Vista Satelital 2D** y seleccionar nodos en el **Perfil Longitudinal (`0m → 5.775m`)**.
- Mostrar el cambio instantáneo entre **Modo Claro Editorial** y **Modo Oscuro Nocturno** desde el `Navbar`.

### Hito 2: Concierge Baquiano AI (`/baquiano`) y Pulso Ambiental (`/pulso`)
- Consultar al **Baquiano AI** una recomendación para *Ciudad Perdida (Teyuna)* o *Cabo San Juan* y revisar la telemetría de oleaje, humedad y cupos en `/pulso`.

### Hito 3: Reserva ACID en 3 Pasos, Wompi Sandbox y Pasaporte Oficial QR (`/expediciones` y `/mis-reservas`)
- Iniciar sesión con 1 clic en `/login` (`Viajero Demo — Sebastián Abaonza`).
- Abrir el modal de reserva en `/expediciones` o `/`:
  - **Paso 1 (`SELECCIÓN DE SALIDA & TITULAR DE PÓLIZA PNN`):** Destacar la legibilidad de alto contraste (`v2.2.2`) en la tarjeta de fecha activa, los datos verificados por JWT y la nómina de acompañantes.
  - **Paso 2 (`WOMPI SANDBOX PAY`):** Confirmar el pago seguro y el desglose de tarifa + seguro ecológico PNN.
  - **Paso 3 (`PASAPORTE OFICIAL QR`):** Mostrar el código QR generado con hash criptográfico `SHA-256` y verificar su persistencia en `/mis-reservas`.

---

## 4. Conclusiones y Cierre (Minuto 6:30 – 7:30) — Sección 8 del Póster

- **Cero sobreventa ecológica:** El bloqueo transaccional ACID impide el 100% de colisiones de cupo en pruebas de estrés concurrentes (`/lab`).
- **Trazabilidad de extremo a extremo:** Cada reserva vincula criptográficamente al viajero, el guía con RNT activo, la transacción Wompi y la póliza PNN dentro del Pasaporte QR.
- **Ingeniería de Software Disciplinada:** Ciclo completo **Gitflow** con entregas incrementales desde `v1.1.0` hasta `v2.2.2` desplegadas continuamente en producción.
