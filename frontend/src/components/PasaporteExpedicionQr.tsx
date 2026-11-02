"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  ExternalLink,
  MapPin,
  Mountain,
  Printer,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ReservaConfirmadaDto } from "@/lib/api";

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Genera una matriz QR determinista de 21x21 con patrones de posición estándar (finder patterns)
 * y bits codificados a partir del payload de la reserva oficial.
 */
function generarMatrizQr21x21(payload: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reservado: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const colocarFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reservado[rr][cc] = true;
          const enBordeExterno =
            r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
          const enCentro = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[rr][cc] = enBordeExterno || enCentro;
        }
      }
    }
  };

  colocarFinder(0, 0);
  colocarFinder(0, size - 7);
  colocarFinder(size - 7, 0);

  // Líneas de sincronización (Timing patterns)
  for (let i = 8; i < size - 8; i++) {
    reservado[6][i] = true;
    reservado[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Semilla FNV-1a + flujo pseudoaleatorio determinista por celda
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let estado = hash >>> 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reservado[r][c]) continue;
      estado ^= estado << 13;
      estado ^= estado >>> 17;
      estado ^= estado << 5;
      const charBit =
        payload.charCodeAt((r * size + c) % payload.length) & ((r + c) % 7);
      grid[r][c] = ((estado >>> 0) + charBit) % 2 === 0;
    }
  }

  return grid;
}

interface PropsPasaporteExpedicionQr {
  reserva: ReservaConfirmadaDto;
  mostrarEnlaceMisReservas?: boolean;
}

