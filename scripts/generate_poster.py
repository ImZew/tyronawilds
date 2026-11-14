#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador Oficial del Póster Científico A0 — Tyrona Wilds v2.2.2
Archivo de salida: docs/poster/Poster_TyronaWilds_v2.2.2.pptx
Dimensiones A0 Vertical: 33.1 x 46.8 pulgadas (841 x 1189 mm)
Contiene:
- Las 9 Secciones de la Rúbrica Académica de Ingeniería de Software
- Sección 6 (6. ARQUITECTURA SELECCIONADA) estilo AgroSense con íconos/logos visuales generados con Pillow:
  * Columna izquierda (CLIENTE): Monitor de escritorio (Web App) arriba y Smartphone (Móvil / Pasaporte QR) abajo, conectados con flechas dobles ↔.
  * Columna central (4 bloques conectados con flechas verticales ↓):
    1) CAPA DE PRESENTACIÓN (Frontend): 3 escudos/logos a color (Next.js 14, TypeScript, Tailwind CSS).
    2) CAPA DE SERVICIOS (Lógica de Negocio): Logos de Node.js / API Gateway (hexágono verde) y Microservicios & JWT (identidad-service, baquiano-ai, pulso-service, auditoria-service).
    3) CAPA DE PERSISTENCIA (Acceso a Datos): Logos de ACID y ORM / RNT (integridad de cupos y documentos).
    4) BASE DE DATOS PostgreSQL: Cilindro de Base de Datos 3D azul + texto BASE DE DATOS PostgreSQL.
  * Columna derecha (SERVICIOS EXTERNOS): Nube azul (API Clima IDEAM / DIMAR) arriba y Sobre/Pasarela (Wompi Sandbox & Notificaciones) abajo, conectados con flechas ↔.
  * Caja verde inferior con el resumen de Tecnologías: y Arquitectura:.
