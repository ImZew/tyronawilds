# Especificación Técnica del Póster Científico A0 — Tyrona Wilds (`v2.2.2`)

- **Archivo PowerPoint Oficial:** [`docs/poster/Poster_TyronaWilds_v2.2.2.pptx`](./Poster_TyronaWilds_v2.2.2.pptx)
- **Scripts Generadores:** [`scripts/generate_poster.py`](../../scripts/generate_poster.py) y [`scripts/build_poster_v222.cjs`](../../scripts/build_poster_v222.cjs)
- **Directorio de Activos Gráficos (PNG):** [`docs/poster/assets/`](./assets/)
- **Dimensiones Físicas:** Formato **ISO A0 Vertical** (`33.1 × 46.8 pulgadas` / `841 × 1189 mm`)
- **Programa Académico:** Ingeniería de Sistemas — Universidad del Magdalena (Santa Marta, D.T.C.H.)
- **Autores:** Sebastián Abaonza, Elkin Samir Giraldo & José Daniel Manjarrez

---

## 1. Estructura de las 9 Secciones de la Rúbrica

El póster cumple estrictamente con los 9 bloques exigidos por la rúbrica de sustentación de Ingeniería de Sistemas:

| # | Sección en el Póster | Ubicación en Grilla A0 | Contenido Principal |
| :-: | :--- | :--- | :--- |
| **1** | **1. INTRODUCCIÓN** | Fila 1, Columna Izquierda | Contexto megadiverso de Santa Marta (`0m` a `5.775 msnm`), desarticulación digital y propósito de Tyrona Wilds. |
| **2** | **2. DESCRIPCIÓN DEL PROBLEMA** | Fila 1, Columna Derecha | Sobrecarga de cupos PNN por reservas manuales, informalidad de operadores sin RNT y asimetría de información bioclimática. |
| **3** | **3. JUSTIFICACIÓN** | Fila 2, Columna Izquierda | Impacto ambiental (protección de capacidad de carga PNN), seguridad humana (alertas IDEAM/DIMAR + pólizas) y formalización RNT. |
| **4** | **4. OBJETIVO GENERAL** | Fila 2, Columna Derecha (Sup.) | Desarrollo del ecosistema web multipágina y microservicios ACID con Diorama 3D, Baquiano AI y Pasaporte QR. |
| **5** | **5. OBJETIVOS ESPECÍFICOS** | Fila 2, Columna Derecha (Inf.) | (1) Diorama Topográfico 3D de 7 cotas, (2) Motor transaccional ACID + Wompi Sandbox + QR, (3) Concierge Baquiano AI + Pulso IDEAM/DIMAR. |
| **6** | **6. ARQUITECTURA SELECCIONADA** | Fila 3, Ancho Completo | Diagrama visual en 3 columnas (`CLIENTE` ↔ `4 CAPAS CENTRALES` ↔ `SERVICIOS EXTERNOS`) con **10 íconos y escudos gráficos embebidos**. |
| **7** | **7. PROTOTIPO FUNCIONAL** | Fila 4, Ancho Completo | **3 capturas reales actualizadas (`v2.2.2`)** + tarjeta de acceso en vivo con **Código QR** hacia `https://tyronawilds.vercel.app/`. |
| **8** | **8. CONCLUSIONES** | Fila 5, Columna Izquierda | Mitigación del `100%` de sobreventa en pruebas concurrentes, reducción en `68%` del tiempo de planificación y trazabilidad QR. |
| **9** | **9. REFERENCIAS** | Fila 5, Columna Derecha | Marco normativo MinCIT/PNN, literatura de arquitectura de microservicios (Newman, Kleppmann) y datos abiertos IDEAM/DIMAR. |

---

## 2. Detalle Visual de la Sección 6 (`6. ARQUITECTURA SELECCIONADA`)

Siguiendo el estándar visual de diagramación arquitectónica con íconos y logotipos tecnológicos embebidos:

