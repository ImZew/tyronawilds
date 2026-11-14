# Matriz de Trazabilidad de Producción — Tyrona Wilds (`v2.2.2`)

Esta matriz vincula los requerimientos funcionales y no funcionales de ingeniería con los módulos del código fuente, las secciones del **Póster Científico A0 (`docs/poster/Poster_TyronaWilds_v2.2.2.pptx`)** y las versiones publicadas bajo nuestra estrategia **Gitflow**.

---

## 1. Trazabilidad de Requerimientos a Componentes y Póster

| ID Req. | Requerimiento de Ingeniería | Componente / Archivo en Repositorio | Sección del Póster A0 (`v2.2.2`) | Estado / Release |
| :--- | :--- | :--- | :--- | :---: |
| **RF-01** | **Cartografía Topográfica 3D & Perfil de Elevación (`0m – 5.775m`)**: Representar las 7 cotas altitudinales de la Sierra Nevada, cuencas fluviales (Don Diego y Buritaca), vista Satélite 2D y perfil longitudinal interactivo. | [`frontend/src/app/page.tsx`](../frontend/src/app/page.tsx) | **Sección 5 (Obj. 1)** y **Sección 7 (Captura 1)** | ✅ `v2.2.1` / `v2.2.2` |
| **RF-02** | **Banco Fotográfico Real Verificado del Magdalena**: Fotografías auténticas de Cabo San Juan, Teyuna, Minca, Sierra Nevada, Río Don Diego y Taganga obtenidas desde Wikimedia Commons. | [`frontend/public/images/destinos/`](../frontend/public/images/destinos/) | **Sección 1** y **Sección 7 (Captura 2)** | ✅ `v2.2.0` / `v2.2.2` |
| **RF-03** | **Motor de Reserva Transaccional ACID & Checkout en 3 Pasos**: Selección de fecha programada con control de cupos PNN, autocompletado de titular JWT, nómina de acompañantes y liquidación Wompi Sandbox con alto contraste accesible. | [`frontend/src/app/page.tsx`](../frontend/src/app/page.tsx)<br>[`frontend/src/app/expediciones/page.tsx`](../frontend/src/app/expediciones/page.tsx)<br>[`services/pulso-service/`](../services/pulso-service/) | **Sección 5 (Obj. 2)**, **Sección 6 (Persistencia ACID)** y **Sección 7 (Captura 3)** | ✅ `v2.2.2` |
| **RF-04** | **Emisión de Pasaporte Oficial de Expedición QR & Billetera de Viajero**: Generación de pasaporte digital con firma `SHA-256`, número de póliza PNN y consulta persistente en `/mis-reservas`. | [`frontend/src/components/PasaporteExpedicionQr.tsx`](../frontend/src/components/PasaporteExpedicionQr.tsx)<br>[`frontend/src/app/mis-reservas/page.tsx`](../frontend/src/app/mis-reservas/page.tsx) | **Sección 6 (Cliente Móvil QR)** y **Sección 7** | ✅ `v2.0.0` / `v2.2.2` |
| **RF-05** | **Concierge Inteligente Baquiano AI**: Asistente especializado en rutas, pisos térmicos, exigencia física y equipaje para expediciones en Santa Marta. | [`frontend/src/app/baquiano/page.tsx`](../frontend/src/app/baquiano/page.tsx)<br>[`services/baquiano-ai-service/`](../services/baquiano-ai-service/) | **Sección 5 (Obj. 3)**, **Sección 6 (Servicios)** y **Sección 7 (Captura 2)** | ✅ `v1.7.0` / `v2.2.2` |
| **RF-06** | **Estación de Telemetría Bioclimática (Pulso IDEAM / DIMAR)**: Monitoreo por destino de temperatura, humedad, oleaje y caudal de ríos. | [`frontend/src/app/pulso/page.tsx`](../frontend/src/app/pulso/page.tsx)<br>[`services/pulso-service/`](../services/pulso-service/) | **Sección 6 (Servicios Externos: API Clima IDEAM/DIMAR)** | ✅ `v1.7.0` / `v2.2.2` |
| **RF-07** | **Autenticación JWT y Validación de Operadores RNT**: Inicio de sesión por roles (`VIAJERO` / `GUIA_RNT`) y verificación de credenciales ante MinCIT. | [`frontend/src/app/login/page.tsx`](../frontend/src/app/login/page.tsx)<br>[`frontend/src/app/operadores/page.tsx`](../frontend/src/app/operadores/page.tsx)<br>[`services/identidad-service/`](../services/identidad-service/) | **Sección 6 (Servicios JWT & Persistencia ORM/RNT)** | ✅ `v2.0.0` / `v2.2.2` |
| **RNF-01** | **Accesibilidad Visual Dual (Modo Claro Editorial & Modo Oscuro Nocturno)**: Conmutador global `html.dark` con contraste WCAG AAA en tarjetas, formularios y modales de checkout. | [`frontend/src/context/ThemeContext.tsx`](../frontend/src/context/ThemeContext.tsx)<br>[`frontend/src/components/Navbar.tsx`](../frontend/src/components/Navbar.tsx) | **Sección 6 (Capa de Presentación)** y **Sección 7** | ✅ `v2.2.0` – `v2.2.2` |
| **RNF-02** | **Póster Científico A0 Automatizado con Diagrama de Arquitectura Visual**: Generación programática del archivo `.pptx` con las 9 secciones de la rúbrica, 10 íconos de arquitectura en la Sección 6 y 3 capturas + QR en la Sección 7. | [`scripts/generate_poster.py`](../scripts/generate_poster.py)<br>[`scripts/build_poster_v222.cjs`](../scripts/build_poster_v222.cjs)<br>[`docs/poster/Poster_TyronaWilds_v2.2.2.pptx`](./poster/Poster_TyronaWilds_v2.2.2.pptx) | **Secciones 1 a 9 completas** | ✅ `v2.2.2` |

---

## 2. Verificación de Calidad de Compilación (`v2.2.2`)

- **TypeScript & Next.js 14 Production Build (`npm run build`):** `0 errores` de tipos ni de empaquetado estático/dinámico en las 9 rutas de la aplicación (`/`, `/_not-found`, `/baquiano`, `/expediciones`, `/icon.svg`, `/lab`, `/login`, `/mis-reservas`, `/operadores`, `/pulso`).
- **Estrategia Gitflow:** Rama `release/v2.2.2-full-poster-and-docs` fusionada con `--no-ff` en `develop` y `main`, etiquetada con tag anotado `v2.2.2` y sincronizada con `origin`.
