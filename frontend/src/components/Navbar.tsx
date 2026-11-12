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
      etiquetaEs: "Destinos",
      etiquetaEn: "Destinations",
    },
    {
      href: "/baquiano",
      etiquetaEs: "Asistente IA",
      etiquetaEn: "AI Concierge",
    },
    {
      href: "/pulso",
      etiquetaEs: "Estado del Parque",
      etiquetaEn: "Park Status",
    },
    {
      href: "/mis-reservas",
      etiquetaEs:
        misReservasCount > 0
          ? `Mis Reservas (${misReservasCount})`
          : "Mis Reservas",
      etiquetaEn:
        misReservasCount > 0
          ? `My Bookings (${misReservasCount})`
          : "My Bookings",
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
          : "sticky top-0 z-50 border-b border-white/10 bg-[#26211D]/85 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        {/* IZQUIERDA: MARCA LIMPIA Y ORGÁNICA */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
            <Compass className="h-4 w-4 text-[#C89D66]" />
          </span>
          <span className="text-lg sm:text-xl font-semibold tracking-[0.14em] text-white">
            TYRONAWILDS
          </span>
        </Link>

        {/* CENTRO: PÍLDORA FLOTANTE ULTRALIGERA */}
        <nav
          aria-label="Navegación Principal"
          className="hidden lg:flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
        >
          {enlacesPrincipales.map((item) => {
            const activo = esRutaActiva(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  activo
                    ? "bg-white text-[#1C1917] font-semibold shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {idioma === "es" ? item.etiquetaEs : item.etiquetaEn}
              </Link>
            );
          })}

          {sesion &&
            (sesion.rol === "OPERADOR" || sesion.rol === "ADMIN_AMBIENTAL") && (
              <Link
                href="/operadores"
                className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  esRutaActiva("/operadores")
                    ? "bg-[#C89D66] text-[#1C1917]"
                    : "border border-[#C89D66]/50 bg-[#C89D66]/20 text-white hover:bg-[#C89D66] hover:text-[#1C1917]"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {idioma === "es" ? "Portal Operadores" : "Operators"}
                </span>
              </Link>
            )}
        </nav>

        {/* DERECHA: SESIÓN E IDIOMA */}
        <div className="flex items-center gap-2.5">
          {sesion ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  sesion.rol === "TURISTA" ? "/mis-reservas" : "/operadores"
                }
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/15 transition-colors"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/85 backdrop-blur-md hover:bg-white/15 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {idioma === "es" ? "Salir" : "Sign out"}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors px-3 py-1.5"
              >
                {idioma === "es" ? "Iniciar sesión" : "Sign in"}
              </Link>
              <Link
                href="/expediciones"
                className="rounded-full bg-white text-[#1C1917] font-semibold text-xs sm:text-sm px-5 py-2 shadow-sm hover:bg-[#F5F2EB] transition-colors"
              >
                {idioma === "es" ? "Explorar" : "Explore"}
              </Link>
            </div>
          )}

          {onCambiarIdioma && (
            <button
              type="button"
              onClick={() => onCambiarIdioma(idioma === "es" ? "en" : "es")}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-md hover:bg-white/15 transition-colors"
              title="Idioma / Language"
            >
              <Globe className="h-3.5 w-3.5 text-[#C89D66]" />
              <span>{idioma.toUpperCase()}</span>
            </button>
          )}

          {onCambiarAltoContraste && (
            <button
              type="button"
              onClick={() => onCambiarAltoContraste(!altoContraste)}
              className={`hidden md:inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs backdrop-blur-md transition-colors ${
                altoContraste
                  ? "border-white bg-white text-[#1C1917] font-semibold"
                  : "border-white/15 bg-white/10 text-white/85 hover:bg-white/15"
              }`}
              title="Alto contraste"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="inline-flex lg:hidden items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md"
            aria-label="Abrir menú"
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
        <div className="lg:hidden border-t border-white/15 bg-[#26211D]/95 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-1.5">
            {enlacesPrincipales.map((item) => {
              const activo = esRutaActiva(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
                    activo
                      ? "bg-white text-[#1C1917] font-semibold"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {idioma === "es" ? item.etiquetaEs : item.etiquetaEn}
                </Link>
              );
            })}

            {sesion &&
              (sesion.rol === "OPERADOR" ||
                sesion.rol === "ADMIN_AMBIENTAL") && (
                <Link
                  href="/operadores"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="rounded-xl border border-[#C89D66]/50 bg-[#C89D66]/20 px-4 py-2.5 text-sm font-semibold text-white"
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
