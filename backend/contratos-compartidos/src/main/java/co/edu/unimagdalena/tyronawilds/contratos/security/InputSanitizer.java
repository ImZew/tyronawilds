package co.edu.unimagdalena.tyronawilds.contratos.security;

import java.util.regex.Pattern;

/**
 * Utilidad transversal de seguridad para sanitización de entradas (Defensa XSS / Inyección).
 * Elimina bloques <script>, etiquetas HTML potencialmente peligrosas, atributos de eventos
 * inline (onerror, onload, javascript:) y normaliza espacios residuales.
 */
public final class InputSanitizer {

    private static final Pattern SCRIPT_BLOCKS = Pattern.compile(
            "(?i)<script[^>]*>.*?</script>", Pattern.DOTALL
    );
    private static final Pattern HTML_TAGS = Pattern.compile(
            "<[^>]+>"
    );
    private static final Pattern JS_PROTOCOL = Pattern.compile(
            "(?i)javascript\\s*:"
    );
    private static final Pattern CONTROL_CHARS = Pattern.compile(
            "[\\p{Cntrl}&&[^\r\n\t]]"
    );

    private InputSanitizer() {
        // Clase utilitaria estática
    }

    /**
     * Limpia etiquetas HTML/scripts (XSS), protocolos javascript: y espacios residuales.
     *
     * @param raw Cadena de entrada recibida desde un DTO o cabecera HTTP
     * @return Cadena sanitizada y recortada, o null si la entrada es null
     */
    public static String sanitize(String raw) {
        if (raw == null) {
            return null;
        }
        String cleaned = SCRIPT_BLOCKS.matcher(raw).replaceAll("");
        cleaned = HTML_TAGS.matcher(cleaned).replaceAll("");
        cleaned = JS_PROTOCOL.matcher(cleaned).replaceAll("");
        cleaned = CONTROL_CHARS.matcher(cleaned).replaceAll("");
        return cleaned.trim().replaceAll("\\s{2,}", " ");
    }

    /**
     * Sanitiza un correo electrónico convirtiendo a minúsculas y eliminando etiquetas.
     */
    public static String sanitizeEmail(String email) {
        String cleaned = sanitize(email);
        return cleaned != null ? cleaned.toLowerCase() : null;
    }
}
