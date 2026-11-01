package co.edu.unimagdalena.tyronawilds.integracion.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        String header = request.getHeader(SecurityHeaders.X_CORRELATION_ID);
        String traceId = (header != null && !header.isBlank()) ? header : UUID.randomUUID().toString();

        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERROR_INTERNO_INTEGRACION",
                "Ocurrió un error procesando la agregación de fuentes externas.",
                request.getRequestURI(),
                traceId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
