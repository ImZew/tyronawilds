"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Terminal,
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
  titulo: string;
  subtitulo: string;
  email: string;
  password: string;
  rnt: string;
  rolBadge: string;
}

const PERFILES_EVALUACION: PerfilEvaluacion[] = [
  {
    id: "OP_77",
    titulo: "Operador Titular (#77)",
    subtitulo: "Expediciones Tayrona & Sierra · Propietario legítimo del catálogo base",
    email: "operaciones@tayronasierra.co",
    password: "Tayrona2026*",
    rnt: "RNT-48291",
    rolBadge: "OPERADOR TITULAR #77",
  },
  {
    id: "OP_41",
    titulo: "Operador Externo (#41)",
    subtitulo: "Operador Caribe · Tercero sin titularidad sobre los servicios #77",
    email: "gerencia@operadorcaribe.co",
    password: "Caribe2026*",
    rnt: "RNT-51904",
    rolBadge: "OPERADOR EXTERNO #41",
  },
  {
    id: "PNN_ADMIN",
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

  const [pestana, setPestana] = useState<"LOGIN" | "REGISTRO">("LOGIN");
  const [sesionActiva, setSesionActiva] = useState<SesionAutenticada | null>(
    null
  );

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
    <div className="min-h-screen bg-obsidian text-sand flex flex-col justify-between selection:bg-terracotta selection:text-sand">
      {/* BARRA SUPERIOR */}
      <header className="border-b border-sand/15 bg-obsidian/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border border-sand/20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-sand/75 hover:border-terracotta hover:text-terracotta transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>VOLVER A EXPEDICIONES</span>
            </Link>
            <span className="font-display text-xl tracking-[0.14em] text-sand">
              TYRONAWILDS<span className="text-terracotta">™</span>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-sand/70">
            <Shield className="h-3.5 w-3.5 text-terracotta" />
            <span>IDENTIDAD-SERVICE // JWT HS256 &amp; BCrypt</span>
          </div>
        </div>
      </header>

      {/* CUERPO CENTRAL */}
      <main className="mx-auto my-auto w-full max-w-[1280px] px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* COLUMNA IZQUIERDA: CONTEXTO CORPORATIVO & SEGURIDAD */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 border border-sand/15 bg-jungle/15 p-6 sm:p-8">
            <div>
              <div className="inline-flex items-center gap-2 border border-terracotta/40 bg-terracotta/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-terracotta">
                <Lock className="h-3.5 w-3.5" />
                <span>AUTENTICACIÓN BASADA EN CREDENCIALES &amp; JWT</span>
              </div>

              <h1 className="mt-4 font-display text-4xl sm:text-5xl uppercase leading-[0.92] tracking-wide text-sand">
                TYRONAWILDS™ // CONTROL DE ACCESO &amp; IDENTIDAD RNT
              </h1>

              <p className="mt-4 text-sm text-sand/80 leading-relaxed">
                Pasarela de autenticación conectada a{" "}
                <code className="font-mono text-xs text-terracotta">
                  identidad-service
                </code>{" "}
                mediante{" "}
                <code className="font-mono text-xs text-sand">
                  POST /api/v1/auth/login
                </code>
                . Cada sesión emite un token JWT firmado con los permisos de
                titularidad del Registro Nacional de Turismo (RNT) o de la
                Autoridad Ambiental.
              </p>

              <div className="mt-6 space-y-3 border-t border-sand/15 pt-5 font-mono text-xs text-sand/75">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <strong className="block text-sand uppercase">
                      Verificación de Propiedad RNT (HTTP 403)
                    </strong>
                    Solo el operador titular autenticado en el JWT puede editar
                    tarifas o cupos de sus expediciones registradas.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                  <div>
                    <strong className="block text-sand uppercase">
                      Cabecera Authorization Bearer Automática
                    </strong>
                    Todas las peticiones hacia{" "}
                    <code className="text-sand">api-gateway</code> inyectan el
                    token firmado y registran trazabilidad en{" "}
                    <code className="text-sand">auditoria-service</code>.
                  </div>
                </div>
              </div>
            </div>

            {sesionActiva && (
              <div className="border border-emerald-500/40 bg-emerald-950/30 p-4 font-mono text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold uppercase text-emerald-300">
                    SESIÓN JWT ACTIVA DETECTADA
                  </span>
                  <span className="bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
                    {sesionActiva.rol}
                  </span>
                </div>
                <p className="mt-1.5 text-sand font-bold">
                  {sesionActiva.nombre}
                </p>
                <p className="text-sand/70">
                  {sesionActiva.email}{" "}
                  {sesionActiva.rnt ? `· ${sesionActiva.rnt}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/operadores"
                    className="bg-emerald-500 px-3 py-1.5 text-[11px] font-bold uppercase text-obsidian hover:bg-emerald-400 transition-colors"
                  >
                    IR AL PORTAL DE OPERADORES
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      cerrarSesion();
                      setSesionActiva(null);
                    }}
                    className="inline-flex items-center gap-1 border border-sand/30 px-3 py-1.5 text-[11px] uppercase text-sand/80 hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>CERRAR SESIÓN ACTUAL</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: FORMULARIO LOGIN / REGISTRO + ACORDEÓN DE EVALUACIÓN */}
          <div className="lg:col-span-7 border border-sand/20 bg-obsidian p-6 sm:p-8 shadow-2xl">
            {redirectParam && (
              <div className="mb-6 flex items-center gap-2.5 border border-amber-500/40 bg-amber-950/30 px-4 py-3 font-mono text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Ruta protegida ({redirectParam}): Inicia sesión con una cuenta
                  de Operador RNT o Autoridad Ambiental para continuar.
                </span>
              </div>
            )}

            {/* PESTAÑAS */}
            <div className="grid grid-cols-2 border border-sand/20 bg-obsidian font-mono text-xs uppercase">
              <button
                type="button"
                onClick={() => {
                  setPestana("LOGIN");
                  limpiarErrores();
                }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 font-bold tracking-wider transition-colors ${
                  pestana === "LOGIN"
                    ? "bg-terracotta text-sand"
                    : "text-sand/65 hover:text-sand"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>01 // INICIAR SESIÓN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPestana("REGISTRO");
                  limpiarErrores();
                }}
                className={`flex items-center justify-center gap-2 py-3.5 px-4 font-bold tracking-wider transition-colors border-l border-sand/20 ${
                  pestana === "REGISTRO"
                    ? "bg-terracotta text-sand"
                    : "text-sand/65 hover:text-sand"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>02 // REGISTRAR CUENTA (TURISTA / RNT)</span>
              </button>
            </div>

            {/* BANNER DE ERROR HTTP 401 / 400 / 409 */}
            {errorMensaje && (
              <div
                role="alert"
                className="mt-6 border-2 border-terracotta bg-terracotta/15 p-4 font-mono text-xs text-sand"
              >
                <div className="flex items-center justify-between gap-2 font-bold text-terracotta">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      ERROR HTTP {errorHttpStatus || 401} — {errorCodigo}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase text-sand/60">
                    identidad-service
                  </span>
                </div>
                <p className="mt-1.5 text-sand/90 leading-relaxed">
                  {errorMensaje}
                </p>
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
                    className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-sand/75"
                  >
                    <span>CORREO ELECTRÓNICO CORPORATIVO / RNT *</span>
                    {emailLogin && (
                      <span
                        className={
                          esEmailValido(emailLogin)
                            ? "text-emerald-400"
                            : "text-terracotta"
                        }
                      >
                        {esEmailValido(emailLogin)
                          ? "FORMATO VÁLIDO"
                          : "CORREO INCOMPLETO"}
                      </span>
                    )}
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sand/45" />
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
                      placeholder="operaciones@tayronasierra.co"
                      className="w-full border border-sand/25 bg-obsidian pl-10 pr-4 py-3 font-mono text-sm text-sand placeholder:text-sand/30 focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-sand/75"
                  >
                    <span>CONTRASEÑA DE ACCESO *</span>
                    <span className="text-sand/45">CIFRADO BCRYPT</span>
                  </label>
                  <div className="relative mt-1.5">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-sand/45" />
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
                      className="w-full border border-sand/25 bg-obsidian pl-10 pr-12 py-3 font-mono text-sm text-sand placeholder:text-sand/30 focus:border-terracotta focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMostrarPasswordLogin(!mostrarPasswordLogin)
                      }
                      className="absolute right-3 top-2.5 p-1 text-sand/60 hover:text-terracotta transition-colors"
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
                  <div className="flex items-center gap-2 border border-emerald-500/35 bg-emerald-950/25 px-3.5 py-2.5 font-mono text-[11px] text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Credenciales cargadas para{" "}
                      <strong>{perfilAutocompletado}</strong>. Presiona{" "}
                      <strong>INICIAR SESIÓN</strong> para autenticar contra{" "}
                      <code>identidad-service</code>.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta py-4 px-6 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand hover:bg-ember transition-colors disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {procesando
                      ? "VERIFICANDO CREDENCIALES & FIRMA JWT..."
                      : "INICIAR SESIÓN CON CREDENCIALES REALES"}
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
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                      NOMBRE O RAZÓN SOCIAL *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreReg}
                      onChange={(e) => setNombreReg(e.target.value)}
                      placeholder="Ej. Sierra Nevada Eco Tours S.A.S."
                      className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-sand focus:border-terracotta focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                      CORREO ELECTRÓNICO *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailReg}
                      onChange={(e) => setEmailReg(e.target.value)}
                      placeholder="reservas@sierraecotours.co"
                      className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-sand focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                      TIPO DE CUENTA *
                    </label>
                    <select
                      value={rolReg}
                      onChange={(e) =>
                        setRolReg(e.target.value as RolAutenticado)
                      }
                      className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-sand focus:border-terracotta focus:outline-none"
                    >
                      <option value="OPERADOR">
                        OPERADOR TURÍSTICO CERTIFICADO (RNT)
                      </option>
                      <option value="TURISTA">
                        VIAJERO / EXPEDICIONARIO (TURISTA)
                      </option>
                    </select>
                  </div>

                  {rolReg === "OPERADOR" ? (
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                        LICENCIA RNT (MINCIT) *
                      </label>
                      <input
                        type="text"
                        required
                        value={rntReg}
                        onChange={(e) => setRntReg(e.target.value)}
                        placeholder="RNT-64120"
                        className="mt-1.5 w-full border border-sand/25 bg-obsidian px-3.5 py-2.5 font-mono text-sm text-sand uppercase focus:border-terracotta focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                        MODALIDAD DE VIAJERO
                      </label>
                      <div className="mt-1.5 border border-sand/15 bg-sand/5 px-3.5 py-2.5 font-mono text-xs text-sand/70">
                        PASAPORTE DIGITAL DE CONSERVACIÓN
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-sand/75">
                    CONTRASEÑA (MÍNIMO 8 CARACTERES) *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={mostrarPasswordReg ? "text" : "password"}
                      required
                      value={passwordReg}
                      onChange={(e) => setPasswordReg(e.target.value)}
                      placeholder="Mínimo 8 caracteres alfanuméricos"
                      className="w-full border border-sand/25 bg-obsidian px-3.5 pr-12 py-2.5 font-mono text-sm text-sand focus:border-terracotta focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPasswordReg(!mostrarPasswordReg)}
                      className="absolute right-3 top-2.5 p-1 text-sand/60 hover:text-terracotta"
                    >
                      {mostrarPasswordReg ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-1 font-mono text-xs text-sand/75 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaTerminosReg}
                    onChange={(e) => setAceptaTerminosReg(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-terracotta"
                  />
                  <span>
                    Autorizo el tratamiento de datos personales conforme a la{" "}
                    <Link
                      href="/privacidad"
                      className="underline text-terracotta"
                    >
                      Ley 1581 de 2012
                    </Link>{" "}
                    y acepto los{" "}
                    <Link href="/terminos" className="underline text-terracotta">
                      Términos de Operación RNT &amp; PNN
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta py-4 px-6 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sand hover:bg-ember transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {procesando
                      ? "REGISTRANDO CUENTA EN IDENTIDAD-SERVICE..."
                      : "CREAR CUENTA Y EMITIR TOKEN JWT"}
                  </span>
                </button>
              </form>
            )}

            {/* ACORDEÓN PLEGADO Y DISCRETO: CREDENCIALES DE EVALUACIÓN */}
            <div className="mt-8 border-t border-sand/15 pt-5">
              <button
                type="button"
                onClick={() =>
                  setAcordeonEvaluacionAbierto(!acordeonEvaluacionAbierto)
                }
                className="flex w-full items-center justify-between border border-sand/20 bg-sand/5 px-4 py-3 font-mono text-xs text-sand/80 hover:border-terracotta hover:text-sand transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-terracotta" />
                  <span>
                    Credenciales de evaluación (Autocompletar formulario)
                  </span>
                </span>
                {acordeonEvaluacionAbierto ? (
                  <ChevronUp className="h-4 w-4 text-terracotta" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-sand/60" />
                )}
              </button>

              {acordeonEvaluacionAbierto && (
                <div className="mt-3 space-y-2.5 border border-sand/15 bg-obsidian p-4">
                  <p className="font-mono text-[11px] text-sand/65">
                    Selecciona cualquiera de los 3 perfiles registrados en{" "}
                    <code>identidad-service</code> para autocompletar los campos
                    de correo y contraseña y probar el flujo real de inicio de
                    sesión y control de propiedad RNT:
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {PERFILES_EVALUACION.map((perfil) => (
                      <button
                        key={perfil.id}
                        type="button"
                        onClick={() => manejarAutocompletarPerfil(perfil)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-sand/20 bg-jungle/15 p-3 text-left font-mono transition-colors hover:border-terracotta hover:bg-terracotta/10"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-sand group-hover:text-terracotta">
                              {perfil.titulo}
                            </span>
                            <span className="border border-sand/25 px-1.5 py-0.5 text-[10px] text-sand/75">
                              {perfil.rnt}
                            </span>
                            <span className="bg-terracotta/20 px-1.5 py-0.5 text-[10px] font-bold text-terracotta">
                              {perfil.rolBadge}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-sand/60">
                            {perfil.subtitulo}
                          </p>
                          <p className="mt-1 text-[11px] text-emerald-300">
                            {perfil.email} <span className="text-sand/40">/</span>{" "}
                            {perfil.password}
                          </p>
                        </div>

                        <span className="shrink-0 self-start sm:self-center border border-sand/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sand group-hover:border-terracotta group-hover:bg-terracotta group-hover:text-sand transition-colors">
                          CARGAR CREDENCIALES
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-sand/15 px-4 py-5 font-mono text-[11px] text-sand/50">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 sm:px-2">
          <span>
            TYRONAWILDS™ // PASARELA DE IDENTIDAD CORPORATIVA &amp; RNT · SANTA
            MARTA, CO
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-terracotta">
              Privacidad (Ley 1581)
            </Link>
            <Link href="/terminos" className="hover:text-terracotta">
              Términos RNT
            </Link>
            <Link href="/lab" className="hover:text-terracotta">
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
        <div className="min-h-screen bg-obsidian text-sand flex items-center justify-center font-mono text-xs uppercase tracking-widest">
          CARGANDO PASARELA DE IDENTIDAD RNT...
        </div>
      }
    >
      <LoginContenido />
    </Suspense>
  );
}
