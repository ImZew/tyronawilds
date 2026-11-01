package co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.exception.IndicadorNoEncontradoException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IndicadorNoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> handleNoEncontrado(
            IndicadorNoEncontradoException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "INDICADOR_NO_ENCONTRADO",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERROR_INTERNO_INDICADORES",
                "Ocurrió un error interno procesando los indicadores de sostenibilidad.",
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