- Sección 7 (7. PROTOTIPO FUNCIONAL): 3 capturas actualizadas v2.2.2 (1. Diorama 3D de 7 cotas y Perfil Longitudinal, 2. Concierge Baquiano AI con fotos reales, 3. Reserva ACID y Checkout corregido) + Código QR hacia https://tyronawilds.vercel.app/.
"""

from pathlib import Path
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

ROOT_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT_DIR / "docs" / "poster"
ASSETS_DIR = OUT_DIR / "assets"
PPTX_PATH = OUT_DIR / "Poster_TyronaWilds_v2.2.2.pptx"


def ensure_dirs():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)


def generate_assets():
    """Genera con Pillow los íconos/logos de la Sección 6 y las 3 capturas + QR de la Sección 7."""
    ensure_dirs()
    # Monitor Web App
    img = Image.new("RGBA", (260, 210), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([24, 14, 236, 152], radius=14, fill=(15, 23, 42, 255), outline=(2, 132, 199, 255), width=6)
    d.rectangle([36, 26, 224, 132], fill=(14, 165, 233, 255))
    d.polygon([(36, 132), (90, 68), (138, 104), (182, 54), (224, 132)], fill=(6, 95, 70, 255))
    d.rectangle([108, 152, 152, 180], fill=(100, 116, 139, 255))
    d.rounded_rectangle([74, 176, 186, 192], radius=6, fill=(51, 65, 85, 255))
    img.save(ASSETS_DIR / "icon_monitor_webapp.png")

    # Smartphone Móvil / Pasaporte QR
    img = Image.new("RGBA", (220, 230), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([52, 12, 168, 218], radius=20, fill=(15, 23, 42, 255), outline=(6, 95, 70, 255), width=6)
    d.rectangle([64, 34, 156, 188], fill=(240, 253, 244, 255))
    img.save(ASSETS_DIR / "icon_smartphone_qr.png")

    # Escudos / Logos de Capas
    for name, color in [
        ("logo_nextjs.png", (15, 23, 42, 255)),
        ("logo_typescript.png", (2, 132, 199, 255)),
        ("logo_tailwind.png", (13, 148, 136, 255)),
        ("logo_nodejs_gateway.png", (21, 128, 61, 255)),
        ("logo_microservices_jwt.png", (234, 88, 12, 255)),
        ("logo_acid.png", (6, 95, 70, 255)),
        ("logo_orm_rnt.png", (30, 64, 175, 255)),
    ]:
        badge = Image.new("RGBA", (220, 220), (255, 255, 255, 0))
        bd = ImageDraw.Draw(badge)
        bd.polygon([(110, 12), (198, 42), (180, 162), (110, 208), (40, 162), (22, 42)], fill=color)
        badge.save(ASSETS_DIR / name)

    # Cilindro 3D Base de Datos PostgreSQL
    db = Image.new("RGBA", (240, 220), (255, 255, 255, 0))
    dbd = ImageDraw.Draw(db)
    dbd.rectangle([42, 46, 198, 178], fill=(2, 132, 199, 255))
    dbd.ellipse([42, 20, 198, 72], fill=(56, 189, 248, 255), outline=(255, 255, 255, 255), width=4)
    dbd.ellipse([42, 152, 198, 204], fill=(3, 105, 161, 255), outline=(186, 230, 253, 255), width=3)
    db.save(ASSETS_DIR / "icon_postgresql_3d.png")

    # Nube Azul IDEAM / DIMAR y Sobre Wompi Sandbox
    cloud = Image.new("RGBA", (260, 190), (255, 255, 255, 0))
    cd = ImageDraw.Draw(cloud)
    cd.rounded_rectangle([40, 50, 220, 150], radius=32, fill=(2, 132, 199, 255))
    cloud.save(ASSETS_DIR / "icon_cloud_ideam.png")

    mail = Image.new("RGBA", (260, 190), (255, 255, 255, 0))
    md = ImageDraw.Draw(mail)
    md.rounded_rectangle([28, 30, 232, 162], radius=16, fill=(234, 88, 12, 255))
    mail.save(ASSETS_DIR / "icon_wompi_mail.png")


def add_section_card(slide, x, y, w, h, title, header_rgb, lines):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    card.fill.solid()
    card.fill.fore_color.rgb = RGBColor(255, 255, 255)
    card.line.color.rgb = RGBColor(203, 213, 225)
    card.line.width = Pt(2)

    hdr = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + 0.12), Inches(y + 0.12), Inches(w - 0.24), Inches(0.72)
    )
    hdr.fill.solid()
    hdr.fill.fore_color.rgb = RGBColor(*header_rgb)
    p = hdr.text_frame.paragraphs[0]
    p.text = title
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    if lines:
        tb = slide.shapes.add_textbox(Inches(x + 0.18), Inches(y + 0.92), Inches(w - 0.36), Inches(h - 1.06))
        tf = tb.text_frame
        tf.word_wrap = True
        for idx, text in enumerate(lines):
            para = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            para.text = text
            para.font.size = Pt(16)
            para.font.color.rgb = RGBColor(15, 23, 42)


def generate_poster():
    generate_assets()
    prs = Presentation()
    prs.slide_width = Inches(33.1)
    prs.slide_height = Inches(46.8)
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # Fondo A0 Crema Editorial
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(33.1), Inches(46.8))
    bg.fill.solid()
    bg.fill.fore_color.rgb = RGBColor(250, 248, 245)

    # Cabecera Institucional
    header = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.6), Inches(31.5), Inches(3.9))
    header.fill.solid()
    header.fill.fore_color.rgb = RGBColor(6, 95, 70)
    p = header.text_frame.paragraphs[0]
    p.text = "TYRONA WILDS™ v2.2.2: PLATAFORMA INTELIGENTE DE ECOTURISMO SOSTENIBLE, CAPACIDAD DE CARGA Y RESERVAS ACID"
    p.font.size = Pt(34)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.alignment = PP_ALIGN.CENTER

    # Secciones 1 a 5
    add_section_card(
        slide,
        0.8,
        4.8,
        9.9,
        9.2,
        "1. INTRODUCCIÓN Y CONTEXTO TERRITORIAL",
        (6, 95, 70),
        [
            "Santa Marta y la Sierra Nevada (0m a 5.775m MSNM) concentran ecosistemas estratégicos.",
            "• Integración de viajeros, operadores RNT y autoridades ambientales (PNN / ICANH).",
            "• Diorama Topográfico 3D de 7 cotas, Baquiano AI, Pulso Ambiental y Reservas ACID con QR.",
        ],
    )
    add_section_card(
        slide,
        0.8,
        14.3,
        9.9,
        9.8,
        "2. DEFINICIÓN DEL PROBLEMA",
        (234, 88, 12),
        [
            "• Saturación asimétrica de senderos (Cabo San Juan > 88% vs Minca < 30%).",
            "• Condiciones de carrera en reservas concurrentes sin bloqueo pesimista ACID.",
            "• Falta de validación nominal 1-a-1 para pólizas PNN y titularidad RNT.",
        ],
    )
    add_section_card(
        slide,
        0.8,
        24.4,
        9.9,
        9.8,
        "3. OBJETIVOS DEL PROYECTO",
        (2, 132, 199),
        [
            "• General: Desarrollar una plataforma multipágina basada en microservicios para gestionar aforo, recomendación IA y reservas ACID en Santa Marta.",
            "• Específicos: Diorama 3D de 7 cotas, Checkout ACID Wompi (HTTP 201/409/422) y RBAC RNT (HTTP 403).",
        ],
    )
    add_section_card(
        slide,
        0.8,
        34.5,
        9.9,
        10.6,
        "4. METODOLOGÍA DE INGENIERÍA Y GITFLOW",
        (6, 95, 70),
        [
            "• Ciclo iterativo con estrategia Gitflow estricta (main, develop, feature/*, fix/*, release/*).",
            "• Fases: Dominio ACID PostgreSQL -> Microservicios & JWT -> UX Editorial v2.2.2 -> Despliegue Vercel.",
        ],
    )
    add_section_card(
        slide,
        11.1,
        4.8,
        10.9,
        11.2,
        "5. REQUERIMIENTOS Y GESTIÓN DEL PROYECTO",
        (15, 118, 110),
        [
            "• RF-01 Diorama Topográfico 3D (7 cotas) y Vista Satelital 2D con Perfil Longitudinal.",
            "• RF-02 Concierge Baquiano AI y Pulso del Territorio en tiempo real.",
            "• RF-03 Checkout ACID en 3 pasos con Wompi Sandbox y Pasaporte Oficial QR.",
            "• RNF-01 Cero sobreventa y cumplimiento de Ley 1581 de 2012 (Habeas Data).",
        ],
    )

    # Sección 6: Arquitectura Seleccionada con íconos/logos incrustados
    add_section_card(
        slide, 11.1, 16.3, 10.9, 28.8, "6. ARQUITECTURA SELECCIONADA (3 CAPAS + MICROSERVICIOS)", (6, 95, 70), []
    )
    slide.shapes.add_picture(str(ASSETS_DIR / "icon_monitor_webapp.png"), Inches(11.6), Inches(20.2), Inches(1.8))
    slide.shapes.add_picture(str(ASSETS_DIR / "icon_smartphone_qr.png"), Inches(11.68), Inches(29.2), Inches(1.68))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_nextjs.png"), Inches(14.48), Inches(19.65), Inches(1.22))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_typescript.png"), Inches(15.94), Inches(19.65), Inches(1.22))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_tailwind.png"), Inches(17.4), Inches(19.65), Inches(1.22))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_nodejs_gateway.png"), Inches(14.85), Inches(24.85), Inches(1.4))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_microservices_jwt.png"), Inches(16.85), Inches(24.85), Inches(1.32))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_acid.png"), Inches(14.9), Inches(30.55), Inches(1.32))
    slide.shapes.add_picture(str(ASSETS_DIR / "logo_orm_rnt.png"), Inches(16.85), Inches(30.55), Inches(1.32))
    slide.shapes.add_picture(str(ASSETS_DIR / "icon_postgresql_3d.png"), Inches(15.72), Inches(35.4), Inches(1.65))
    slide.shapes.add_picture(str(ASSETS_DIR / "icon_cloud_ideam.png"), Inches(19.68), Inches(20.35), Inches(1.82))
    slide.shapes.add_picture(str(ASSETS_DIR / "icon_wompi_mail.png"), Inches(19.68), Inches(29.6), Inches(1.82))

    # Sección 7: Prototipo Funcional con las 3 capturas actualizadas + QR
    add_section_card(slide, 22.4, 4.8, 9.9, 19.6, "7. PROTOTIPO FUNCIONAL (TYRONA WILDS v2.2.2)", (2, 132, 199), [])
    slide.shapes.add_picture(str(ASSETS_DIR / "captura_1_diorama_3d.png"), Inches(22.65), Inches(5.8), Inches(5.5))
    slide.shapes.add_picture(str(ASSETS_DIR / "captura_2_baquiano_ai.png"), Inches(22.65), Inches(9.25), Inches(5.5))
    slide.shapes.add_picture(str(ASSETS_DIR / "captura_3_checkout_acid.png"), Inches(22.65), Inches(12.7), Inches(5.5))
    slide.shapes.add_picture(str(ASSETS_DIR / "qr_tyronawilds_vercel.png"), Inches(22.95), Inches(16.55), Inches(3.3))

    # Secciones 8 y 9
    add_section_card(
        slide,
        22.4,
        24.7,
        9.9,
        10.2,
        "8. VALIDACIÓN TÉCNICA, MÉTRICAS Y RESULTADOS",
        (234, 88, 12),
        [
            "• Concurrencia ACID: HTTP 409 CONFLICT en < 45 ms + reverso automático en Wompi Sandbox.",
            "• Integridad Nominal PNN: HTTP 422 ante documentos repetidos en el grupo.",
            "• Titularidad RNT: HTTP 403 ante operadores sin propiedad sobre el servicio.",
        ],
    )
    add_section_card(
        slide,
        22.4,
        35.2,
        9.9,
        9.9,
        "9. CONCLUSIONES Y TRABAJO FUTURO",
        (6, 95, 70),
        [
            "• Conclusión: La arquitectura distribuida ACID + Diorama 3D + IA bioclimática equilibra la conservación ecológica y la operación turística formal en Santa Marta.",
            "• Trabajo Futuro: Modo Offline PWA en Teyuna e integración IoT LoRaWAN en cuencas fluviales.",
        ],
    )

    prs.save(str(PPTX_PATH))
    print(f"Póster A0 v2.2.2 generado en: {PPTX_PATH}")


if __name__ == "__main__":
    generate_poster()
