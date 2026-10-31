package co.edu.unimagdalena.tyronawilds.contratos.errores;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        int status,
        String codigo,
        String mensaje,
        String path,
        String traceId,
        Instant timestamp,
        Map<String, String> detalles
) {
    public static ApiErrorResponse of(int status, String codigo, String mensaje, String path, String traceId) {
        return new ApiErrorResponse(status, codigo, mensaje, path, traceId, Instant.now(), null);
    }

    public static ApiErrorResponse of(int status, String codigo, String mensaje, String path, String traceId, Map<String, String> detalles) {
        return new ApiErrorResponse(status, codigo, mensaje, path, traceId, Instant.now(), detalles);
    }
}
