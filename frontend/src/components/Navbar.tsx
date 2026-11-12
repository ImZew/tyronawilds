"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  Globe,
  LogOut,
  Menu,
  ShieldCheck,
  User,
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
}: NavbarProps) {
  const pathname = usePathname();
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);
  const [misReservasCount, setMisReservasCount] = useState<number>(0);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      etiquetaEs: "Pulso Territorial",
      etiquetaEn: "Territory Pulse",
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

  const esHome = pathname === "/";
  const modoCristalHero = esHome && !scrolled;

  return (
    <header
      className={`${
        esHome ? "fixed top-0 inset-x-0" : "sticky top-0"
      } z-50 w-full transition-all duration-300 ${
        modoCristalHero
          ? "bg-gradient-to-b from-black/65 via-black/30 to-transparent border-b border-white/15 text-white"
          : "bg-[#FAF8F5]/95 backdrop-blur-xl border-b border-[#0F172A]/10 text-[#0F172A] shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        {/* IZQUIERDA: ISOTIPO VECTORIAL ESMERALDA + MARCA TYRONA WILDS */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#065F46] shadow-md ring-1 ring-[#FBBF24]/60">
            <svg
              viewBox="0 0 64 64"
              className="h-7 w-7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="46" cy="16" r="5" fill="#FBBF24" />
              <path
                d="M8 42L23 17L35 33L43 22L56 42H8Z"
                fill="#FFFFFF"
                fillOpacity="0.18"
              />
              <path
                d="M9 41L23 17L35 32L43 22L55 41"
                stroke="#FFFFFF"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 24L23 17L27 24"
                stroke="#FBBF24"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 48C15 44 21 51 28 48C35 44 41 51 48 48C52 46 54 47 56 48"
                stroke="#FBBF24"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="flex flex-col">
            <span
              className={`text-base sm:text-lg font-extrabold tracking-tight leading-none ${
                modoCristalHero ? "text-white" : "text-[#0F172A]"
              }`}
            >
              TYRONA WILDS
            </span>
            <span
              className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                modoCristalHero ? "text-[#FBBF24]" : "text-[#065F46]"
              }`}
            >
              Santa Marta · Caribe
            </span>
          </div>
        </Link>

        {/* CENTRO: PÍLDORA DE NAVEGACIÓN PRINCIPAL */}
        <nav
          aria-label="Navegación Principal"
          className={`hidden lg:flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-all ${
            modoCristalHero
              ? "bg-white/12 backdrop-blur-md border border-white/20"
              : "bg-[#F3EFE6] border border-[#0F172A]/10"
          }`}
        >
          {enlacesPrincipales.map((item) => {
            const activo = esRutaActiva(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  activo
                    ? "bg-[#065F46] text-white shadow-sm"
                    : modoCristalHero
                    ? "text-white/90 hover:bg-white/15 hover:text-white"
                    : "text-[#0F172A]/80 hover:bg-white hover:text-[#0F172A]"
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
                className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                  esRutaActiva("/operadores")
                    ? "bg-[#EA580C] text-white"
                    : "border border-[#EA580C]/60 bg-[#EA580C]/15 text-[#EA580C] hover:bg-[#EA580C] hover:text-white"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {idioma === "es" ? "Portal Operadores" : "Operators"}
                </span>
              </Link>
            )}
        </nav>

        {/* DERECHA: INICIAR SESIÓN, IDIOMA Y ACCESIBILIDAD */}
        <div className="flex items-center gap-2.5">
          {sesion ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  sesion.rol === "TURISTA" ? "/mis-reservas" : "/operadores"
                }
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  modoCristalHero
                    ? "border-white/25 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
                    : "border-[#065F46]/25 bg-[#065F46]/10 text-[#065F46] hover:bg-[#065F46]/15"
                }`}
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
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  modoCristalHero
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-[#0F172A]/15 bg-white text-[#0F172A] hover:bg-[#F3EFE6]"
                }`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {idioma === "es" ? "Salir" : "Sign out"}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#EA580C] hover:bg-[#D97706] text-white font-bold text-xs sm:text-sm px-5 py-2.5 shadow-md transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>{idioma === "es" ? "Iniciar Sesión" : "Sign In"}</span>
              </Link>
            </div>
          )}

          {onCambiarIdioma && (
            <button
              type="button"
              onClick={() => onCambiarIdioma(idioma === "es" ? "en" : "es")}
              className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                modoCristalHero
                  ? "border-white/20 bg-white/12 text-white backdrop-blur-md hover:bg-white/20"
                  : "border-[#0F172A]/15 bg-white text-[#0F172A] hover:bg-[#F3EFE6]"
              }`}
              title="Idioma / Language"
            >
              <Globe className="h-3.5 w-3.5 text-[#0D9488]" />
              <span>{idioma.toUpperCase()}</span>
            </button>
          )}

          {onCambiarAltoContraste && (
            <button
              type="button"
              onClick={() => onCambiarAltoContraste(!altoContraste)}
              className={`hidden md:inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs transition-colors ${
                altoContraste
                  ? "border-[#065F46] bg-[#065F46] text-white font-bold"
                  : modoCristalHero
                  ? "border-white/20 bg-white/12 text-white hover:bg-white/20"
                  : "border-[#0F172A]/15 bg-white text-[#0F172A] hover:bg-[#F3EFE6]"
              }`}
              title="Alto contraste"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className={`inline-flex lg:hidden items-center justify-center rounded-full border p-2 ${
              modoCristalHero
                ? "border-white/25 bg-white/15 text-white backdrop-blur-md"
                : "border-[#0F172A]/15 bg-white text-[#0F172A]"
            }`}
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
        <div className="lg:hidden border-t border-[#0F172A]/10 bg-[#FAF8F5] px-5 py-4 text-[#0F172A] shadow-xl">
          <div className="flex flex-col gap-1.5">
            {enlacesPrincipales.map((item) => {
              const activo = esRutaActiva(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    activo
                      ? "bg-[#065F46] text-white"
                      : "text-[#0F172A] hover:bg-[#F3EFE6]"
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
                  className="rounded-xl bg-[#EA580C] px-4 py-2.5 text-sm font-bold text-white"
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