1. **Columna Izquierda (`CLIENTE`):**
   - [`assets/icon_monitor_webapp.png`](./assets/icon_monitor_webapp.png): Ícono de monitor de escritorio (`Web App — Portal Multipágina`).
   - [`assets/icon_smartphone_qr.png`](./assets/icon_smartphone_qr.png): Ícono de teléfono inteligente (`Móvil / Pasaporte QR`).
   - Conectados hacia el bloque central mediante flechas bidireccionales `↔`.
2. **Columna Central (4 Niveles Conectados Verticalmente con Flechas `↓`):**
   - **Nivel 1 — `CAPA DE PRESENTACIÓN (Frontend)`:**
     - [`assets/logo_nextjs.png`](./assets/logo_nextjs.png) (`Next.js 14`)
     - [`assets/logo_typescript.png`](./assets/logo_typescript.png) (`TypeScript`)
     - [`assets/logo_tailwind.png`](./assets/logo_tailwind.png) (`Tailwind CSS`)
   - **Nivel 2 — `CAPA DE SERVICIOS (Lógica de Negocio)`:**
     - [`assets/logo_nodejs_gateway.png`](./assets/logo_nodejs_gateway.png) (`Node.js / API Gateway`)
     - [`assets/logo_microservices_jwt.png`](./assets/logo_microservices_jwt.png) (`Microservicios & JWT`: `identidad-service`, `baquiano-ai`, `pulso-service`, `auditoria-service`)
   - **Nivel 3 — `CAPA DE PERSISTENCIA (Acceso a Datos)`:**
     - [`assets/logo_acid.png`](./assets/logo_acid.png) (`ACID — Bloqueo de Cupos PNN`)
     - [`assets/logo_orm_rnt.png`](./assets/logo_orm_rnt.png) (`ORM / RNT — Integridad Documental`)
   - **Nivel 4 — `BASE DE DATOS PostgreSQL`:**
     - [`assets/icon_postgresql_3d.png`](./assets/icon_postgresql_3d.png) (`Cilindro 3D Azul — BASE DE DATOS PostgreSQL`)
3. **Columna Derecha (`SERVICIOS EXTERNOS`):**
   - [`assets/icon_cloud_ideam.png`](./assets/icon_cloud_ideam.png): Ícono de nube azul (`API Clima IDEAM / DIMAR`).
   - [`assets/icon_wompi_mail.png`](./assets/icon_wompi_mail.png): Ícono de sobre/pasarela (`Wompi Sandbox & Notificaciones`).
   - Conectados con la Capa de Servicios mediante flechas bidireccionales `↔`.
4. **Barra Inferior de Síntesis (`Tecnologías` y `Arquitectura`):**
   - Recuadro verde institucional que resume el stack completo (`Next.js 14, TypeScript, Tailwind CSS, Node.js, PostgreSQL, JWT, Wompi, IDEAM`) y el patrón arquitectónico (`3 Capas con Microservicios y Transacciones ACID`).

---

## 3. Detalle Visual de la Sección 7 (`7. PROTOTIPO FUNCIONAL`)

1. **[`assets/captura_1_diorama_3d.png`](./assets/captura_1_diorama_3d.png)** — *1. Diorama 3D de 7 cotas y Perfil Longitudinal (`0m → 5.775m`)*.
2. **[`assets/captura_2_baquiano_ai.png`](./assets/captura_2_baquiano_ai.png)** — *2. Concierge Baquiano AI con fotos reales de Santa Marta*.
3. **[`assets/captura_3_checkout_acid.png`](./assets/captura_3_checkout_acid.png)** — *3. Reserva ACID y Checkout corregido (`v2.2.2`)*.
4. **[`assets/qr_tyronawilds_vercel.png`](./assets/qr_tyronawilds_vercel.png)** — *Código QR de acceso instantáneo a `https://tyronawilds.vercel.app/`*.
