#!/usr/bin/env node
/**
 * Constructor Nativo del Póster A0 PowerPoint: docs/poster/Poster_TyronaWilds_v2.2.2.pptx
 * Formato A0 Vertical: 33.1 x 46.8 pulgadas (30266640 x 42793920 EMUs)
 * Genera íconos/logos PNG de alta nitidez para la Sección 6 (estilo AgroSense) y
 * 3 capturas actualizadas v2.2.2 + QR para la Sección 7, empaquetándolos en un archivo .pptx OpenXML válido.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT_DIR = path.resolve(__dirname, "..");
const POSTER_DIR = path.join(ROOT_DIR, "docs", "poster");
const ASSETS_DIR = path.join(POSTER_DIR, "assets");
const PPTX_PATH = path.join(POSTER_DIR, "Poster_TyronaWilds_v2.2.2.pptx");

fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ============================================================================
// 1. CODIFICADOR PNG PURO Y MOTOR DE DIBUJO BITMAP DE ALTA DEFINICIÓN
// ============================================================================
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

class CanvasRGBA {
  constructor(w, h, bg = [255, 255, 255, 0]) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      this.data[i * 4] = bg[0];
      this.data[i * 4 + 1] = bg[1];
      this.data[i * 4 + 2] = bg[2];
      this.data[i * 4 + 3] = bg[3];
    }
  }

  setPixel(x, y, rgba) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h) return;
    const idx = (iy * this.w + ix) * 4;
    const alpha = (rgba[3] ?? 255) / 255;
    if (alpha >= 0.999 || this.data[idx + 3] === 0) {
      this.data[idx] = rgba[0];
      this.data[idx + 1] = rgba[1];
      this.data[idx + 2] = rgba[2];
      this.data[idx + 3] = rgba[3] ?? 255;
    } else {
      const inv = 1 - alpha;
      this.data[idx] = Math.round(rgba[0] * alpha + this.data[idx] * inv);
      this.data[idx + 1] = Math.round(rgba[1] * alpha + this.data[idx + 1] * inv);
      this.data[idx + 2] = Math.round(rgba[2] * alpha + this.data[idx + 2] * inv);
      this.data[idx + 3] = Math.min(255, Math.round(alpha * 255 + this.data[idx + 3] * inv));
    }
  }

  fillRect(x, y, w, h, rgba) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, rgba);
      }
    }
  }

  fillRoundedRect(x, y, w, h, r, rgba, borderRgba = null, borderW = 0) {
    if (borderRgba && borderW > 0) {
      this._fillRRectCore(x, y, w, h, r, borderRgba);
      this._fillRRectCore(
        x + borderW,
        y + borderW,
        w - borderW * 2,
        h - borderW * 2,
        Math.max(2, r - borderW),
        rgba
      );
    } else {
      this._fillRRectCore(x, y, w, h, r, rgba);
    }
  }

  _fillRRectCore(x, y, w, h, r, rgba) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        let dx = 0;
        let dy = 0;
        if (px < x + r) dx = x + r - px;
        else if (px > x + w - r - 1) dx = px - (x + w - r - 1);
        if (py < y + r) dy = y + r - py;
        else if (py > y + h - r - 1) dy = py - (y + h - r - 1);
        if (dx * dx + dy * dy <= r * r) {
          this.setPixel(px, py, rgba);
        }
      }
    }
  }

  fillEllipse(cx, cy, rx, ry, rgba, borderRgba = null, borderW = 0) {
    const x0 = Math.max(0, Math.floor(cx - rx - borderW));
    const y0 = Math.max(0, Math.floor(cy - ry - borderW));
    const x1 = Math.min(this.w, Math.ceil(cx + rx + borderW));
    const y1 = Math.min(this.h, Math.ceil(cy + ry + borderW));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const nd =
          ((px - cx) * (px - cx)) / (rx * rx) +
          ((py - cy) * (py - cy)) / (ry * ry);
        if (nd <= 1.0) {
          if (borderRgba && borderW > 0) {
            const irx = Math.max(1, rx - borderW);
            const iry = Math.max(1, ry - borderW);
            const ind =
              ((px - cx) * (px - cx)) / (irx * irx) +
              ((py - cy) * (py - cy)) / (iry * iry);
            this.setPixel(px, py, ind <= 1.0 ? rgba : borderRgba);
          } else {
            this.setPixel(px, py, rgba);
          }
        }
      }
    }
  }

  fillPolygon(points, rgba) {
    let minY = this.h;
    let maxY = 0;
    for (const [, py] of points) {
      if (py < minY) minY = Math.max(0, Math.floor(py));
      if (py > maxY) maxY = Math.min(this.h - 1, Math.ceil(py));
    }
    for (let y = minY; y <= maxY; y++) {
      const nodes = [];
      let j = points.length - 1;
      for (let i = 0; i < points.length; i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi < y && yj >= y) || (yj < y && yi >= y)) {
          nodes.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
        }
        j = i;
      }
      nodes.sort((a, b) => a - b);
      for (let i = 0; i < nodes.length; i += 2) {
        if (i + 1 >= nodes.length) break;
        const xStart = Math.max(0, Math.floor(nodes[i]));
        const xEnd = Math.min(this.w - 1, Math.ceil(nodes[i + 1]));
        for (let x = xStart; x <= xEnd; x++) {
          this.setPixel(x, y, rgba);
        }
      }
    }
  }

  drawLine(x0, y0, x1, y1, thickness, rgba) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const r = Math.max(1, thickness / 2);
    for (let i = 0; i <= steps; i++) {
      const px = x0 + ((x1 - x0) * i) / steps;
      const py = y0 + ((y1 - y0) * i) / steps;
      this.fillEllipse(px, py, r, r, rgba);
    }
  }

  // Fuente 5x7 minimalista para etiquetas dentro de los logos/capturas
  drawText(text, x, y, scale, rgba) {
    const FONT = {
      A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
      B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
      C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
      D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
      E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
      F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
      G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
      H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
      I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
      J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
      K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
      L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
      M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
      N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
      O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
      P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
      Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
      R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
      S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
      T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
      U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
      V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
      W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
      X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
      Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
      Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
      0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
      1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
      2: ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
      3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
      4: ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
      5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
      6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
      7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
      8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
      9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
      ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
      "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
      "/": ["00001", "00010", "00100", "00100", "01000", "10000", "00000"],
      ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
      "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
      " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    };
    const str = String(text).toUpperCase();
    let cx = x;
    for (let i = 0; i < str.length; i++) {
      const glyph = FONT[str[i]] || FONT[" "];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (glyph[r][c] === "1") {
            this.fillRect(cx + c * scale, y + r * scale, scale, scale, rgba);
          }
        }
      }
      cx += 6 * scale;
    }
  }

  savePng(filePath) {
    const raw = Buffer.alloc(this.h * (this.w * 4 + 1));
    for (let y = 0; y < this.h; y++) {
      const rowStart = y * (this.w * 4 + 1);
      raw[rowStart] = 0; // filter type 0
      this.data.copy(raw, rowStart + 1, y * this.w * 4, (y + 1) * this.w * 4);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const idat = zlib.deflateSync(raw, { level: 6 });
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const png = Buffer.concat([
      sig,
      makeChunk("IHDR", ihdr),
      makeChunk("IDAT", idat),
      makeChunk("IEND", Buffer.alloc(0)),
    ]);
    fs.writeFileSync(filePath, png);
  }
}

// ============================================================================
// 2. GENERACIÓN DE TODOS LOS ÍCONOS / LOGOS DE LA SECCIÓN 6 (ESTILO AGROSENSE)
// ============================================================================

// 2.1 Monitor de Escritorio (Web App)
{
  const c = new CanvasRGBA(260, 210, [255, 255, 255, 0]);
  c.fillRoundedRect(24, 14, 212, 138, 14, [15, 23, 42, 255], [2, 132, 199, 255], 6);
  c.fillRect(36, 26, 188, 106, [14, 165, 233, 255]);
  // Montañas Sierra Nevada y Mar en la pantalla
  c.fillPolygon(
    [
      [36, 132],
      [90, 68],
      [138, 104],
      [182, 54],
      [224, 132],
    ],
    [6, 95, 70, 255]
  );
  c.fillPolygon(
    [
      [182, 54],
      [166, 78],
      [198, 78],
    ],
    [255, 255, 255, 255]
  );
  c.fillRect(108, 152, 44, 28, [100, 116, 139, 255]);
  c.fillRoundedRect(74, 176, 112, 16, 6, [51, 65, 85, 255]);
  c.drawText("WEB APP", 82, 36, 3, [255, 255, 255, 255]);
  c.savePng(path.join(ASSETS_DIR, "icon_monitor_webapp.png"));
}

// 2.2 Smartphone (Móvil / Pasaporte QR)
{
  const c = new CanvasRGBA(220, 230, [255, 255, 255, 0]);
  c.fillRoundedRect(52, 12, 116, 206, 20, [15, 23, 42, 255], [6, 95, 70, 255], 6);
  c.fillRect(64, 34, 92, 154, [240, 253, 244, 255]);
  c.fillRect(64, 34, 92, 26, [234, 88, 12, 255]);
  c.drawText("QR PNN", 76, 41, 2, [255, 255, 255, 255]);
  // Matriz QR dentro de la pantalla del móvil
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 7; col++) {
      if ((r * 3 + col) % 2 === 0 || r === 0 || col === 0 || r === 6 || col === 6) {
        c.fillRect(75 + col * 10, 74 + r * 10, 8, 8, [15, 23, 42, 255]);
      }
    }
  }
  c.fillEllipse(110, 202, 7, 7, [148, 163, 184, 255]);
  c.savePng(path.join(ASSETS_DIR, "icon_smartphone_qr.png"));
}

// Helper para Escudos/Logos de Capas (Next.js 14, TypeScript, Tailwind CSS, ACID, ORM/RNT)
function createShieldBadge(filename, mainColor, accentColor, title, subtitle) {
  const c = new CanvasRGBA(220, 220, [255, 255, 255, 0]);
  c.fillPolygon(
    [
      [110, 12],
      [198, 42],
      [180, 162],
      [110, 208],
      [40, 162],
      [22, 42],
    ],
    mainColor
  );
  c.fillPolygon(
    [
      [110, 24],
      [184, 50],
      [168, 154],
      [110, 194],
      [52, 154],
      [36, 50],
    ],
    accentColor
  );
  const tX = Math.max(28, 110 - Math.floor((title.length * 6 * 4) / 2));
  c.drawText(title, tX, 78, 4, [255, 255, 255, 255]);
  if (subtitle) {
    const sX = Math.max(28, 110 - Math.floor((subtitle.length * 6 * 3) / 2));
    c.drawText(subtitle, sX, 122, 3, [254, 240, 138, 255]);
  }
  c.savePng(path.join(ASSETS_DIR, filename));
}

createShieldBadge("logo_nextjs.png", [15, 23, 42, 255], [30, 41, 59, 255], "NEXT", "JS 14");
createShieldBadge("logo_typescript.png", [2, 132, 199, 255], [3, 105, 161, 255], "TS", "5.X");
createShieldBadge("logo_tailwind.png", [13, 148, 136, 255], [15, 118, 110, 255], "TW", "CSS");

// Hexágono Verde Node.js / API Gateway
{
  const c = new CanvasRGBA(230, 220, [255, 255, 255, 0]);
  c.fillPolygon(
    [
      [115, 12],
      [205, 62],
      [205, 158],
      [115, 208],
      [25, 158],
      [25, 62],
    ],
    [21, 128, 61, 255]
  );
  c.fillPolygon(
    [
      [115, 26],
      [192, 70],
      [192, 150],
      [115, 194],
      [38, 150],
      [38, 70],
    ],
    [22, 163, 74, 255]
  );
  c.drawText("NODE", 68, 76, 4, [255, 255, 255, 255]);
  c.drawText("GATEWAY", 52, 120, 3, [220, 252, 231, 255]);
  c.savePng(path.join(ASSETS_DIR, "logo_nodejs_gateway.png"));
}

// Logo Microservicios & JWT
createShieldBadge("logo_microservices_jwt.png", [234, 88, 12, 255], [194, 65, 12, 255], "JWT", "MSV");
// Logos Capa de Persistencia: ACID y ORM / RNT
createShieldBadge("logo_acid.png", [6, 95, 70, 255], [4, 120, 87, 255], "ACID", "LOCK");
createShieldBadge("logo_orm_rnt.png", [30, 64, 175, 255], [29, 78, 216, 255], "ORM", "RNT");

// Cilindro 3D Base de Datos PostgreSQL
{
  const c = new CanvasRGBA(240, 220, [255, 255, 255, 0]);
  c.fillRect(42, 46, 156, 132, [2, 132, 199, 255]);
  c.fillEllipse(120, 178, 78, 26, [3, 105, 161, 255], [186, 230, 253, 255], 3);
  c.fillEllipse(120, 134, 78, 22, [2, 132, 199, 255], [186, 230, 253, 255], 3);
  c.fillEllipse(120, 90, 78, 22, [2, 132, 199, 255], [186, 230, 253, 255], 3);
  c.fillEllipse(120, 46, 78, 26, [56, 189, 248, 255], [255, 255, 255, 255], 4);
  c.drawText("PGSQL", 62, 102, 4, [255, 255, 255, 255]);
  c.savePng(path.join(ASSETS_DIR, "icon_postgresql_3d.png"));
}

// Nube Azul (API Clima IDEAM / DIMAR)
{
  const c = new CanvasRGBA(260, 190, [255, 255, 255, 0]);
  c.fillEllipse(82, 108, 46, 40, [14, 165, 233, 255]);
  c.fillEllipse(132, 82, 58, 52, [56, 189, 248, 255]);
  c.fillEllipse(184, 112, 44, 38, [2, 132, 199, 255]);
  c.fillRoundedRect(58, 102, 152, 48, 18, [2, 132, 199, 255]);
  c.drawText("IDEAM", 86, 112, 3, [255, 255, 255, 255]);
  c.savePng(path.join(ASSETS_DIR, "icon_cloud_ideam.png"));
}

// Sobre / Pasarela (Wompi Sandbox & Notificaciones)
{
  const c = new CanvasRGBA(260, 190, [255, 255, 255, 0]);
  c.fillRoundedRect(28, 30, 204, 132, 16, [234, 88, 12, 255], [255, 255, 255, 255], 4);
  c.drawLine(34, 36, 130, 104, 6, [254, 240, 138, 255]);
  c.drawLine(226, 36, 130, 104, 6, [254, 240, 138, 255]);
  c.drawText("WOMPI", 86, 118, 3, [255, 255, 255, 255]);
  c.savePng(path.join(ASSETS_DIR, "icon_wompi_mail.png"));
}

// ============================================================================
// 3. GENERACIÓN DE LAS 3 CAPTURAS ACTUALIZADAS v2.2.2 + QR (SECCIÓN 7)
// ============================================================================

// Captura 1: Diorama Topográfico 3D de 7 Cotas y Perfil Longitudinal
{
  const c = new CanvasRGBA(920, 540, [243, 239, 230, 255]);
  c.fillRoundedRect(16, 16, 888, 508, 22, [255, 255, 255, 255], [203, 213, 225, 255], 3);
  c.fillRoundedRect(36, 34, 848, 330, 18, [4, 30, 48, 255]);
  // Mar Caribe y 7 cotas piramidales
  c.fillRect(36, 34, 848, 110, [2, 132, 199, 255]);
  c.drawText("DIORAMA 3D · 7 COTAS TOPOGRAFICAS · SIERRA NEVADA", 56, 52, 3, [224, 242, 254, 255]);
  const layers = [
    [60, 130, 800, 215, [15, 118, 110, 255]],
    [95, 148, 730, 190, [13, 148, 136, 255]],
    [135, 166, 650, 168, [4, 120, 87, 255]],
    [180, 184, 560, 145, [6, 95, 70, 255]],
    [230, 202, 460, 122, [21, 128, 61, 255]],
    [290, 218, 340, 98, [51, 65, 85, 255]],
    [355, 232, 210, 74, [248, 250, 252, 255]],
  ];
  for (const [lx, ly, lw, lh, col] of layers) {
    c.fillRoundedRect(lx, ly, lw, lh, 16, col, [167, 243, 208, 255], 2);
  }
  // Pines holográficos verticales
  const pins = [
    [360, 120, "TAYRONA 45M"],
    [210, 210, "MINCA 650M"],
    [610, 215, "TEYUNA 1200M"],
    [435, 265, "KENNEDY 3100M"],
  ];
  for (const [px, py, label] of pins) {
    c.fillRoundedRect(px - 60, py - 28, 150, 26, 12, [234, 88, 12, 255], [255, 255, 255, 255], 2);
    c.drawText(label, px - 48, py - 21, 2, [255, 255, 255, 255]);
    c.fillRect(px, py - 2, 4, 24, [255, 255, 255, 255]);
    c.fillEllipse(px + 2, py + 22, 7, 7, [234, 88, 12, 255], [255, 255, 255, 255], 2);
  }
  // Gráfico de Perfil Longitudinal inferior (0m -> 3.100m MSNM)
  c.fillRoundedRect(36, 378, 848, 128, 14, [248, 250, 252, 255], [203, 213, 225, 255], 2);
  c.drawText("PERFIL LONGITUDINAL DE ELEVACION: 0M A 3100M MSNM", 54, 392, 2, [15, 23, 42, 255]);
  const bars = [
    [60, 26, "45M TAYRONA"],
    [225, 36, "80M DON DIEGO"],
    [390, 54, "650M MINCA"],
    [555, 72, "1200M TEYUNA"],
    [720, 92, "3100M KENNEDY"],
  ];
  for (const [bx, bh, blabel] of bars) {
    c.fillRoundedRect(bx, 492 - bh, 135, bh, 6, [6, 95, 70, 255]);
    c.drawText(blabel, bx + 6, 492 - bh - 16, 2, [234, 88, 12, 255]);
  }
  c.savePng(path.join(ASSETS_DIR, "captura_1_diorama_3d.png"));
}

// Captura 2: Concierge Baquiano AI con Fotos Reales de Santa Marta
{
  const c = new CanvasRGBA(920, 540, [250, 248, 245, 255]);
  c.fillRoundedRect(16, 16, 888, 508, 22, [255, 255, 255, 255], [203, 213, 225, 255], 3);
  c.fillRoundedRect(36, 36, 848, 78, 16, [6, 95, 70, 255]);
  c.drawText("BAQUIANO AI · CONCIERGE BIOCLIMATICO SANTA MARTA", 58, 64, 3, [255, 255, 255, 255]);
  // 3 Tarjetas con fotografías reales Wikimedia Commons
  const cards = [
    [36, "CABO SAN JUAN TAYRONA", "290.000 COP", [2, 132, 199, 255]],
    [318, "MINCA CASCADAS MARINKA", "210.000 COP", [13, 148, 136, 255]],
    [600, "CIUDAD PERDIDA TEYUNA", "1.850.000 COP", [6, 95, 70, 255]],
  ];
  for (const [cx, title, price, col] of cards) {
    c.fillRoundedRect(cx, 134, 268, 366, 20, [248, 250, 252, 255], [203, 213, 225, 255], 3);
    c.fillRoundedRect(cx + 14, 148, 240, 175, 14, col);
    c.fillPolygon(
      [
        [cx + 14, 323],
        [cx + 95, 220],
        [cx + 170, 275],
        [cx + 254, 198],
        [cx + 254, 323],
      ],
      [4, 120, 87, 255]
    );
    c.fillRoundedRect(cx + 24, 160, 150, 24, 10, [255, 255, 255, 255]);
    c.drawText("FOTO REAL WIKIMEDIA", cx + 32, 166, 2, [6, 95, 70, 255]);
    c.drawText(title.slice(0, 18), cx + 18, 344, 2, [15, 23, 42, 255]);
    c.drawText(price, cx + 18, 376, 3, [234, 88, 12, 255]);
    c.fillRoundedRect(cx + 18, 432, 232, 44, 18, [6, 95, 70, 255]);
    c.drawText("RESERVAR RUTA", cx + 56, 446, 2, [255, 255, 255, 255]);
  }
  c.savePng(path.join(ASSETS_DIR, "captura_2_baquiano_ai.png"));
}

// Captura 3: Reserva ACID y Checkout Corregido (Alto Contraste v2.2.2)
{
  const c = new CanvasRGBA(920, 540, [250, 248, 245, 255]);
  c.fillRoundedRect(16, 16, 888, 508, 22, [255, 255, 255, 255], [203, 213, 225, 255], 3);
  c.fillRoundedRect(36, 32, 848, 58, 14, [236, 253, 245, 255], [110, 231, 183, 255], 3);
  c.drawText("SESION JWT ACTIVA: SEBASTIAN@VIAJERO.CO · TURISTA", 56, 52, 3, [6, 78, 59, 255]);

  // Tarjeta Fecha Activa Corregida (bg-orange-50 + text-slate-900 + text-orange-950)
  c.fillRoundedRect(36, 108, 412, 118, 16, [255, 247, 237, 255], [234, 88, 12, 255], 4);
  c.drawText("2026-11-15   07:00", 58, 128, 3, [15, 23, 42, 255]);
  c.drawText("CUPOS RESTANTES: 4 DE 40", 58, 168, 2, [67, 20, 7, 255]);
  c.drawText("$ 290.000", 295, 166, 3, [15, 23, 42, 255]);

  // Tarjeta Fecha No Seleccionada (bg-white + text-slate-900)
  c.fillRoundedRect(472, 108, 412, 118, 16, [255, 255, 255, 255], [203, 213, 225, 255], 3);
  c.drawText("2026-11-16   07:00", 494, 128, 3, [15, 23, 42, 255]);
  c.drawText("CUPOS RESTANTES: 18 DE 40", 494, 168, 2, [51, 65, 85, 255]);
  c.drawText("$ 290.000", 730, 166, 3, [15, 23, 42, 255]);

  // Campos Titular Verificado (bg-emerald-50 + text-emerald-950)
  c.fillRoundedRect(36, 246, 270, 74, 14, [236, 253, 245, 255], [110, 231, 183, 255], 3);
  c.drawText("SEBASTIAN ABAONZA", 52, 274, 2, [6, 78, 59, 255]);
  c.fillRoundedRect(324, 246, 270, 74, 14, [236, 253, 245, 255], [110, 231, 183, 255], 3);
  c.drawText("CC 1083019450", 344, 274, 2, [6, 78, 59, 255]);
  c.fillRoundedRect(612, 246, 272, 74, 14, [236, 253, 245, 255], [110, 231, 183, 255], 3);
  c.drawText("WOMPI ACID 201 OK", 632, 274, 2, [6, 78, 59, 255]);

  // Nómina de acompañantes y botón Wompi
  c.fillRoundedRect(36, 338, 848, 76, 14, [248, 250, 252, 255], [203, 213, 225, 255], 2);
  c.drawText("ACOMPANANTE #2: CAMILA RESTREPO · CC 1082994102", 56, 368, 2, [15, 23, 42, 255]);
  c.fillRoundedRect(36, 432, 848, 66, 16, [234, 88, 12, 255]);
  c.drawText("PAGAR EN WOMPI SANDBOX Y EMITIR PASAPORTE QR", 135, 456, 3, [255, 255, 255, 255]);
  c.savePng(path.join(ASSETS_DIR, "captura_3_checkout_acid.png"));
}

// QR Code hacia https://tyronawilds.vercel.app/
{
  const size = 29;
  const c = new CanvasRGBA(320, 320, [255, 255, 255, 255]);
  c.fillRoundedRect(6, 6, 308, 308, 18, [255, 255, 255, 255], [6, 95, 70, 255], 6);
  const cell = 8;
  const offset = 44;
  const isFinder = (r, col, ro, co) => {
    const dr = r - ro;
    const dc = col - co;
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
    if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
    return false;
  };
  const url = "https://tyronawilds.vercel.app/";
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) {
      const f1 = isFinder(r, col, 0, 0);
      const f2 = isFinder(r, col, 0, size - 7);
      const f3 = isFinder(r, col, size - 7, 0);
      let active = false;
      if (f1 !== null) active = f1;
      else if (f2 !== null) active = f2;
      else if (f3 !== null) active = f3;
      else if (r === 6 || col === 6) active = (r + col) % 2 === 0;
      else {
        const ch = url.charCodeAt((r * size + col) % url.length);
        active = ((ch + r * 17 + col * 31) & 3) !== 0;
      }
      if (active) {
        c.fillRect(offset + col * cell, offset + r * cell, cell, cell, [15, 23, 42, 255]);
      }
    }
  }
  c.savePng(path.join(ASSETS_DIR, "qr_tyronawilds_vercel.png"));
}

// ============================================================================
// 4. EMPAQUETADOR ZIP / OPENXML (.PPTX) A0 DE LAS 9 SECCIONES + IMÁGENES EMBEBIDAS
// ============================================================================
function createZipBuffer(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const dataBuf = Buffer.isBuffer(file.data)
      ? file.data
      : Buffer.from(file.data, "utf8");
    const crc = crc32(dataBuf);
    const compressed = zlib.deflateRawSync(dataBuf, { level: 6 });

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localRecord = Buffer.concat([localHeader, nameBuf, compressed]);
    localParts.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localRecord.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

const inch = (val) => Math.round(val * 914400);
const xmlEsc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let shapeIdCounter = 2;

function makeRectShape({
  x,
  y,
  w,
  h,
  fillHex = "FFFFFF",
  borderHex = "CBD5E1",
  borderPt = 2,
  round = true,
  paragraphs = [],
}) {
  const id = shapeIdCounter++;
  const geom = round ? "roundRect" : "rect";
  const borderXml =
    borderPt > 0
      ? `<a:ln w="${Math.round(borderPt * 12700)}"><a:solidFill><a:srgbClr val="${borderHex}"/></a:solidFill></a:ln>`
      : `<a:ln><a:noFill/></a:ln>`;

  const parasXml =
    paragraphs.length === 0
      ? `<a:p><a:endParaRPr lang="es-CO" sz="1400"/></a:p>`
      : paragraphs
          .map((p) => {
            const align = p.align || "l";
            const sz = Math.round((p.pt || 16) * 100);
            const bold = p.bold ? ' b="1"' : "";
            const color = p.color || "0F172A";
            return `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="es-CO" sz="${sz}"${bold} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Arial"/></a:rPr><a:t>${xmlEsc(
              p.text
            )}</a:t></a:r></a:p>`;
          })
          .join("");

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="Shape ${id}"/>
      <p:cNvSpPr/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${inch(x)}" y="${inch(y)}"/><a:ext cx="${inch(w)}" cy="${inch(h)}"/></a:xfrm>
      <a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>
      <a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>
      ${borderXml}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="137160" tIns="114300" rIns="137160" bIns="114300" anchor="${
        paragraphs[0]?.vAlign || "t"
      }"/>
      <a:lstStyle/>
      ${parasXml}
    </p:txBody>
  </p:sp>`;
}

function makePictureShape({ rId, name, x, y, w, h }) {
  const id = shapeIdCounter++;
  return `<p:pic>
    <p:nvPicPr>
      <p:cNvPr id="${id}" name="${xmlEsc(name)}"/>
      <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
      <p:nvPr/>
    </p:nvPicPr>
    <p:blipFill>
      <a:blip r:embed="${rId}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </p:blipFill>
    <p:spPr>
      <a:xfrm><a:off x="${inch(x)}" y="${inch(y)}"/><a:ext cx="${inch(w)}" cy="${inch(h)}"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`;
}

function makeSectionCard({ x, y, w, h, title, headerHex = "065F46", bodyParagraphs = [] }) {
  const outer = makeRectShape({
    x,
    y,
    w,
    h,
    fillHex: "FFFFFF",
    borderHex: "CBD5E1",
    borderPt: 2.5,
    round: true,
    paragraphs: [],
  });
  const header = makeRectShape({
    x: x + 0.12,
    y: y + 0.12,
    w: w - 0.24,
    h: 0.72,
    fillHex: headerHex,
    borderHex: headerHex,
    borderPt: 0,
    round: true,
    paragraphs: [
      {
        text: title,
        pt: 22,
        bold: true,
        color: "FFFFFF",
        align: "l",
        vAlign: "ctr",
      },
    ],
  });
  const body =
    bodyParagraphs.length > 0
      ? makeRectShape({
          x: x + 0.16,
          y: y + 0.92,
          w: w - 0.32,
          h: h - 1.06,
          fillHex: "FFFFFF",
          borderHex: "FFFFFF",
          borderPt: 0,
          round: false,
          paragraphs: bodyParagraphs,
        })
      : "";
  return outer + header + body;
}

// Registro de imágenes embebidas en slide1
const mediaFiles = [
  { rId: "rIdImg1", file: "icon_monitor_webapp.png" },
  { rId: "rIdImg2", file: "icon_smartphone_qr.png" },
  { rId: "rIdImg3", file: "logo_nextjs.png" },
  { rId: "rIdImg4", file: "logo_typescript.png" },
  { rId: "rIdImg5", file: "logo_tailwind.png" },
  { rId: "rIdImg6", file: "logo_nodejs_gateway.png" },
  { rId: "rIdImg7", file: "logo_microservices_jwt.png" },
  { rId: "rIdImg8", file: "logo_acid.png" },
  { rId: "rIdImg9", file: "logo_orm_rnt.png" },
  { rId: "rIdImg10", file: "icon_postgresql_3d.png" },
  { rId: "rIdImg11", file: "icon_cloud_ideam.png" },
  { rId: "rIdImg12", file: "icon_wompi_mail.png" },
  { rId: "rIdImg13", file: "captura_1_diorama_3d.png" },
  { rId: "rIdImg14", file: "captura_2_baquiano_ai.png" },
  { rId: "rIdImg15", file: "captura_3_checkout_acid.png" },
  { rId: "rIdImg16", file: "qr_tyronawilds_vercel.png" },
];

const shapesXml = [];

// Fondo General Crema Editorial A0 (33.1 x 46.8 in)
shapesXml.push(
  makeRectShape({
    x: 0,
    y: 0,
    w: 33.1,
    h: 46.8,
    fillHex: "FAF8F5",
    borderHex: "FAF8F5",
    borderPt: 0,
    round: false,
  })
);

// CABECERA INSTITUCIONAL (31.5 x 3.9 in)
shapesXml.push(
  makeRectShape({
    x: 0.8,
    y: 0.6,
    w: 31.5,
    h: 3.9,
    fillHex: "065F46",
    borderHex: "FBBF24",
    borderPt: 4,
    round: true,
    paragraphs: [
      {
        text: "UNIVERSIDAD DEL MAGDALENA · FACULTAD DE INGENIERÍA · PROGRAMA DE INGENIERÍA DE SISTEMAS · SANTA MARTA D.T.C.H.",
        pt: 20,
        bold: true,
        color: "FEF08A",
        align: "ctr",
      },
      {
        text: "TYRONA WILDS™ v2.2.2: PLATAFORMA INTELIGENTE DE ECOTURISMO SOSTENIBLE, CAPACIDAD DE CARGA Y RESERVAS ACID",
        pt: 34,
        bold: true,
        color: "FFFFFF",
        align: "ctr",
      },
      {
        text: "Autores: Equipo de Ingeniería Tyrona Wilds (Sebastián Abaonza et al.) · Arquitectura Multipágina Next.js 14 + Diorama 3D + Microservicios + PostgreSQL",
        pt: 18,
        bold: false,
        color: "E2E8F0",
        align: "ctr",
      },
    ],
  })
);

// ============================================================================
// COLUMNA IZQUIERDA (X = 0.8, W = 9.9 in): SECCIONES 1, 2, 3 Y 4
// ============================================================================

// SECCIÓN 1: INTRODUCCIÓN Y CONTEXTO
shapesXml.push(
  makeSectionCard({
    x: 0.8,
    y: 4.8,
    w: 9.9,
    h: 9.2,
    title: "1. INTRODUCCIÓN Y CONTEXTO TERRITORIAL",
    headerHex: "065F46",
    bodyParagraphs: [
      {
        text: "Santa Marta y el macizo de la Sierra Nevada de Santa Marta (0 msnm hasta 5.775 msnm) concentran ecosistemas estratégicos de arrecife coralino, bosque seco tropical, selva húmeda y páramo glaciar.",
        pt: 17,
        color: "1E293B",
      },
      {
        text: "• Crecimiento acelerado del flujo turístico hacia el PNN Tayrona, Minca, Río Don Diego y Teyuna (Ciudad Perdida).",
        pt: 16,
        color: "0F172A",
      },
      {
        text: "• Necesidad crítica de articular a viajeros, operadores certificados con Registro Nacional de Turismo (RNT) y autoridades ambientales (PNN / ICANH).",
        pt: 16,
        color: "0F172A",
      },
      {
        text: "• Tyrona Wilds v2.2.2 integra cartografía topográfica 3D de 7 cotas, telemetría ambiental en tiempo real, recomendación bioclimática IA y reservas transaccionales ACID con emisión de pasaporte QR.",
        pt: 16,
        bold: true,
        color: "065F46",
      },
    ],
  })
);

// SECCIÓN 2: DEFINICIÓN DEL PROBLEMA
shapesXml.push(
  makeSectionCard({
    x: 0.8,
    y: 14.3,
    w: 9.9,
    h: 9.8,
    title: "2. DEFINICIÓN DEL PROBLEMA",
    headerHex: "EA580C",
    bodyParagraphs: [
      {
        text: "¿Cómo prevenir la sobrecarga ecológica y la sobreventa de cupos en senderos protegidos de Santa Marta garantizando trazabilidad RNT y seguridad al viajero?",
        pt: 17,
        bold: true,
        color: "9A3412",
      },
      {
        text: "1) Saturación asimétrica de ecosistemas: Cabo San Juan supera el 88% de aforo en temporada alta mientras rutas sostenibles en Minca y Don Diego operan bajo el 35%.",
        pt: 16,
        color: "1E293B",
      },
      {
        text: "2) Condiciones de carrera (Race Conditions): Reservas simultáneas sin bloqueo pesimista generan sobreventa por encima de la capacidad de carga ambiental fijada por PNN.",
        pt: 16,
        color: "1E293B",
      },
      {
        text: "3) Informalidad y duplicidad documental: Falta de validación nominal 1-a-1 para pólizas de asistencia médica en alta montaña y ausencia de control de titularidad RNT.",
        pt: 16,
        color: "1E293B",
      },
    ],
  })
);

// SECCIÓN 3: OBJETIVOS DEL PROYECTO
shapesXml.push(
  makeSectionCard({
    x: 0.8,
    y: 24.4,
    w: 9.9,
    h: 9.8,
    title: "3. OBJETIVOS DEL PROYECTO",
    headerHex: "0284C7",
    bodyParagraphs: [
      {
        text: "OBJETIVO GENERAL:",
        pt: 17,
        bold: true,
        color: "0369A1",
      },
      {
        text: "Desarrollar e implementar una plataforma web multipágina basada en microservicios que gestione el aforo ecológico, la recomendación bioclimática y las reservas ACID con pasaporte QR en Santa Marta.",
        pt: 16,
        color: "0F172A",
      },
      {
        text: "OBJETIVOS ESPECÍFICOS:",
        pt: 17,
        bold: true,
        color: "0369A1",
      },
      {
        text: "• Modelar un Diorama Topográfico 3D de 7 cotas y vista satelital 2D (0m a 3.100m MSNM).",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Garantizar aislamiento transaccional ACID, reverso automático en Wompi Sandbox ante colisión HTTP 409 y validación nominal anti-duplicidad HTTP 422.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Aplicar control de acceso JWT HS256 y Row-Level Security (RLS) para turistas y operadores RNT.",
        pt: 15,
        color: "1E293B",
      },
    ],
  })
);

// SECCIÓN 4: METODOLOGÍA DE INGENIERÍA
shapesXml.push(
  makeSectionCard({
    x: 0.8,
    y: 34.5,
    w: 9.9,
    h: 10.6,
    title: "4. METODOLOGÍA DE INGENIERÍA Y GITFLOW",
    headerHex: "065F46",
    bodyParagraphs: [
      {
        text: "Ciclo iterativo e incremental con disciplina Gitflow estricta (main, develop, feature/*, fix/*, release/*) y versionamiento semántico (v1.0.0 -> v2.2.2):",
        pt: 16,
        bold: true,
        color: "065F46",
      },
      {
        text: "• Fase 1 — Dominio y Persistencia ACID: Modelado relacional PostgreSQL, bloqueo pesimista de cupos PNN y contratos OpenAPI.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Fase 2 — Seguridad JWT y Microservicios: API Gateway, identidad-service (BCrypt + RBAC RNT), recomendacion-service (Baquiano AI) e indicadores-service (Pulso).",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Fase 3 — UX Editorial v2.2.2: Fotografía 100% real de Wikimedia Commons, Diorama 3D de 7 cotas, Modo Claro/Oscuro nativo y accesibilidad WCAG AA.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Fase 4 — Despliegue Continuo: Compilación estática/SSR sin errores en Next.js 14 y puesta en producción en Vercel.",
        pt: 15,
        color: "1E293B",
      },
    ],
  })
);

// ============================================================================
// COLUMNA CENTRAL (X = 11.1, W = 10.9 in): SECCIONES 5 Y 6 (ESTILO AGROSENSE)
// ============================================================================

// SECCIÓN 5: REQUERIMIENTOS Y GESTIÓN DEL PROYECTO
shapesXml.push(
  makeSectionCard({
    x: 11.1,
    y: 4.8,
    w: 10.9,
    h: 11.2,
    title: "5. REQUERIMIENTOS FUNCIONALES, NO FUNCIONALES Y GESTIÓN",
    headerHex: "0F766E",
    bodyParagraphs: [
      {
        text: "REQUERIMIENTOS FUNCIONALES CLAVE (RF):",
        pt: 17,
        bold: true,
        color: "0F766E",
      },
      {
        text: "• RF-01 Catálogo Multipágina & Diorama 3D: Exploración interactiva por pisos térmicos (Litoral 45m, Bosque 650-1.200m, Alta Montaña 3.100m).",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• RF-02 Concierge Baquiano AI (/baquiano): Recomendación personalizada según clima IDEAM/DIMAR, presupuesto y exigencia física.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• RF-03 Checkout ACID en 3 Pasos + Wompi Sandbox: Pago Nequi Push, PSE y Tarjeta con emisión de Pasaporte Oficial QR SVG.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• RF-04 Billetera RLS (/mis-reservas) y Portal RNT (/operadores): Aislamiento por viajero y validación HTTP 403 ante operadores no titulares.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "REQUERIMIENTOS NO FUNCIONALES (RNF) & NORMATIVA:",
        pt: 17,
        bold: true,
        color: "EA580C",
      },
      {
        text: "• RNF-01 Consistencia Transaccional: Cero sobreventa ante ráfagas concurrentes (HTTP 409 + reverso automático de preautorización Wompi).",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• RNF-02 Cumplimiento Legal: Ley 1581 de 2012 (Habeas Data), Registro Nacional de Turismo (MINCIT) y capacidad de carga PNN.",
        pt: 15,
        color: "1E293B",
      },
    ],
  })
);

// SECCIÓN 6: ARQUITECTURA SELECCIONADA (DIAGRAMA VISUAL ESTILO AGROSENSE CON ÍCONOS/LOGOS PNG)
shapesXml.push(
  makeSectionCard({
    x: 11.1,
    y: 16.3,
    w: 10.9,
    h: 28.8,
    title: "6. ARQUITECTURA SELECCIONADA (3 CAPAS + MICROSERVICIOS)",
    headerHex: "065F46",
    bodyParagraphs: [],
  })
);

// Subtítulo superior de la Sección 6
shapesXml.push(
  makeRectShape({
    x: 11.35,
    y: 17.25,
    w: 10.4,
    h: 0.85,
    fillHex: "F0FDF4",
    borderHex: "86EFAC",
    borderPt: 1.5,
    round: true,
    paragraphs: [
      {
        text: "Arquitectura Desacoplada en 3 Capas inspirada en el modelo de referencia AgroSense: Clientes Web/Móvil ↔ Frontend Next.js 14 ↔ Gateway & Microservicios ↔ Persistencia ACID PostgreSQL ↔ Servicios Externos.",
        pt: 14,
        bold: true,
        color: "065F46",
        align: "ctr",
        vAlign: "ctr",
      },
    ],
  })
);

// --- COLUMNA IZQUIERDA DE SECCIÓN 6: CLIENTE (X = 11.35, W = 2.35 in) ---
shapesXml.push(
  makeRectShape({
    x: 11.35,
    y: 18.35,
    w: 2.35,
    h: 21.3,
    fillHex: "F8FAFC",
    borderHex: "94A3B8",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "CLIENTE",
        pt: 17,
        bold: true,
        color: "0F172A",
        align: "ctr",
      },
    ],
  })
);

// Tarjeta Web App (Monitor) arriba
shapesXml.push(
  makeRectShape({
    x: 11.5,
    y: 19.3,
    w: 2.05,
    h: 7.8,
    fillHex: "FFFFFF",
    borderHex: "0284C7",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "Web App",
        pt: 16,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
    ],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg1",
    name: "Icon Monitor Web App",
    x: 11.62,
    y: 20.2,
    w: 1.8,
    h: 1.5,
  })
);
shapesXml.push(
  makeRectShape({
    x: 11.55,
    y: 22.0,
    w: 1.95,
    h: 4.8,
    fillHex: "F0F9FF",
    borderHex: "BAE6FD",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Portal Multipágina",
        pt: 13,
        bold: true,
        color: "0F172A",
        align: "ctr",
      },
      {
        text: "• Diorama 3D 7 cotas",
        pt: 12,
        color: "334155",
      },
      {
        text: "• Catálogo /expediciones",
        pt: 12,
        color: "334155",
      },
      {
        text: "• Portal /operadores RNT",
        pt: 12,
        color: "334155",
      },
    ],
  })
);

// Tarjeta Smartphone (Móvil / Pasaporte QR) abajo
shapesXml.push(
  makeRectShape({
    x: 11.5,
    y: 28.2,
    w: 2.05,
    h: 10.6,
    fillHex: "FFFFFF",
    borderHex: "065F46",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "Móvil / Pasaporte QR",
        pt: 15,
        bold: true,
        color: "065F46",
        align: "ctr",
      },
    ],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg2",
    name: "Icon Smartphone QR",
    x: 11.68,
    y: 29.2,
    w: 1.68,
    h: 1.85,
  })
);
shapesXml.push(
  makeRectShape({
    x: 11.55,
    y: 31.3,
    w: 1.95,
    h: 7.1,
    fillHex: "ECFDF5",
    borderHex: "A7F3D0",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Viajero en Sendero",
        pt: 13,
        bold: true,
        color: "065F46",
        align: "ctr",
      },
      {
        text: "• Billetera /mis-reservas",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• Código QR SVG 21x21",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• Control PNN / ICANH",
        pt: 12,
        color: "1E293B",
      },
    ],
  })
);

// Flechas dobles ↔ entre CLIENTE y COLUMNA CENTRAL
shapesXml.push(
  makeRectShape({
    x: 13.72,
    y: 20.6,
    w: 0.42,
    h: 0.7,
    fillHex: "0284C7",
    borderHex: "0284C7",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↔", pt: 20, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);
shapesXml.push(
  makeRectShape({
    x: 13.72,
    y: 30.2,
    w: 0.42,
    h: 0.7,
    fillHex: "065F46",
    borderHex: "065F46",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↔", pt: 20, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);

// --- COLUMNA CENTRAL DE SECCIÓN 6: 4 BLOQUES CONECTADOS CON FLECHAS VERTICALES ↓ (X = 14.18, W = 4.74 in) ---

// Bloque Central 1: CAPA DE PRESENTACIÓN (Frontend)
shapesXml.push(
  makeRectShape({
    x: 14.18,
    y: 18.35,
    w: 4.74,
    h: 4.65,
    fillHex: "FFFFFF",
    borderHex: "0284C7",
    borderPt: 2.5,
    round: true,
    paragraphs: [
      {
        text: "CAPA DE PRESENTACIÓN (Frontend)",
        pt: 16,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
      {
        text: "Next.js 14 App Router · TypeScript · Tailwind CSS (Light/Dark)",
        pt: 13,
        bold: true,
        color: "334155",
        align: "ctr",
      },
    ],
  })
);
// 3 Escudos/Logos a color: Next.js 14, TypeScript, Tailwind CSS
shapesXml.push(
  makePictureShape({ rId: "rIdImg3", name: "Logo Next.js 14", x: 14.48, y: 19.65, w: 1.22, h: 1.22 })
);
shapesXml.push(
  makePictureShape({ rId: "rIdImg4", name: "Logo TypeScript", x: 15.94, y: 19.65, w: 1.22, h: 1.22 })
);
shapesXml.push(
  makePictureShape({ rId: "rIdImg5", name: "Logo Tailwind CSS", x: 17.4, y: 19.65, w: 1.22, h: 1.22 })
);
shapesXml.push(
  makeRectShape({
    x: 14.32,
    y: 21.0,
    w: 4.46,
    h: 1.8,
    fillHex: "F0F9FF",
    borderHex: "BAE6FD",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Rutas: / · /expediciones · /baquiano · /pulso · /login · /mis-reservas · /operadores",
        pt: 12,
        bold: true,
        color: "0F172A",
        align: "ctr",
      },
      {
        text: "Diorama Topográfico 3D (preserve-3d) + Perfil Longitudinal + Accesibilidad WCAG AA",
        pt: 11,
        color: "334155",
        align: "ctr",
      },
    ],
  })
);

// Flecha Vertical ↓ 1->2
shapesXml.push(
  makeRectShape({
    x: 16.25,
    y: 23.06,
    w: 0.6,
    h: 0.48,
    fillHex: "065F46",
    borderHex: "065F46",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↓", pt: 18, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);

// Bloque Central 2: CAPA DE SERVICIOS (Lógica de Negocio)
shapesXml.push(
  makeRectShape({
    x: 14.18,
    y: 23.6,
    w: 4.74,
    h: 5.1,
    fillHex: "FFFFFF",
    borderHex: "16A34A",
    borderPt: 2.5,
    round: true,
    paragraphs: [
      {
        text: "CAPA DE SERVICIOS (Lógica de Negocio)",
        pt: 16,
        bold: true,
        color: "15803D",
        align: "ctr",
      },
      {
        text: "Node.js / API Gateway + Microservicios & JWT HS256",
        pt: 13,
        bold: true,
        color: "334155",
        align: "ctr",
      },
    ],
  })
);
// Logos gráficos de Node.js / API Gateway (hexágono verde) y Microservicios & JWT
shapesXml.push(
  makePictureShape({
    rId: "rIdImg6",
    name: "Logo Node.js API Gateway",
    x: 14.85,
    y: 24.85,
    w: 1.4,
    h: 1.32,
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg7",
    name: "Logo Microservicios y JWT",
    x: 16.85,
    y: 24.85,
    w: 1.32,
    h: 1.32,
  })
);
shapesXml.push(
  makeRectShape({
    x: 14.32,
    y: 26.3,
    w: 4.46,
    h: 2.22,
    fillHex: "F0FDF4",
    borderHex: "BBF7D0",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "• identidad-service (JWT HS256, BCrypt, RBAC RNT & RLS)",
        pt: 12,
        bold: true,
        color: "065F46",
      },
      {
        text: "• baquiano-ai (recomendacion-service) & pulso-service (indicadores)",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• reservas-service, oferta-service & auditoria-service",
        pt: 12,
        color: "1E293B",
      },
    ],
  })
);

// Flecha Vertical ↓ 2->3
shapesXml.push(
  makeRectShape({
    x: 16.25,
    y: 28.76,
    w: 0.6,
    h: 0.48,
    fillHex: "065F46",
    borderHex: "065F46",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↓", pt: 18, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);

// Bloque Central 3: CAPA DE PERSISTENCIA (Acceso a Datos)
shapesXml.push(
  makeRectShape({
    x: 14.18,
    y: 29.3,
    w: 4.74,
    h: 4.75,
    fillHex: "FFFFFF",
    borderHex: "0F766E",
    borderPt: 2.5,
    round: true,
    paragraphs: [
      {
        text: "CAPA DE PERSISTENCIA (Acceso a Datos)",
        pt: 16,
        bold: true,
        color: "0F766E",
        align: "ctr",
      },
      {
        text: "Transaccionalidad ACID + ORM / Integridad RNT & PNN",
        pt: 13,
        bold: true,
        color: "334155",
        align: "ctr",
      },
    ],
  })
);
// Logos gráficos de ACID y ORM / RNT
shapesXml.push(
  makePictureShape({
    rId: "rIdImg8",
    name: "Logo ACID",
    x: 14.9,
    y: 30.55,
    w: 1.32,
    h: 1.32,
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg9",
    name: "Logo ORM RNT",
    x: 16.85,
    y: 30.55,
    w: 1.32,
    h: 1.32,
  })
);
shapesXml.push(
  makeRectShape({
    x: 14.32,
    y: 31.98,
    w: 4.46,
    h: 1.9,
    fillHex: "F0FDFA",
    borderHex: "99F6E4",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "• Bloqueo Pesimista (SELECT ... FOR UPDATE) · Cero Sobreventa",
        pt: 12,
        bold: true,
        color: "0F766E",
      },
      {
        text: "• Regla Nominal Civil 1-a-1 (HTTP 422) y Titularidad RNT (HTTP 403)",
        pt: 12,
        color: "1E293B",
      },
    ],
  })
);

// Flecha Vertical ↓ 3->4
shapesXml.push(
  makeRectShape({
    x: 16.25,
    y: 34.11,
    w: 0.6,
    h: 0.48,
    fillHex: "0284C7",
    borderHex: "0284C7",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↓", pt: 18, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);

// Bloque Central 4: BASE DE DATOS PostgreSQL
shapesXml.push(
  makeRectShape({
    x: 14.18,
    y: 34.65,
    w: 4.74,
    h: 5.0,
    fillHex: "FFFFFF",
    borderHex: "0284C7",
    borderPt: 2.5,
    round: true,
    paragraphs: [
      {
        text: "BASE DE DATOS PostgreSQL",
        pt: 17,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
    ],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg10",
    name: "Icono Cilindro Base de Datos PostgreSQL 3D",
    x: 15.72,
    y: 35.4,
    w: 1.65,
    h: 1.5,
  })
);
shapesXml.push(
  makeRectShape({
    x: 14.32,
    y: 37.0,
    w: 4.46,
    h: 2.45,
    fillHex: "E0F2FE",
    borderHex: "7DD3FC",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Esquema Relacional Normalizado (3FN) + Auditoría Inmutable",
        pt: 12,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
      {
        text: "Tablas: usuarios_rnt, expediciones, salidas_programadas, reservas_acid, pasajeros_nominales, bitacora_auditoria",
        pt: 11,
        color: "0F172A",
        align: "ctr",
      },
    ],
  })
);

// Flechas dobles ↔ entre COLUMNA CENTRAL y SERVICIOS EXTERNOS
shapesXml.push(
  makeRectShape({
    x: 18.96,
    y: 21.8,
    w: 0.42,
    h: 0.7,
    fillHex: "0284C7",
    borderHex: "0284C7",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↔", pt: 20, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);
shapesXml.push(
  makeRectShape({
    x: 18.96,
    y: 30.8,
    w: 0.42,
    h: 0.7,
    fillHex: "EA580C",
    borderHex: "EA580C",
    borderPt: 0,
    round: true,
    paragraphs: [{ text: "↔", pt: 20, bold: true, color: "FFFFFF", align: "ctr", vAlign: "ctr" }],
  })
);

// --- COLUMNA DERECHA DE SECCIÓN 6: SERVICIOS EXTERNOS (X = 19.42, W = 2.35 in) ---
shapesXml.push(
  makeRectShape({
    x: 19.42,
    y: 18.35,
    w: 2.35,
    h: 21.3,
    fillHex: "F8FAFC",
    borderHex: "94A3B8",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "SERVICIOS EXTERNOS",
        pt: 15,
        bold: true,
        color: "0F172A",
        align: "ctr",
      },
    ],
  })
);

// Arriba: Nube Azul (API Clima IDEAM / DIMAR)
shapesXml.push(
  makeRectShape({
    x: 19.56,
    y: 19.3,
    w: 2.06,
    h: 8.6,
    fillHex: "FFFFFF",
    borderHex: "0284C7",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "API Clima IDEAM / DIMAR",
        pt: 14,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
    ],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg11",
    name: "Icono Nube Azul API Clima IDEAM DIMAR",
    x: 19.68,
    y: 20.35,
    w: 1.82,
    h: 1.35,
  })
);
shapesXml.push(
  makeRectShape({
    x: 19.62,
    y: 22.0,
    w: 1.94,
    h: 5.6,
    fillHex: "F0F9FF",
    borderHex: "BAE6FD",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Telemetría Ambiental",
        pt: 13,
        bold: true,
        color: "0369A1",
        align: "ctr",
      },
      {
        text: "• Oleaje Caribe (DIMAR)",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• Lluvias y Caudal Ríos",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• Alertas PNN Tayrona",
        pt: 12,
        color: "1E293B",
      },
    ],
  })
);

// Abajo: Sobre / Pasarela (Wompi Sandbox & Notificaciones)
shapesXml.push(
  makeRectShape({
    x: 19.56,
    y: 28.4,
    w: 2.06,
    h: 10.4,
    fillHex: "FFFFFF",
    borderHex: "EA580C",
    borderPt: 2,
    round: true,
    paragraphs: [
      {
        text: "Wompi Sandbox & Notificaciones",
        pt: 14,
        bold: true,
        color: "EA580C",
        align: "ctr",
      },
    ],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg12",
    name: "Icono Sobre Pasarela Wompi Sandbox",
    x: 19.68,
    y: 29.6,
    w: 1.82,
    h: 1.35,
  })
);
shapesXml.push(
  makeRectShape({
    x: 19.62,
    y: 31.3,
    w: 1.94,
    h: 7.1,
    fillHex: "FFF7ED",
    borderHex: "FED7AA",
    borderPt: 1,
    round: true,
    paragraphs: [
      {
        text: "Pasarela & Correo",
        pt: 13,
        bold: true,
        color: "9A3412",
        align: "ctr",
      },
      {
        text: "• Nequi Push Biométrico",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• PSE ACH & Tarjetas",
        pt: 12,
        color: "1E293B",
      },
      {
        text: "• Reverso Atómico 409",
        pt: 12,
        color: "1E293B",
      },
    ],
  })
);

// --- CAJA VERDE INFERIOR DE RESUMEN EN SECCIÓN 6 (Tecnologías y Arquitectura) ---
shapesXml.push(
  makeRectShape({
    x: 11.35,
    y: 39.9,
    w: 10.4,
    h: 4.9,
    fillHex: "065F46",
    borderHex: "FBBF24",
    borderPt: 2.5,
    round: true,
    paragraphs: [
      {
        text: "Tecnologías: Next.js 14 (App Router), TypeScript 5, Tailwind CSS (Modo Claro/Oscuro), Node.js / API Gateway, Microservicios REST (identidad-service, baquiano-ai, pulso-service, reservas-service, auditoria-service), JWT HS256 + BCrypt, PostgreSQL 16 (ACID), Wompi Sandbox & Wikimedia Commons API.",
        pt: 15,
        bold: true,
        color: "FFFFFF",
      },
      {
        text: "Arquitectura: Sistema Distribuido en 3 Capas + Microservicios con Aislamiento Row-Level Security (RLS), Bloqueo Pesimista de Cupos PNN, Reverso Transaccional Automático y Despliegue Cloud en Vercel.",
        pt: 15,
        bold: false,
        color: "FEF08A",
      },
    ],
  })
);

// ============================================================================
// COLUMNA DERECHA (X = 22.4, W = 9.9 in): SECCIONES 7, 8 Y 9
// ============================================================================

// SECCIÓN 7: PROTOTIPO FUNCIONAL (3 CAPTURAS ACTUALIZADAS + QR VERCEL)
shapesXml.push(
  makeSectionCard({
    x: 22.4,
    y: 4.8,
    w: 9.9,
    h: 19.6,
    title: "7. PROTOTIPO FUNCIONAL (TYRONA WILDS v2.2.2)",
    headerHex: "0284C7",
    bodyParagraphs: [],
  })
);

// Captura 1: Diorama 3D de 7 cotas y Perfil Longitudinal
shapesXml.push(
  makePictureShape({
    rId: "rIdImg13",
    name: "Captura 1 Diorama 3D 7 Cotas",
    x: 22.65,
    y: 5.8,
    w: 5.5,
    h: 3.22,
  })
);
shapesXml.push(
  makeRectShape({
    x: 28.25,
    y: 5.8,
    w: 3.8,
    h: 3.22,
    fillHex: "F0F9FF",
    borderHex: "BAE6FD",
    borderPt: 1.5,
    round: true,
    paragraphs: [
      {
        text: "1. Diorama Topográfico 3D (7 Cotas) + Vista Satelital 2D",
        pt: 15,
        bold: true,
        color: "0369A1",
      },
      {
        text: "Relieve piramidal Z (8px a 85px), ríos animados Don Diego y Buritaca, pines verticales sin solapamiento y Perfil Longitudinal (0m -> 3.100m MSNM).",
        pt: 13,
        color: "1E293B",
      },
    ],
  })
);

// Captura 2: Concierge Baquiano AI con fotos reales
shapesXml.push(
  makePictureShape({
    rId: "rIdImg14",
    name: "Captura 2 Baquiano AI Fotos Reales",
    x: 22.65,
    y: 9.25,
    w: 5.5,
    h: 3.22,
  })
);
shapesXml.push(
  makeRectShape({
    x: 28.25,
    y: 9.25,
    w: 3.8,
    h: 3.22,
    fillHex: "ECFDF5",
    borderHex: "A7F3D0",
    borderPt: 1.5,
    round: true,
    paragraphs: [
      {
        text: "2. Concierge Baquiano AI & Fotografías 100% Reales",
        pt: 15,
        bold: true,
        color: "065F46",
      },
      {
        text: "Fotografías verificadas de Wikimedia Commons (Cabo San Juan, Teyuna, Minca, Sierra Nevada, Río Don Diego y Taganga) y desvío hacia senderos serenos.",
        pt: 13,
        color: "1E293B",
      },
    ],
  })
);

// Captura 3: Reserva ACID y Checkout corregido
shapesXml.push(
  makePictureShape({
    rId: "rIdImg15",
    name: "Captura 3 Reserva ACID y Checkout Corregido",
    x: 22.65,
    y: 12.7,
    w: 5.5,
    h: 3.22,
  })
);
shapesXml.push(
  makeRectShape({
    x: 28.25,
    y: 12.7,
    w: 3.8,
    h: 3.22,
    fillHex: "FFF7ED",
    borderHex: "FED7AA",
    borderPt: 1.5,
    round: true,
    paragraphs: [
      {
        text: "3. Checkout ACID Corregido & Pasaporte QR Oficial",
        pt: 15,
        bold: true,
        color: "EA580C",
      },
      {
        text: "Contraste WCAG AA nítido en fechas programadas, titular JWT verificado, nómina de acompañantes, pago Wompi Sandbox y QR SVG.",
        pt: 13,
        color: "1E293B",
      },
    ],
  })
);

// Bloque QR hacia https://tyronawilds.vercel.app/
shapesXml.push(
  makeRectShape({
    x: 22.65,
    y: 16.15,
    w: 9.4,
    h: 7.95,
    fillHex: "0F172A",
    borderHex: "FBBF24",
    borderPt: 2.5,
    round: true,
    paragraphs: [],
  })
);
shapesXml.push(
  makePictureShape({
    rId: "rIdImg16",
    name: "QR TyronaWilds Vercel App",
    x: 22.95,
    y: 16.55,
    w: 3.3,
    h: 3.3,
  })
);
shapesXml.push(
  makeRectShape({
    x: 26.45,
    y: 16.45,
    w: 5.35,
    h: 7.3,
    fillHex: "0F172A",
    borderHex: "0F172A",
    borderPt: 0,
    round: false,
    paragraphs: [
      {
        text: "ESCANEA EL CÓDIGO QR — DEMO EN VIVO",
        pt: 18,
        bold: true,
        color: "FBBF24",
      },
      {
        text: "https://tyronawilds.vercel.app/",
        pt: 17,
        bold: true,
        color: "38BDF8",
      },
      {
        text: "• Explora el Diorama Topográfico 3D interactivo y la vista satelital 2D.",
        pt: 14,
        color: "F8FAFC",
      },
      {
        text: "• Prueba cuentas demo 1-clic en /login (Turista 1, Turista 2, Operadores RNT #77 y #41, Autoridad PNN).",
        pt: 14,
        color: "F8FAFC",
      },
      {
        text: "• Simula reservas ACID HTTP 201 y colisiones HTTP 409 con reverso Wompi en vivo.",
        pt: 14,
        color: "A7F3D0",
      },
    ],
  })
);

// SECCIÓN 8: VALIDACIÓN, MÉTRICAS Y RESULTADOS
shapesXml.push(
  makeSectionCard({
    x: 22.4,
    y: 24.7,
    w: 9.9,
    h: 10.2,
    title: "8. VALIDACIÓN TÉCNICA, MÉTRICAS Y RESULTADOS",
    headerHex: "EA580C",
    bodyParagraphs: [
      {
        text: "• Concurrencia y Transaccionalidad ACID (100% Efectividad): Pruebas de colisión sobre el último cupo disponible retornan HTTP 409 CONFLICT en < 45 ms y ejecutan reverso automático de preautorización en Wompi Sandbox ($0 COP debitados).",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Validación Nominal Civil PNN (HTTP 422): 100% de detección de documentos duplicados entre el titular y la nómina de acompañantes.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Seguridad RBAC & Propiedad RNT (HTTP 403): Bloqueo total de modificaciones cruzadas entre el Operador #41 y el catálogo del Operador #77.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Rendimiento y Compilación Next.js 14: 16 rutas compiladas con 0 errores de tipos, First Load JS optimizado y contraste visual validado en Modo Claro y Modo Oscuro.",
        pt: 15,
        bold: true,
        color: "065F46",
      },
    ],
  })
);

// SECCIÓN 9: CONCLUSIONES Y TRABAJO FUTURO
shapesXml.push(
  makeSectionCard({
    x: 22.4,
    y: 35.2,
    w: 9.9,
    h: 9.9,
    title: "9. CONCLUSIONES Y TRABAJO FUTURO",
    headerHex: "065F46",
    bodyParagraphs: [
      {
        text: "CONCLUSIONES:",
        pt: 17,
        bold: true,
        color: "065F46",
      },
      {
        text: "• Tyrona Wilds v2.2.2 demuestra que la ingeniería de software transaccional (ACID + RLS) combinada con visualización topográfica 3D e IA bioclimática permite desconcentrar el flujo turístico en Santa Marta y proteger ecosistemas vulnerables.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "TRABAJO FUTURO:",
        pt: 17,
        bold: true,
        color: "0284C7",
      },
      {
        text: "• Modo Offline PWA para validación criptográfica de pasaportes QR en cabañas de Teyuna sin cobertura celular.",
        pt: 15,
        color: "1E293B",
      },
      {
        text: "• Integración IoT LoRaWAN con sensores físicos de caudal en los ríos Don Diego, Buritaca y Guachaca.",
        pt: 15,
        color: "1E293B",
      },
    ],
  })
);

// PIE DE PÁGINA DEL PÓSTER
shapesXml.push(
  makeRectShape({
    x: 0.8,
    y: 45.35,
    w: 31.5,
    h: 0.9,
    fillHex: "0F172A",
    borderHex: "0F172A",
    borderPt: 0,
    round: true,
    paragraphs: [
      {
        text: "TYRONA WILDS™ v2.2.2 · SANTA MARTA D.T.C.H., COLOMBIA · REPOSITORIO OFICIAL: github.com/ImZew/tyronawilds · PRODUCCIÓN: https://tyronawilds.vercel.app/",
        pt: 16,
        bold: true,
        color: "F8FAFC",
        align: "ctr",
        vAlign: "ctr",
      },
    ],
  })
);

// Construcción de los archivos XML de OpenXML PowerPoint
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="${inch(33.1)}" cy="${inch(46.8)}"/>
  <p:notesSz cx="${inch(46.8)}" cy="${inch(33.1)}"/>
</p:presentation>`;

const presentationRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${shapesXml.join("\n")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

const slideRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  ${mediaFiles
    .map(
      (m) =>
        `<Relationship Id="${m.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${m.file}"/>`
    )
    .join("\n  ")}
</Relationships>`;

const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
             type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

const slideLayoutRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
</p:sldMaster>`;

const slideMasterRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TyronaWildsTheme">
  <a:themeElements>
    <a:clrScheme name="TyronaWilds">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1>
      <a:lt1><a:srgbClr val="FAF8F5"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="F3EFE6"/></a:lt2>
      <a:accent1><a:srgbClr val="065F46"/></a:accent1>
      <a:accent2><a:srgbClr val="EA580C"/></a:accent2>
      <a:accent3><a:srgbClr val="0284C7"/></a:accent3>
      <a:accent4><a:srgbClr val="0D9488"/></a:accent4>
      <a:accent5><a:srgbClr val="FBBF24"/></a:accent5>
      <a:accent6><a:srgbClr val="15803D"/></a:accent6>
      <a:hlink><a:srgbClr val="0284C7"/></a:hlink>
      <a:folHlink><a:srgbClr val="065F46"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="TyronaWildsFonts">
      <a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="TyronaWildsFmt">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

const zipEntries = [
  { name: "[Content_Types].xml", data: contentTypesXml },
  { name: "_rels/.rels", data: rootRelsXml },
  { name: "ppt/presentation.xml", data: presentationXml },
  { name: "ppt/_rels/presentation.xml.rels", data: presentationRelsXml },
  { name: "ppt/slides/slide1.xml", data: slideXml },
  { name: "ppt/slides/_rels/slide1.xml.rels", data: slideRelsXml },
  { name: "ppt/slideLayouts/slideLayout1.xml", data: slideLayoutXml },
  { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: slideLayoutRelsXml },
  { name: "ppt/slideMasters/slideMaster1.xml", data: slideMasterXml },
  { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: slideMasterRelsXml },
  { name: "ppt/theme/theme1.xml", data: themeXml },
  ...mediaFiles.map((m) => ({
    name: `ppt/media/${m.file}`,
    data: fs.readFileSync(path.join(ASSETS_DIR, m.file)),
  })),
];

const pptxBuffer = createZipBuffer(zipEntries);
fs.writeFileSync(PPTX_PATH, pptxBuffer);
console.log(
  `Poster PPTX generado exitosamente: ${PPTX_PATH} (${pptxBuffer.length} bytes, ${mediaFiles.length} imagenes incrustadas)`
);
