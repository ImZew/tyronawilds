"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import {
  iniciarSesion,
  registrarUsuario,
  obtenerSesionActual,
  cerrarSesion,
  type RolAutenticado,
  type SesionAutenticada,
} from "@/lib/api";

interface PerfilEvaluacion {
  id: string;
  categoria: "B2C_TURISTA" | "B2B_CORPORATIVO";
  titulo: string;
  subtitulo: string;
  email: string;
  password: string;
  rnt: string;
  rolBadge: string;
}

const PERFILES_VIAJEROS_B2C: PerfilEvaluacion[] = [
  {
    id: "TURISTA_1",
    categoria: "B2C_TURISTA",
    titulo: "Turista 1 — Sebastián Abaonza (Cuenta Limpia)",
    subtitulo:
      "Inicia con 0 reservas por defecto · Ideal para demostrar reserva y pasaporte QR en vivo",
    email: "sebastian@viajero.co",
    password: "Viajero2026*",
    rnt: "CC 1083019450 · ID #101",
    rolBadge: "TURISTA (0 RESERVAS)",
  },
  {
    id: "TURISTA_2",
    categoria: "B2C_TURISTA",
    titulo: "Turista 2 — Valeria Mejía (Con Reserva Activa)",
    subtitulo:
      "Titular exclusiva del pasaporte TW-2026-901A (Ciudad Perdida) · Prueba de Aislamiento RLS",
    email: "valeria@viajera.co",
    password: "Valeria2026*",
    rnt: "CC 1082940182 · ID #102",
    rolBadge: "TURISTA (1 RESERVA)",
  },
];

const PERFILES_CORPORATIVOS_B2B: PerfilEvaluacion[] = [
  {
    id: "OP_77",
    categoria: "B2B_CORPORATIVO",
    titulo: "Operador Titular (#77)",
    subtitulo: "Expediciones Tayrona & Sierra · Propietario legítimo del catálogo base",
    email: "operaciones@tayronasierra.co",
    password: "Tayrona2026*",
    rnt: "RNT-48291",
    rolBadge: "OPERADOR TITULAR #77",
  },
  {
    id: "OP_41",
    categoria: "B2B_CORPORATIVO",
    titulo: "Operador Externo (#41)",
    subtitulo: "Operador Caribe · Tercero sin titularidad sobre los servicios #77",
    email: "gerencia@operadorcaribe.co",
    password: "Caribe2026*",
    rnt: "RNT-51904",
    rolBadge: "OPERADOR EXTERNO #41",
  },
  {
    id: "PNN_ADMIN",
    categoria: "B2B_CORPORATIVO",
    titulo: "Autoridad Ambiental (PNN)",
    subtitulo: "Monitoreo de Capacidad de Carga Ecosistémica y Auditoría Distrital",
    email: "monitoreo@parquesnacionales.gov.co",
    password: "Ambiental2026*",
    rnt: "PNN-GOV-SM",
    rolBadge: "ADMIN AMBIENTAL",
  },
];

function LoginContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const tabParam = searchParams.get("tab");

  const [pestana, setPestana] = useState<"LOGIN" | "REGISTRO">(
    tabParam === "register" ? "REGISTRO" : "LOGIN"
  );
  const [sesionActiva, setSesionActiva] = useState<SesionAutenticada | null>(
    null
  );

  useEffect(() => {
    if (tabParam === "register") {
      setPestana("REGISTRO");
      setRolReg("TURISTA");
    } else if (tabParam === "login") {
      setPestana("LOGIN");
    }
  }, [tabParam]);

  // Estado formulario Iniciar Sesión
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  const [mostrarPasswordLogin, setMostrarPasswordLogin] = useState(false);

  // Estado formulario Registro
  const [nombreReg, setNombreReg] = useState("");
  const [emailReg, setEmailReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [mostrarPasswordReg, setMostrarPasswordReg] = useState(false);
  const [rolReg, setRolReg] = useState<RolAutenticado>("OPERADOR");
  const [rntReg, setRntReg] = useState("RNT-64120");
  const [aceptaTerminosReg, setAceptaTerminosReg] = useState(true);

  // Estado UI & Errores
  const [procesando, setProcesando] = useState(false);
  const [errorHttpStatus, setErrorHttpStatus] = useState<number | null>(null);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [acordeonEvaluacionAbierto, setAcordeonEvaluacionAbierto] =
    useState(false);
  const [perfilAutocompletado, setPerfilAutocompletado] = useState<
    string | null
  >(null);

  useEffect(() => {
    setSesionActiva(obtenerSesionActual());
  }, []);

  const limpiarErrores = () => {
    setErrorHttpStatus(null);
    setErrorCodigo(null);
    setErrorMensaje(null);
  };

  const esEmailValido = (correo: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

  const manejarAutocompletarPerfil = (perfil: PerfilEvaluacion) => {
    setPestana("LOGIN");
    setEmailLogin(perfil.email);
    setPasswordLogin(perfil.password);
    setPerfilAutocompletado(perfil.titulo);
    limpiarErrores();
  };

  const manejarSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarErrores();

    if (!esEmailValido(emailLogin)) {
      setErrorHttpStatus(400);
      setErrorCodigo("FORMATO_CORREO_INVALIDO");
      setErrorMensaje(
        "Ingresa una dirección de correo electrónico corporativo o personal válida."
      );
      return;
    }

    if (passwordLogin.trim().length < 6) {
      setErrorHttpStatus(400);
      setErrorCodigo("PASSWORD_REQUERIDO");
      setErrorMensaje(
        "La contraseña debe contener al menos 6 caracteres para validar la firma."
      );
      return;
    }

    setProcesando(true);
    const respuesta = await iniciarSesion({
      email: emailLogin,
      password: passwordLogin,
    });
    setProcesando(false);

    if (!respuesta.exito || !respuesta.sesion) {
      setErrorHttpStatus(respuesta.httpStatus || 401);
      setErrorCodigo(respuesta.errorCodigo || "CREDENCIALES_INVALIDAS");
      setErrorMensaje(
        respuesta.errorMensaje ||
          "HTTP 401 UNAUTHORIZED — CREDENCIALES_INVALIDAS: Verifica tu correo y contraseña."
      );
      return;
    }

    setSesionActiva(respuesta.sesion);
    const destino =
      redirectParam ||
      (respuesta.sesion.rol === "TURISTA" ? "/" : "/operadores");
    router.push(destino);
  };

  const manejarSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarErrores();

    if (nombreReg.trim().length < 4) {
      setErrorHttpStatus(400);
      setErrorCodigo("NOMBRE_INVALIDO");
      setErrorMensaje(
        "Ingresa el nombre completo del titular o razón social del operador (mínimo 4 caracteres)."
      );
      return;
    }

    if (!esEmailValido(emailReg)) {
      setErrorHttpStatus(400);
      setErrorCodigo("FORMATO_CORREO_INVALIDO");
      setErrorMensaje("Ingresa un correo electrónico válido para el registro.");
      return;
    }

    if (passwordReg.length < 8) {
      setErrorHttpStatus(400);
      setErrorCodigo("PASSWORD_DEBIL");
      setErrorMensaje(
        "La contraseña debe tener mínimo 8 caracteres para cifrado BCrypt en identidad-service."
      );
      return;
    }

    if (rolReg === "OPERADOR" && rntReg.trim().length < 5) {
      setErrorHttpStatus(400);
      setErrorCodigo("RNT_REQUERIDO");
      setErrorMensaje(
        "Para cuentas de Operador Turístico es obligatorio indicar el código de Registro Nacional de Turismo (ej. RNT-64120)."
      );
      return;
    }

    if (!aceptaTerminosReg) {
      setErrorHttpStatus(400);
      setErrorCodigo("HABEAS_DATA_REQUERIDO");
      setErrorMensaje(
        "Debes autorizar el tratamiento de datos personales conforme a la Ley 1581 de 2012."
      );
      return;
    }

    setProcesando(true);
    const respuesta = await registrarUsuario({
      nombre: nombreReg,
      email: emailReg,
      password: passwordReg,
      rol: rolReg,
      rnt: rolReg === "OPERADOR" ? rntReg : undefined,
    });
    setProcesando(false);

    if (!respuesta.exito || !respuesta.sesion) {
      setErrorHttpStatus(respuesta.httpStatus || 409);
      setErrorCodigo(respuesta.errorCodigo || "ERROR_REGISTRO");
      setErrorMensaje(
        respuesta.errorMensaje || "No fue posible completar el registro."
      );
      return;
    }

    setSesionActiva(respuesta.sesion);
    const destino =
      redirectParam ||
      (respuesta.sesion.rol === "TURISTA" ? "/" : "/operadores");
    router.push(destino);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#EA580C] selection:text-white transition-colors">
      {/* NAVBAR PRINCIPAL UNIFICADO */}
      <Navbar />

      {/* CUERPO CENTRAL AMIGABLE Y CÁLIDO */}
      <main className="mx-auto my-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* COLUMNA IZQUIERDA: BIENVENIDA CÁLIDA PARA VIAJEROS Y ANFITRIONES */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C22] p-6 sm:p-8 shadow-lg">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#065F46]/10 dark:bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#065F46] dark:text-emerald-400">
                <Compass className="h-3.5 w-3.5" />
                <span>Pasaporte de Viajero &amp; Portal de Anfitriones</span>
              </div>

              <h1 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl uppercase leading-tight tracking-tight text-slate-900 dark:text-white">
                Bienvenido a Tyrona Wilds · Santa Marta
              </h1>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Accede a tus reservas confirmadas, descarga tu pasaporte QR de
                ingreso a senderos del Parque Tayrona y la Sierra Nevada, o
                gestiona tus cupos si eres guía u operador certificado con
                Registro Nacional de Turismo (RNT).
              </p>

              <div className="mt-6 space-y-4 border-t border-slate-200 dark:border-slate-800 pt-5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#065F46]/10 dark:bg-emerald-500/20 text-[#065F46] dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                      Pasaporte QR y Reservas Protegidas
                    </strong>
                    Consulta tus itinerarios hacia Ciudad Perdida, Cabo San Juan
                    o Minca con verificación directa de guías locales.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EA580C]/10 dark:bg-amber-500/20 text-[#EA580C] dark:text-amber-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                      Operadores RNT y Autoridad Ambiental
                    </strong>
                    Administración verificada de cupos diarios, tarifas y
                    monitoreo de capacidad de carga ecosistémica.
                  </div>
                </div>
              </div>
            </div>

            {sesionActiva && (
              <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold uppercase text-[#065F46] dark:text-emerald-300">
                    Sesión activa en este dispositivo
                  </span>
                  <span className="rounded-full bg-[#065F46] px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {sesionActiva.rol}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                  {sesionActiva.nombre}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {sesionActiva.email}{" "}
                  {sesionActiva.rnt ? `· ${sesionActiva.rnt}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={
                      sesionActiva.rol === "TURISTA"
                        ? "/mis-reservas"
                        : "/operadores"
                    }
                    className="rounded-full bg-[#065F46] px-4 py-2 text-[11px] font-bold uppercase text-white hover:bg-[#047857] transition-colors shadow-sm"
                  >
                    {sesionActiva.rol === "TURISTA"
                      ? "Ir a Mis Reservas"
                      : "Ir al Portal de Operadores"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      cerrarSesion();
                      setSesionActiva(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-200 hover:border-[#EA580C] hover:text-[#EA580C] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: TARJETA REDONDEADA DE INICIO DE SESIÓN / REGISTRO */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131C22] p-6 sm:p-8 shadow-xl">
            {redirectParam && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3.5 text-xs font-medium text-amber-950 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#EA580C] dark:text-amber-400" />
                <span>
                  {redirectParam === "/mis-reservas"
                    ? "Para consultar tus pasaportes QR y reservas confirmadas (/mis-reservas), inicia sesión con tu cuenta de Viajero."
                    : redirectParam === "/operadores"
                    ? "Para acceder al Portal de Operadores (/operadores), inicia sesión con tu cuenta RNT o Autoridad Ambiental."
                    : `Inicia sesión para continuar hacia ${redirectParam}.`}
                </span>
              </div>
            )}

            {/* PESTAÑAS AMIGABLES REDONDEADAS */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-900 p-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setPestana("LOGIN");
                  limpiarErrores();
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 transition-all ${
                  pestana === "LOGIN"
                    ? "bg-[#EA580C] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Iniciar sesión</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPestana("REGISTRO");
                  limpiarErrores();
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 transition-all ${
                  pestana === "REGISTRO"
                    ? "bg-[#EA580C] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Crear cuenta</span>
              </button>
            </div>

            {/* BANNER DE ERROR CLARO Y LEGIBLE */}
            {errorMensaje && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-xs text-red-950 dark:text-red-200"
              >
                <div className="flex items-center justify-between gap-2 font-extrabold text-red-700 dark:text-red-300">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      No pudimos iniciar sesión ({errorCodigo || `HTTP ${errorHttpStatus || 401}`})
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 leading-relaxed">{errorMensaje}</p>
              </div>
            )}

            {pestana === "LOGIN" ? (
              <form
                onSubmit={manejarSubmitLogin}
                className="mt-6 space-y-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="login-email"
                    className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <span>Correo electrónico *</span>
                    {emailLogin && (
                      <span
                        className={
                          esEmailValido(emailLogin)
                            ? "text-[#065F46] dark:text-emerald-400"
                            : "text-[#EA580C] dark:text-amber-400"
                        }
                      >
                        {esEmailValido(emailLogin)
                          ? "Correo válido"
                          : "Formato incompleto"}
                      </span>
                    )}
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={emailLogin}
                      onChange={(e) => {
                        setEmailLogin(e.target.value);
                        setPerfilAutocompletado(null);
                      }}
                      placeholder="sebastian@viajero.co"
                      className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#EA580C] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <span>Contraseña *</span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      Conexión segura
                    </span>
                  </label>
                  <div className="relative mt-1.5">
                    <KeyRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={mostrarPasswordLogin ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={passwordLogin}
                      onChange={(e) => {
                        setPasswordLogin(e.target.value);
                        setPerfilAutocompletado(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-11 pr-12 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#EA580C] focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPasswordLogin(!mostrarPasswordLogin)
                      }
                      className="absolute right-3.5 top-2.5 p-1 text-slate-500 dark:text-slate-400 hover:text-[#EA580C] transition-colors"
                      title={
                        mostrarPasswordLogin
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {mostrarPasswordLogin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {perfilAutocompletado && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs text-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#065F46] dark:text-emerald-400" />
                    <span>
                      Perfil seleccionado:{" "}
                      <strong>{perfilAutocompletado}</strong>. Haz clic en{" "}
                      <strong>Ingresar a mi cuenta</strong> para continuar.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#EA580C] py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-[#C2410C] transition-all shadow-md disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {procesando
                      ? "Iniciando sesión..."
                      : "Ingresar a mi cuenta"}
                  </span>
                </button>
              </form>
            ) : (
              <form
                onSubmit={manejarSubmitRegistro}
                className="mt-6 space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Nombre completo o agencia *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreReg}
                      onChange={(e) => setNombreReg(e.target.value)}
                      placeholder="Ej. Camila Restrepo / Sierra Eco Tours"
                      className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailReg}
                      onChange={(e) => setEmailReg(e.target.value)}
                      placeholder="camila@viajera.co"
                      className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Tipo de perfil *
                    </label>
                    <select
                      value={rolReg}
                      onChange={(e) =>
                        setRolReg(e.target.value as RolAutenticado)
                      }
                      className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#EA580C] focus:outline-none"
                    >
                      <option value="TURISTA">
                        Viajero / Expedicionario (Turista)
                      </option>
                      <option value="OPERADOR">
                        Operador Turístico Certificado (RNT)
                      </option>
                    </select>
                  </div>

                  {rolReg === "OPERADOR" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Licencia RNT (MINCIT) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rntReg}
                        onChange={(e) => setRntReg(e.target.value)}
                        placeholder="RNT-64120"
                        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 uppercase focus:border-[#EA580C] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Beneficio incluido
                      </label>
                      <div className="mt-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-[#065F46] dark:text-emerald-400">
                        Pasaporte Digital QR de Conservación
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Contraseña (mínimo 8 caracteres) *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={mostrarPasswordReg ? "text" : "password"}
                      required
                      value={passwordReg}
                      onChange={(e) => setPasswordReg(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 pr-12 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-[#EA580C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPasswordReg(!mostrarPasswordReg)}
                      className="absolute right-3.5 top-2.5 p-1 text-slate-500 hover:text-[#EA580C]"
                    >
                      {mostrarPasswordReg ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaTerminosReg}
                    onChange={(e) => setAceptaTerminosReg(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#EA580C]"
                  />
                  <span>
                    Autorizo el tratamiento de datos personales conforme a la{" "}
                    <Link
                      href="/privacidad"
                      className="font-semibold underline text-[#EA580C] dark:text-amber-400"
                    >
                      Ley 1581 de 2012
                    </Link>{" "}
                    y acepto los{" "}
                    <Link
                      href="/terminos"
                      className="font-semibold underline text-[#EA580C] dark:text-amber-400"
                    >
                      Términos RNT &amp; PNN
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#065F46] py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-[#047857] transition-all shadow-md disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {procesando
                      ? "Creando tu cuenta..."
                      : "Crear mi cuenta ahora"}
                  </span>
                </button>
              </form>
            )}

            {/* ACORDEÓN AMIGABLE: CUENTAS DEMO DE PRUEBA RÁPIDA */}
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-5">
              <button
                type="button"
                onClick={() =>
                  setAcordeonEvaluacionAbierto(!acordeonEvaluacionAbierto)
                }
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#EA580C] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#EA580C]" />
                  <span>
                    Cuentas de prueba rápida (Autocompletar con 1 clic)
                  </span>
                </span>
                {acordeonEvaluacionAbierto ? (
                  <ChevronUp className="h-4 w-4 text-[#EA580C]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {acordeonEvaluacionAbierto && (
                <div className="mt-3 space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-4">
                  {/* GRUPO 1: PERFILES DE VIAJEROS (B2C) */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 text-[11px] font-extrabold uppercase text-[#065F46] dark:text-emerald-400">
                      <span>Viajeros (Mis Reservas &amp; Checkout)</span>
                      <span>Pasaporte QR</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {PERFILES_VIAJEROS_B2C.map((perfil) => (
                        <button
                          key={perfil.id}
                          type="button"
                          onClick={() => manejarAutocompletarPerfil(perfil)}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 p-3.5 text-left transition-all hover:border-[#065F46] dark:hover:border-emerald-400 shadow-sm"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#065F46] dark:group-hover:text-emerald-400">
                                {perfil.titulo}
                              </span>
                              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {perfil.rnt}
                              </span>
                              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-[#065F46] dark:text-emerald-300">
                                {perfil.rolBadge}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                              {perfil.subtitulo}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-[#065F46] dark:text-emerald-400">
                              {perfil.email}{" "}
                              <span className="text-slate-400">/</span>{" "}
                              {perfil.password}
                            </p>
                          </div>

                          <span className="shrink-0 self-start sm:self-center rounded-full bg-[#065F46]/10 dark:bg-emerald-500/20 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#065F46] dark:text-emerald-300 group-hover:bg-[#065F46] group-hover:text-white transition-colors">
                            Usar cuenta
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GRUPO 2: PERFILES CORPORATIVOS RNT / AMBIENTAL (B2B) */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 text-[11px] font-extrabold uppercase text-[#EA580C] dark:text-amber-400">
                      <span>Operadores RNT &amp; Autoridad Ambiental</span>
                      <span>Portal Operadores</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {PERFILES_CORPORATIVOS_B2B.map((perfil) => (
                        <button
                          key={perfil.id}
                          type="button"
                          onClick={() => manejarAutocompletarPerfil(perfil)}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition-all hover:border-[#EA580C] shadow-sm"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#EA580C] dark:group-hover:text-amber-400">
                                {perfil.titulo}
                              </span>
                              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {perfil.rnt}
                              </span>
                              <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-[#EA580C] dark:text-amber-300">
                                {perfil.rolBadge}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                              {perfil.subtitulo}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-[#065F46] dark:text-emerald-400">
                              {perfil.email}{" "}
                              <span className="text-slate-400">/</span>{" "}
                              {perfil.password}
                            </p>
                          </div>

                          <span className="shrink-0 self-start sm:self-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 group-hover:bg-[#EA580C] group-hover:text-white transition-colors">
                            Usar operador
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-4 py-6 font-mono text-xs text-slate-600 dark:text-slate-300">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 sm:px-6">
          <span>
            <strong className="text-slate-900 dark:text-white">
              TYRONAWILDS™
            </strong>{" "}
            · SANTA MARTA D.T.C.H., COLOMBIA
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/privacidad"
              className="hover:text-[#EA580C] dark:hover:text-amber-400"
            >
              Privacidad (Ley 1581)
            </Link>
            <Link
              href="/terminos"
              className="hover:text-[#EA580C] dark:hover:text-amber-400"
            >
              Términos RNT
            </Link>
            <Link
              href="/lab"
              className="hover:text-[#EA580C] dark:hover:text-amber-400"
            >
              System Status / Lab
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold uppercase tracking-widest">
          Cargando acceso a Tyrona Wilds...
        </div>
      }
    >
      <LoginContenido />
    </Suspense>
  );
}