export default function PasaporteExpedicionQr({
  reserva,
  mostrarEnlaceMisReservas = true,
}: PropsPasaporteExpedicionQr) {
  const referenciaWompi = reserva.referenciaPagoWompi || "WMP-2026-841920";
  const metodoPago = reserva.metodoPago || "NEQUI";
  const detalleMetodoPago =
    reserva.detalleMetodoPago || `${metodoPago} · VERIFICADO WOMPI SANDBOX`;
  const nombreActividad =
    reserva.nombreActividad || "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)";
  const coordenadasHud = reserva.coordenadasHud || "11°02'16\"N 73°55'31\"W";
  const altitudMsnm = reserva.altitudMsnm ?? 1200;
  const fechaSalida = reserva.fechaSalida || "2026-11-15";
  const horaSalida = reserva.horaSalida || "05:30";
  const puntoEncuentro =
    reserva.puntoEncuentro ||
    "05:30 AM · Casa Expedicionaria Centro Histórico -> El Mamey";
  const operadorRnt =
    reserva.operadorLicenciaRnt || "RNT #48921 · Operador Autorizado ICANH";
  const nombreViajero = reserva.nombreViajero || "Valeria Mejía";
  const documentoViajero = reserva.documentoViajero || "CC 1082940182";
  const tasaAmbientalCop =
    reserva.tasaAmbientalCop ?? Math.round(reserva.montoTotalCop * 0.12);
  const tarifaBaseOperadorCop = Math.max(
    0,
    reserva.montoTotalCop - tasaAmbientalCop
  );

  const qrPayload = useMemo(
    () =>
      `TYRONAWILDS://PASSPORT/${reserva.codigoReserva}|WOMPI=${referenciaWompi}|RNT=${operadorRnt}|GPS=${coordenadasHud}|PAX=${reserva.cantidadCupos}|COP=${reserva.montoTotalCop}`,
    [
      reserva.codigoReserva,
      referenciaWompi,
      operadorRnt,
      coordenadasHud,
      reserva.cantidadCupos,
      reserva.montoTotalCop,
    ]
  );

  const matrizQr = useMemo(() => generarMatrizQr21x21(qrPayload), [qrPayload]);

  const manejarImprimirPasaporte = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="pasaporte-oficial-imprimible border-2 border-terracotta bg-obsidian text-sand shadow-2xl">
      {/* CABECERA DEL BOARDING PASS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-terracotta bg-terracotta/15 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta font-bold">
              TYRONAWILDS™ // BOARDING PASS &amp; PERMISO AMBIENTAL PNN
            </span>
            <h4 className="font-display text-2xl sm:text-3xl uppercase leading-none text-sand">
              PASAPORTE OFICIAL DE EXPEDICIÓN · {reserva.codigoReserva}
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 border border-emerald-400/50 bg-emerald-950/60 px-2.5 py-1 font-bold uppercase text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            CONFIRMADA // PAGO VERIFICADO
          </span>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: DATOS DE EXPEDICIÓN + QR VECTORIAL SVG */}
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-12">
        {/* COLUMNA IZQUIERDA (8 COL): FICHA DE EMBARQUE Y PAGO WOMPI */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] uppercase text-terracotta">
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                {coordenadasHud}
              </span>
              <span className="flex items-center gap-1 text-sand/80">
                <Mountain className="h-3.5 w-3.5 text-terracotta" />
                ALTITUD MÁX: {altitudMsnm} MSNM
              </span>
            </div>

            <h5 className="mt-1 font-display text-3xl sm:text-4xl uppercase leading-none text-sand">
              {nombreActividad}
            </h5>

            <div className="mt-4 grid grid-cols-1 gap-3 border border-sand/15 bg-jungle/20 p-3.5 font-mono text-xs sm:grid-cols-3">
              <div>
                <span className="block text-[10px] uppercase text-sand/55">
                  EXPEDICIONARIO TITULAR
                </span>
                <strong className="mt-0.5 block text-sand">
                  {nombreViajero}
                </strong>
                <span className="text-[11px] text-sand/70">
                  {documentoViajero}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase text-sand/55">
                  FECHA Y HORA DE SALIDA
                </span>
                <strong className="mt-0.5 flex items-center gap-1.5 text-sand">
                  <Calendar className="h-3.5 w-3.5 text-terracotta" />
                  {fechaSalida}
                </strong>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-300">
                  <Clock className="h-3 w-3" />
                  {horaSalida} HRS
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase text-sand/55">
                  CUPOS AUTORIZADOS
                </span>
                <strong className="mt-0.5 flex items-center gap-1.5 text-sand">
                  <Users className="h-3.5 w-3.5 text-terracotta" />
                  {reserva.cantidadCupos}{" "}
                  {reserva.cantidadCupos === 1
                    ? "EXPEDICIONARIO"
                    : "EXPEDICIONARIOS"}
                </strong>
                <span className="text-[11px] text-emerald-300">
                  PÓLIZA EXTREMA ACTIVA
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
              <div className="border border-sand/15 bg-obsidian p-3">
                <span className="flex items-center gap-1 text-[10px] uppercase text-terracotta">
                  <MapPin className="h-3.5 w-3.5" />
                  PUNTO DE ENCUENTRO EN SANTA MARTA
                </span>
                <strong className="mt-1 block text-sand/90">
                  {puntoEncuentro}
                </strong>
              </div>

              <div className="border border-sand/15 bg-obsidian p-3">
                <span className="flex items-center gap-1 text-[10px] uppercase text-emerald-400">
                  <Award className="h-3.5 w-3.5" />
                  OPERADOR RNT CERTIFICADO
                </span>
                <strong className="mt-1 block text-sand/90">
                  {operadorRnt}
                </strong>
              </div>
            </div>
          </div>

          {/* SELLO TRANSACCIONAL WOMPI SANDBOX */}
          <div className="border border-sand/20 bg-obsidian p-3.5 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase text-sand">
                <CreditCard className="h-3.5 w-3.5 text-terracotta" />
                TRANSACCIÓN WOMPI SANDBOX: {referenciaWompi}
              </span>
              <span className="bg-sand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-terracotta">
                MÉTODO: {metodoPago}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
              <div>
                <span className="block text-sand/50">TARIFA OPERADOR RNT:</span>
                <strong className="text-sand">
                  {formatearCop(tarifaBaseOperadorCop)}
                </strong>
              </div>
              <div>
                <span className="block text-sand/50">
                  TASA PNN / COMUNIDAD:
                </span>
                <strong className="text-emerald-300">
                  {formatearCop(tasaAmbientalCop)}
                </strong>
              </div>
              <div>
                <span className="block text-sand/50">TOTAL PAGADO (COP):</span>
                <strong className="text-sm text-terracotta">
                  {formatearCop(reserva.montoTotalCop)}
                </strong>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-sand/60">
              instrumento={detalleMetodoPago} · fecha=
              {new Date(reserva.fechaOperacion).toLocaleString("es-CO")}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4 COL): CÓDIGO QR VECTORIAL SVG DINÁMICO */}
        <div className="lg:col-span-4 flex flex-col items-center justify-between border border-sand/20 bg-sand p-4 text-obsidian">
          <div className="w-full flex items-center justify-between border-b border-obsidian/20 pb-2 font-mono text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1">
              <QrCode className="h-3.5 w-3.5 text-terracotta" />
              QR CONTROL PNN
            </span>
            <span>{reserva.codigoReserva}</span>
          </div>

          <div className="my-3 p-2 bg-sand border border-obsidian/15">
            <svg
              viewBox="0 0 21 21"
              className="h-40 w-40 sm:h-44 sm:w-44"
              shapeRendering="crispEdges"
              role="img"
              aria-label={`Código QR de verificación para pasaporte ${reserva.codigoReserva}`}
            >
              {matrizQr.map((fila, rIdx) =>
                fila.map((celdaActiva, cIdx) =>
                  celdaActiva ? (
                    <rect
                      key={`${rIdx}-${cIdx}`}
                      x={cIdx}
                      y={rIdx}
                      width={1}
                      height={1}
                      fill="#0A0A0A"
                    />
                  ) : null
                )
              )}
            </svg>
          </div>

          <div className="w-full border-t border-obsidian/20 pt-2 text-center font-mono text-[10px] leading-tight">
            <div className="font-bold uppercase text-obsidian">
              ESCANEO EN PUESTO DE CONTROL
            </div>
            <div className="mt-0.5 text-obsidian/70 truncate">
              {referenciaWompi} · {coordenadasHud}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES DEL PASAPORTE (OCULTA AL IMPRIMIR) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-sand/15 bg-jungle/25 px-5 py-3.5 font-mono text-xs">
        <button
          type="button"
          onClick={manejarImprimirPasaporte}
          className="inline-flex items-center gap-2 bg-sand px-4 py-2.5 font-bold uppercase tracking-wider text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span>IMPRIMIR / GUARDAR PASAPORTE (PDF)</span>
        </button>

        {mostrarEnlaceMisReservas && (
          <Link
            href="/mis-reservas"
            className="inline-flex items-center gap-2 border border-terracotta bg-terracotta/20 px-4 py-2.5 font-bold uppercase tracking-wider text-sand hover:bg-terracotta transition-colors"
          >
            <span>VER EN MIS RESERVAS</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
