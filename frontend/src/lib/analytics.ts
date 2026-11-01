// =============================================================================
// TyronaWilds (PlataformaTurismoSM) - Módulo Ligero de Analíticas de Producto
// Respeta el consentimiento de cookies conforme a la Ley 1581 de 2012 (RNF-06).
// =============================================================================

export type NivelConsentimientoCookies = "ALL" | "ESSENTIAL_ONLY" | null;

const CONSENT_STORAGE_KEY = "tyronawilds_cookie_consent_v1";
const EVENTS_STORAGE_KEY = "tyronawilds_analytics_events_v1";

export interface EventoAnalitica {
  id: string;
  evento:
    | "PAGE_VIEW"
    | "EXPEDITION_DRAWER_OPEN"
    | "BAQUIANO_AI_QUERY"
    | "CHECKOUT_CONVERSION"
    | "CHECKOUT_VALIDATION_ERROR";
  propiedades: Record<string, string | number | boolean>;
  timestamp: string;
}

export function obtenerConsentimientoCookies(): NivelConsentimientoCookies {
  if (typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === "ALL" || val === "ESSENTIAL_ONLY") return val;
    return null;
  } catch {
    return null;
  }
}

export function guardarConsentimientoCookies(
  nivel: "ALL" | "ESSENTIAL_ONLY"
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nivel);
  } catch {
    // Ignorar en modo incógnito restringido
  }
}

export function registrarEventoAnalitica(
  evento: EventoAnalitica["evento"],
  propiedades: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === "undefined") return;
  const consentimiento = obtenerConsentimientoCookies();

  // Si el usuario rechazó analíticas, no persistimos telemetría de comportamiento
  if (consentimiento === "ESSENTIAL_ONLY") {
    return;
  }

  try {
    const registro: EventoAnalitica = {
      id: `evt-${Date.now().toString(36)}`,
      evento,
      propiedades,
      timestamp: new Date().toISOString(),
    };
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    const historico: EventoAnalitica[] = raw ? JSON.parse(raw) : [];
    const actualizado = [registro, ...historico].slice(0, 40);
    window.localStorage.setItem(
      EVENTS_STORAGE_KEY,
      JSON.stringify(actualizado)
    );
  } catch {
    // No bloquear nunca el flujo principal por almacenamiento lleno
  }
}
