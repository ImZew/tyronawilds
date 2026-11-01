package co.edu.unimagdalena.tyronawilds.recomendacion.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.exception.RecomendacionFallidaException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecomendacionFallidaException.class)
    public ResponseEntity<ApiErrorResponse> handleRecomendacionFallida(
            RecomendacionFallidaException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "MOTOR_RECOMENDACION_NO_DISPONIBLE",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "PARAMETRO_VARIABILIDAD_INVALIDO",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERROR_INTERNO_RECOMENDACION",
                "Ocurrió un error interno procesando la recomendación turística.",
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String resolverTraceId(HttpServletRequest request) {
        String header = request.getHeader(SecurityHeaders.X_CORRELATION_ID);
        return (header != null && !header.isBlank()) ? header : UUID.randomUUID().toString();
    }
}
