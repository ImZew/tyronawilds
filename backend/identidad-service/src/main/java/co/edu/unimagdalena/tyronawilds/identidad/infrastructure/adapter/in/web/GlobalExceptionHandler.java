package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.CredencialesInvalidasException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.ProveedorAuthNoHabilitadoException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.UsuarioYaExisteException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> detalles = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            detalles.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "DATOS_ENTRADA_INVALIDOS",
                "La solicitud contiene campos con formato inválido o faltantes.",
                request.getRequestURI(),
                resolverTraceId(request),
                detalles
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ApiErrorResponse> handleCredencialesInvalidas(
            CredencialesInvalidasException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "CREDENCIALES_INVALIDAS",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(ProveedorAuthNoHabilitadoException.class)
    public ResponseEntity<ApiErrorResponse> handleProveedorNoHabilitado(
            ProveedorAuthNoHabilitadoException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                "PROVEEDOR_AUTH_NO_HABILITADO",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(UsuarioYaExisteException.class)
    public ResponseEntity<ApiErrorResponse> handleUsuarioYaExiste(
            UsuarioYaExisteException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "USUARIO_YA_EXISTE",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "ERROR_INTERNO_SERVIDOR",
                "Ocurrió un error interno procesando la solicitud de identidad.",
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
