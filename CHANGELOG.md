# Changelog — Tyrona Wilds

Todos los cambios notables de este proyecto se documentan en este archivo siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning (SemVer)](https://semver.org/lang/es/) bajo nuestra estrategia **Gitflow** (`feature/*`, `fix/*`, `release/*` → `develop` → `main`).

---

## [v2.2.2] — 2026-11-14 (`release/v2.2.2-full-poster-and-docs`)

### Corregido (Fixed)
- **Contraste y Legibilidad en el Módulo de Reserva / Checkout ACID (`page.tsx`, `expediciones/page.tsx`, `PasaporteExpedicionQr.tsx`)**:
  - En el **Paso 1 (`SELECCIÓN DE SALIDA & TITULAR DE PÓLIZA PNN`)**, se corrigió la tarjeta de fecha activa para emplear texto oscuro de alto contraste (`text-slate-900 dark:text-white` en fecha, hora y tarifa `$ 290.000`, y `text-orange-950 dark:text-orange-200` en `CUPOS RESTANTES`) sobre fondo cálido (`bg-orange-50`), eliminando el texto blanco ilegible sobre fondos claros.
  - En las tarjetas de fecha no seleccionadas, se estandarizó `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700`.
  - En el banner JWT superior y campos del titular verificado (`Sebastián Abaonza`, `CC 1083019450`, `sebastian@viajero.co`), se aplicó `bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200`.
  - En la **Nómina de Acompañantes**, se estilizaron los inputs (`Camila Restrepo`, documento) con `bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 rounded-xl`.
  - En el **Paso 2 (`WOMPI SANDBOX PAY`)** y **Paso 3 (`PASAPORTE OFICIAL QR`)**, se reemplazó cualquier texto blanco sobre tarjetas claras por `text-slate-900 dark:text-white`.

### Añadido (Added)
- **Póster Científico Oficial en PowerPoint Formato A0 (`docs/poster/Poster_TyronaWilds_v2.2.2.pptx`)**:
  - Creación de `scripts/generate_poster.py` (`python-pptx` + `Pillow`) y `scripts/build_poster_v222.cjs` para generar el póster académico de 9 secciones (`33.1 x 46.8 pulgadas`).
  - **Sección 6 (`6. ARQUITECTURA SELECCIONADA`)**: Inclusión de íconos y escudos gráficos embebidos en alta resolución siguiendo el estándar visual de referencia (`CLIENTE`: Monitor Web App y Smartphone Pasaporte QR; `CAPA DE PRESENTACIÓN`: escudos de Next.js 14, TypeScript y Tailwind CSS; `CAPA DE SERVICIOS`: hexágono Node.js / API Gateway y Microservicios & JWT; `CAPA DE PERSISTENCIA`: insignias ACID y ORM / RNT; `BASE DE DATOS PostgreSQL`: cilindro 3D azul; `SERVICIOS EXTERNOS`: Nube API Clima IDEAM / DIMAR y Pasarela Wompi Sandbox & Notificaciones).
  - **Sección 7 (`7. PROTOTIPO FUNCIONAL`)**: Inclusión de las 3 capturas actualizadas (`captura_1_diorama_3d.png`, `captura_2_baquiano_ai.png`, `captura_3_checkout_acid.png`) y el código QR funcional hacia `https://tyronawilds.vercel.app/`.
- **Documentación Integral del Repositorio**:
  - Creación de `docs/poster/POSTER_SPECIFICATION.md` y `CHANGELOG.md`.
  - Actualización completa de `README.md`, `docs/GUION_SUSTENTACION_19_NOV.md` y `docs/MATRIZ_TRAZABILIDAD_PRODUCCION.md`.

---

## [v2.2.1] — 2026-11-13 (`fix/diorama-3d-and-ui-polish-v2.2.1`)

### Añadido y Mejorado
- **Diorama Topográfico 3D Multicapa de 7 Cotas Reales (`frontend/src/app/page.tsx`)**:
  - Construcción de bloque 3D con grosor de corteza terrestre, batimetría del Mar Caribe y 7 curvas de nivel orgánicas en el eje Z (`translateZ(8px)` a `translateZ(92px)`).
  - Cuencas fluviales animadas para el Río Don Diego y el Río Buritaca.
  - Selector interactivo **Vista Relieve 3D / Vista Satelital 2D** y **Perfil Longitudinal de Elevación (`0m → 5.775m`)**.
- **Pulido UI y Modo Oscuro**:
  - Contraste mejorado en el buscador y filtros de `/expediciones`, formulario de `/login` y soporte completo de Modo Oscuro (`html.dark`) en todas las vistas.

---

## [v2.2.0] — 2026-11-13 (`feat/3d-map-real-photos-darkmode-v2.2`)

### Añadido
- Descarga automatizada desde la API de Wikimedia Commons de fotografías 100% reales de Santa Marta (`tayrona.jpg`, `teyuna.jpg`, `minca.jpg`, `sierra.jpg`, `dondiego.jpg`, `taganga.jpg`).
- Implementación de `ThemeContext` y botón `ThemeToggle` en el `Navbar` para alternar entre Modo Claro Editorial y Modo Oscuro Nocturno con persistencia en `localStorage`.

---

## [v2.1.0] — 2026-11-13 (`feature/colombia-travel-editorial-v2.1`)

### Añadido
- Rediseño visual inspirado en `colombia.travel/es` con fotografía a pantalla completa y paleta luminosa tropical.
- Solución definitiva del favicon en Next.js App Router mediante `frontend/src/app/icon.svg`.

---

## [v2.0.0] — 2026-11-13 (`feature/organic-portal-v2`)

### Añadido
- Consolidación de navegación multipágina con estado de autenticación global (`AuthContext`), ruta `/mis-reservas` y experiencias guiadas.

---

## [v1.7.0] — 2026-11-13 (`feature/cinematic-hero-multipage`)

### Añadido
- Hero cinematográfico de Santa Marta, componente `Navbar.tsx` unificado y separación en rutas independientes (`/expediciones`, `/baquiano`, `/pulso`).

---

## [v1.1.0 – v1.6.1] — 2026-11-10 a 2026-11-12

### Añadido
- Arquitectura base de microservicios (`api-gateway`, `identidad-service`, `baquiano-ai-service`, `pulso-service`, `auditoria-service`), motor transaccional ACID de reservas, integración Wompi Sandbox, generador de Pasaporte Oficial QR y despliegue en Vercel.
