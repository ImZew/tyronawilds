"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Eye,
  Globe,
  LogOut,
  Menu,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Idioma,
  SesionAutenticada,
  cerrarSesion,
  consultarMisReservas,
  obtenerSesionActual,
} from "@/lib/api";

interface NavbarProps {
  idioma?: Idioma;
  onCambiarIdioma?: (nuevo: Idioma) => void;
  altoContraste?: boolean;
  onCambiarAltoContraste?: (nuevo: boolean) => void;
  varianteFlotante?: boolean;
}

export default function Navbar({
  idioma = "es",
  onCambiarIdioma,
  altoContraste = false,
  onCambiarAltoContraste,
  varianteFlotante = false,
}: NavbarProps) {
  const pathname = usePathname();
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);
  const [misReservasCount, setMisReservasCount] = useState<number>(0);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState<boolean>(false);

  const sincronizarSesionYReservas = useCallback(async () => {
    const actual = obtenerSesionActual();
    setSesion(actual);
    if (!actual || actual.rol !== "TURISTA") {
      setMisReservasCount(0);
      return;
    }
    const res = await consultarMisReservas();
    setMisReservasCount(res.data.length);
  }, []);

  useEffect(() => {
    sincronizarSesionYReservas();
    window.addEventListener(
      "tyronawilds-auth-change",
      sincronizarSesionYReservas
    );
    window.addEventListener(
      "tyronawilds-reservas-change",
      sincronizarSesionYReservas
    );
    return () => {
      window.removeEventListener(
        "tyronawilds-auth-change",
        sincronizarSesionYReservas
      );
      window.removeEventListener(
        "tyronawilds-reservas-change",
        sincronizarSesionYReservas
      );
    };
  }, [sincronizarSesionYReservas]);

  const enlacesPrincipales = [
    {
      href: "/",
      etiquetaEs: "Inicio",
      etiquetaEn: "Home",
    },
    {
      href: "/expediciones",
      etiquetaEs: "Expediciones",
      etiquetaEn: "Expeditions",
    },
    {
      href: "/baquiano",
      etiquetaEs: "Baquiano AI",
      etiquetaEn: "Baquiano AI",
    },
    {
      href: "/pulso",
      etiquetaEs: "Pulso del Territorio",
      etiquetaEn: "Territorial Pulse",
    },
  ];

  const esRutaActiva = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={`${
        varianteFlotante
          ? "relative z-50 w-full"
          : "sticky top-0 z-50 border-b border-white/10 bg-obsidian/85 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        {/* IZQUIERDA: MARCA TYRONAWILDS™ + INDICADOR DE SANTA MARTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-sand transition-colors hover:text-terracotta"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md group-hover:border-terracotta/60">
              <Compass className="h-4 w-4 text-terracotta" />
            </span>
            <span className="font-display text-xl sm:text-2xl tracking-[0.14em] text-white">
              TYRONAWILDS<span className="text-terracotta">™</span>
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-sand/85 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SANTA MARTA · SIERRA NEVADA &amp; CARIBE</span>
          </div>
        </div>

        {/* CENTRO: PÍLDORA FLOTANTE GLASSMORPHISM */}
        <nav
          aria-label="Navegación Principal Multipágina"
          className="hidden lg:flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        >
          {enlacesPrincipales.map((item) => {
            const activo = esRutaActiva(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  activo
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {idioma === "es" ? item.etiquetaEs : item.etiquetaEn}
              </Link>
            );
          })}

          {/* CONDICIONAL POR ROL DE SESIÓN */}
          {sesion && sesion.rol === "TURISTA" && (
            <Link
              href="/mis-reservas"
              className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                esRutaActiva("/mis-reservas")
                  ? "bg-emerald-400 text-black"
                  : "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>
                {idioma === "es" ? "Mis Reservas" : "My Passports"} (
                {misReservasCount})
              </span>
            </Link>
          )}

          {sesion &&
            (sesion.rol === "OPERADOR" || sesion.rol === "ADMIN_AMBIENTAL") && (
              <Link
                href="/operadores"
                className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  esRutaActiva("/operadores")
                    ? "bg-terracotta text-white"
                    : "border border-terracotta/50 bg-terracotta/20 text-white hover:bg-terracotta"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {idioma === "es" ? "Portal Operadores" : "Operator Portal"}
                </span>
              </Link>
            )}
        </nav>

        {/* DERECHA: ACCIONES DE SESIÓN + CONTROLES DE IDIOMA/LECTURA */}
        <div className="flex items-center gap-2.5">
          {sesion ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  sesion.rol === "TURISTA" ? "/mis-reservas" : "/operadores"
                }
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:border-terracotta transition-colors"
                title={
                  sesion.rol === "TURISTA"
                    ? "Ver mis reservas y pasaportes QR"
                    : "Abrir Portal Operadores"
                }
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="max-w-[140px] truncate">{sesion.nombre}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  cerrarSesion();
                  setSesion(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md hover:border-terracotta hover:text-terracotta transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{idioma === "es" ? "Salir" : "Logout"}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors px-2 py-1"
              >
                {idioma === "es" ? "Iniciar sesión" : "Sign in"}
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-full bg-white text-black font-semibold text-xs sm:text-sm px-5 py-2 shadow-md hover:bg-sand transition-colors"
              >
                {idioma === "es" ? "Regístrate" : "Sign up"}
              </Link>
            </div>
          )}

          {onCambiarIdioma && (
            <button
              type="button"
              onClick={() => onCambiarIdioma(idioma === "es" ? "en" : "es")}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-[11px] uppercase text-white/90 backdrop-blur-md hover:border-terracotta transition-colors"
              title="Cambiar idioma ES / EN"
            >
              <Globe className="h-3.5 w-3.5 text-terracotta" />
              <span>{idioma.toUpperCase()}</span>
            </button>
          )}

          {onCambiarAltoContraste && (
            <button
              type="button"
              onClick={() => onCambiarAltoContraste(!altoContraste)}
              className={`hidden md:inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase backdrop-blur-md transition-colors ${
                altoContraste
                  ? "border-white bg-white text-black font-bold"
                  : "border-white/15 bg-white/10 text-white/85 hover:border-terracotta"
              }`}
              title="Modo de alto contraste WCAG"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Botón Menú Móvil */}
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="inline-flex lg:hidden items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md"
            aria-label="Abrir menú de navegación"
          >
            {menuMovilAbierto ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {menuMovilAbierto && (
        <div className="lg:hidden border-t border-white/15 bg-obsidian/95 px-4 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            {enlacesPrincipales.map((item) => {
              const activo = esRutaActiva(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                    activo
                      ? "bg-white text-black font-semibold"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {idioma === "es" ? item.etiquetaEs : item.etiquetaEn}
                </Link>
              );
            })}

            {sesion && sesion.rol === "TURISTA" && (
              <Link
                href="/mis-reservas"
                onClick={() => setMenuMovilAbierto(false)}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-200"
              >
                Mis Reservas ({misReservasCount})
              </Link>
            )}

            {sesion &&
              (sesion.rol === "OPERADOR" ||
                sesion.rol === "ADMIN_AMBIENTAL") && (
                <Link
                  href="/operadores"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="rounded-xl border border-terracotta/50 bg-terracotta/20 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Portal Operadores
                </Link>
              )}
          </div>
        </div>
      )}
    </header>
  );
}
