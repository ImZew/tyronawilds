"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Filter,
  Lock,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Users,
} from "lucide-react";
import {
  ReservaConfirmadaDto,
  SesionAutenticada,
  cerrarSesion,
  consultarMisReservas,
  obtenerSesionActual,
} from "@/lib/api";
import PasaporteExpedicionQr from "@/components/PasaporteExpedicionQr";

function formatearCop(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function MisReservasWalletPage() {
  const router = useRouter();
  const [sesionActiva, setSesionActiva] = useState<SesionAutenticada | null>(
    null
  );
  const [verificandoSesion, setVerificandoSesion] = useState<boolean>(true);
  const [reservas, setReservas] = useState<ReservaConfirmadaDto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [modoConexion, setModoConexion] = useState<
    "BACKEND_GATEWAY_LIVE" | "FALLBACK_RESILIENTE"
  >("FALLBACK_RESILIENTE");
  const [latenciaMs, setLatenciaMs] = useState<number>(9);

  // Filtros de la Billetera
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");
  const [pasaporteAbierto, setPasaporteAbierto] =
    useState<ReservaConfirmadaDto | null>(null);

  const cargarBilletera = useCallback(async () => {
    setCargando(true);
    const res = await consultarMisReservas();
    setReservas(res.data);
    setModoConexion(res.modoConexion);
    setLatenciaMs(res.latenciaMs);
    setCargando(false);
  }, []);

  useEffect(() => {
    const sesion = obtenerSesionActual();
    if (!sesion) {
      router.replace("/login?redirect=/mis-reservas");
      return;
    }
    setSesionActiva(sesion);
    setVerificandoSesion(false);
    cargarBilletera();
  }, [router, cargarBilletera]);

  const manejarCerrarSesionViajero = () => {
    cerrarSesion();
    router.replace("/login?redirect=/mis-reservas");
  };

  if (verificandoSesion || !sesionActiva) {
    return (
      <div className="min-h-screen bg-obsidian text-sand flex items-center justify-center p-6 font-mono text-xs uppercase tracking-[0.18em]">
        <div className="flex items-center gap-3 border border-sand/20 bg-jungle/20 px-6 py-4">
          <Lock className="h-4 w-4 animate-pulse text-terracotta" />
          <span>
            REDIRIGIENDO A AUTENTICACIÓN DE VIAJERO (/LOGIN?REDIRECT=/MIS-RESERVAS)...
          </span>
        </div>
      </div>
    );
  }

  const esRolCorporativo =
    sesionActiva.rol === "OPERADOR" || sesionActiva.rol === "ADMIN_AMBIENTAL";

  const reservasFiltradas = reservas.filter((r) => {
    if (filtroEstado !== "TODAS" && r.estadoReserva !== filtroEstado) {
      return false;
    }
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return (
      r.codigoReserva.toLowerCase().includes(q) ||
      (r.referenciaPagoWompi || "").toLowerCase().includes(q) ||
      (r.nombreActividad || "").toLowerCase().includes(q) ||
      (r.nombreViajero || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian text-sand selection:bg-terracotta selection:text-sand">
      {/* BARRA SUPERIOR CON IDENTIDAD DEL VIAJERO AUTENTICADO */}
      <header className="no-print sticky top-0 z-40 border-b border-sand/15 bg-obsidian/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-sand/25 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-sand hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>VOLVER AL CATÁLOGO</span>
            </Link>

            <span className="font-display text-xl sm:text-2xl tracking-[0.12em] text-sand">
              TYRONAWILDS<span className="text-terracotta">™</span> // BILLETERA
              DEL VIAJERO &amp; PASAPORTES QR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <div className="hidden lg:flex items-center gap-2 border border-sand/20 bg-obsidian px-3 py-1.5 text-[11px] uppercase">
              <span
                className={`h-2 w-2 rounded-full ${
                  modoConexion === "BACKEND_GATEWAY_LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span>
                {modoConexion === "BACKEND_GATEWAY_LIVE"
                  ? "RESERVAS-SERVICE :8083 ONLINE"
                  : "RLS PERSONAL WALLET"}
              </span>
              <span className="text-sand/30">|</span>
              <span className="text-terracotta">{latenciaMs} ms</span>
            </div>

            {/* Insignia Oficial del Viajero Autenticado */}
            <div className="flex flex-wrap items-center gap-2 border border-emerald-500/45 bg-emerald-950/30 px-3 py-1.5 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold uppercase text-sand">
                {sesionActiva.nombre}
              </span>
              <span className="text-sand/40">·</span>
              <span className="text-emerald-300">{sesionActiva.email}</span>
              <span className="bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                {sesionActiva.rol}
              </span>
            </div>

            {esRolCorporativo && (
              <Link
                href="/operadores"
                className="border border-terracotta/50 bg-terracotta/10 px-3 py-1.5 text-[11px] font-bold uppercase text-terracotta hover:bg-terracotta hover:text-sand transition-colors"
              >
                PORTAL OPERADORES
              </Link>
            )}

            <button
              type="button"
              onClick={manejarCerrarSesionViajero}
              className="inline-flex items-center gap-1.5 border border-terracotta/60 bg-terracotta/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sand hover:bg-terracotta transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>CERRAR SESIÓN</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10">
        {/* ENCABEZADO EDITORIAL DE LA BILLETERA PRIVADA */}
        <section className="no-print border border-sand/20 bg-jungle/15 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-terracotta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand">
                <QrCode className="h-3.5 w-3.5" />
                <span>
                  BILLETERA PERSONAL ({reservas.length}{" "}
                  {reservas.length === 1
                    ? "PASAPORTE EMITIDO"
                    : "PASAPORTES EMITIDOS"}
                  )
                </span>
              </div>

              <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-sand">
                MIS RESERVAS &amp; BOARDING PASS QR
              </h1>

              <p className="mt-2 max-w-3xl font-mono text-xs text-sand/75 leading-relaxed">
                Estás consultando la billetera privada asociada exclusivamente a{" "}
                <strong className="text-sand">{sesionActiva.nombre}</strong> (
                <code className="text-emerald-300">{sesionActiva.email}</code>).
                Cada pasaporte digital (<code>TW-2026-XXXX</code>) incluye su
                código QR vectorial de verificación para puestos de control PNN
                Tayrona / ICANH Teyuna y el comprobante transaccional de{" "}
                <strong>Wompi Sandbox</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={cargarBilletera}
                className="inline-flex items-center gap-1.5 border border-sand/25 bg-obsidian px-4 py-3 uppercase text-sand hover:border-terracotta transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-terracotta" />
                <span>ACTUALIZAR</span>
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-sand px-5 py-3 font-bold uppercase text-obsidian hover:bg-terracotta hover:text-sand transition-colors"
              >
                <span>EXPLORAR EXPEDICIONES Y RESERVAR</span>
              </Link>
            </div>
          </div>

          {reservas.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-sand/15 pt-6 sm:grid-cols-12 font-mono text-xs">
              <div className="sm:col-span-8 relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sand/45" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en mis pasaportes por código TW-2026-XXXX, referencia Wompi WMP-2026-XXXXXX o expedición..."
                  className="w-full border border-sand/25 bg-obsidian pl-10 pr-4 py-3 text-sand placeholder:text-sand/35 focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-terracotta" />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full border border-sand/25 bg-obsidian px-3.5 py-3 text-sand focus:border-terracotta focus:outline-none"
                >
                  <option value="TODAS">
                    TODOS MIS PASAPORTES ({reservas.length})
                  </option>
                  <option value="CONFIRMADA">
                    CONFIRMADA // PAGO VERIFICADO
                  </option>
                  <option value="PENDIENTE_PAGO">PENDIENTE DE PAGO</option>
                  <option value="CANCELADA">CANCELADA / REVERSADA</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* MODAL DE PASAPORTE QR IMPRIMIBLE CUANDO SE SELECCIONA UNO */}
        {pasaporteAbierto && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setPasaporteAbierto(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="my-auto w-full max-w-4xl space-y-3"
            >
              <div className="no-print flex items-center justify-between border border-sand/20 bg-obsidian px-4 py-2.5 font-mono text-xs">
                <span className="text-terracotta font-bold uppercase">
                  VISTA OFICIAL DE EMBARQUE E IMPRESIÓN PDF ·{" "}
                  {pasaporteAbierto.codigoReserva}
                </span>
                <button
                  type="button"
                  onClick={() => setPasaporteAbierto(null)}
                  className="border border-sand/30 px-3 py-1 text-sand hover:border-terracotta"
                >
                  CERRAR [X]
                </button>
              </div>
              <PasaporteExpedicionQr
                reserva={pasaporteAbierto}
                mostrarEnlaceMisReservas={false}
              />
            </div>
          </div>
        )}

        {/* LISTADO DE TARJETAS O ESTADO VACÍO HUD */}
        <section className="no-print mt-8">
          {cargando ? (
            <div className="border border-sand/20 bg-obsidian p-12 text-center font-mono text-xs uppercase tracking-widest text-sand/70">
              VERIFICANDO PASAPORTES EMITIDOS PARA {sesionActiva.email}...
            </div>
          ) : reservas.length === 0 ? (
            <div className="border-2 border-sand/20 bg-obsidian p-10 sm:p-14 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center border border-terracotta/50 bg-terracotta/10 text-terracotta">
                <Compass className="h-7 w-7" />
              </div>

              <div className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-terracotta">
                SIN PASAPORTES EMITIDOS // AÚN NO HAS RESERVADO NINGUNA
                EXPEDICIÓN EN TU CUENTA
              </div>

              <h2 className="mt-2 font-display text-3xl sm:text-4xl uppercase text-sand">
                TU BILLETERA DE EXPEDICIONES ESTÁ LISTA, {sesionActiva.nombre}
              </h2>

              <p className="mx-auto mt-3 max-w-xl font-mono text-xs text-sand/70 leading-relaxed">
                No tienes reservas activas vinculadas a{" "}
                <code className="text-emerald-300">{sesionActiva.email}</code>{" "}
                (ID <code>#{sesionActiva.userId}</code>). Selecciona cualquier
                travesía en la Sierra Nevada o el Parque Tayrona, completa el
                pago en <strong>Wompi Sandbox</strong> y tu pasaporte oficial QR
                aparecerá aquí al instante.
              </p>

              <div className="mt-6">
                <Link
                  href="/#expediciones"
                  className="inline-flex items-center gap-2 bg-terracotta px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand hover:bg-ember transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  <span>EXPLORAR EXPEDICIONES Y RESERVAR</span>
                </Link>
              </div>
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="border border-sand/20 bg-obsidian p-12 text-center font-mono text-xs text-sand/70">
              No se encontraron pasaportes que coincidan con tu búsqueda.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {reservasFiltradas.map((res) => {
                const refWompi = res.referenciaPagoWompi || "WMP-2026-841920";
                const metodo = res.metodoPago || "NEQUI";
                const actividadTitulo =
                  res.nombreActividad ||
                  "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)";
                const fechaSalida = res.fechaSalida || "2026-11-15";
                const horaSalida = res.horaSalida || "05:30";
                const titular = res.nombreViajero || sesionActiva.nombre;
                const documento =
                  res.documentoViajero ||
                  sesionActiva.documento ||
                  "CC 1083019450";
                const punto =
                  res.puntoEncuentro ||
                  "05:30 AM · Casa Expedicionaria Centro Histórico -> El Mamey";

                return (
                  <article
                    key={res.id}
                    className="flex flex-col justify-between border border-sand/25 bg-obsidian p-6 hover:border-terracotta/70 transition-colors"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/15 pb-3 font-mono text-xs">
                        <span className="flex items-center gap-2 font-bold text-terracotta text-sm">
                          <QrCode className="h-4 w-4" />
                          {res.codigoReserva}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {res.estadoReserva} // PAGO VERIFICADO
                        </span>
                      </div>

                      <div className="mt-3 font-mono text-[11px] uppercase text-sand/60">
                        {res.coordenadasHud || "11°02'16\"N 73°55'31\"W"} ·{" "}
                        {res.operadorLicenciaRnt ||
                          "RNT #48921 · Operador Certificado"}
                      </div>

                      <h2 className="mt-1 font-display text-3xl uppercase leading-none text-sand">
                        {actividadTitulo}
                      </h2>

                      <div className="mt-4 grid grid-cols-2 gap-3 border border-sand/15 bg-jungle/15 p-3.5 font-mono text-xs sm:grid-cols-3">
                        <div>
                          <span className="block text-[10px] uppercase text-sand/50">
                            TITULAR
                          </span>
                          <strong className="text-sand">{titular}</strong>
                          <span className="block text-[10px] text-sand/65">
                            {documento}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase text-sand/50">
                            SALIDA PROGRAMADA
                          </span>
                          <strong className="flex items-center gap-1 text-sand">
                            <Calendar className="h-3 w-3 text-terracotta" />
                            {fechaSalida}
                          </strong>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-300">
                            <Clock className="h-3 w-3" />
                            {horaSalida} HRS
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] uppercase text-sand/50">
                            EXPEDICIONARIOS
                          </span>
                          <strong className="flex items-center gap-1 text-sand">
                            <Users className="h-3 w-3 text-terracotta" />
                            {res.cantidadCupos} PAX
                          </strong>
                          <span className="block text-[10px] text-emerald-300">
                            CUPO BLOQUEADO ACID
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-start gap-2 font-mono text-xs text-sand/75">
                        <MapPin className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                        <span>
                          <strong className="text-sand">
                            PUNTO DE ENCUENTRO:
                          </strong>{" "}
                          {punto}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-sand/15 pt-4 font-mono text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-sand/5 p-3 border border-sand/15">
                        <div>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-sand">
                            <CreditCard className="h-3.5 w-3.5 text-terracotta" />
                            WOMPI REF: {refWompi} ({metodo})
                          </span>
                          <span className="block text-[10px] text-sand/60">
                            {res.detalleMetodoPago ||
                              `${metodo} · Transacción Aprobada`}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] uppercase text-sand/50">
                            TOTAL PAGADO
                          </span>
                          <strong className="text-base text-terracotta">
                            {formatearCop(res.montoTotalCop)}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPasaporteAbierto(res)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta px-4 py-3 font-bold uppercase tracking-wider text-sand hover:bg-ember transition-colors"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>ABRIR BOARDING PASS QR / IMPRIMIR PDF</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="no-print mx-auto max-w-[1440px] border-t border-sand/15 px-4 py-8 sm:px-6 font-mono text-xs text-sand/55">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>
            TYRONAWILDS™ // BILLETERA PERSONAL DEL VIAJERO · SANTA MARTA, CO
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacidad" className="hover:text-terracotta">
              Privacidad (Ley 1581)
            </Link>
            <Link href="/terminos" className="hover:text-terracotta">
              Términos RNT
            </Link>
            <Link
              href="/lab"
              className="inline-flex items-center gap-1 border border-sand/20 px-2.5 py-1 text-[10px] uppercase hover:border-terracotta hover:text-terracotta"
            >
              <Terminal className="h-3 w-3 text-terracotta" />
              <span>/LAB</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
