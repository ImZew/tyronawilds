package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.RecursoReservaNoEncontradoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
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
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ConflictoConcurrenciaCupoException.class)
    public ResponseEntity<ApiErrorResponse> handleConflictoConcurrenciaCupo(
            ConflictoConcurrenciaCupoException ex,
            HttpServletRequest request
    ) {
        Map<String, String> detalles = new LinkedHashMap<>();
        detalles.put("escenarioCalidad", "ER-02 (Control de Concurrencia y Sobreasignación)");

        if (ex.getHorariosAlternativos() != null && !ex.getHorariosAlternativos().isEmpty()) {
            String resumenAlternativas = ex.getHorariosAlternativos().stream()
                    .map(this::formatearAlternativa)
                    .collect(Collectors.joining(" | "));
            detalles.put("horariosAlternativosSugeridos", resumenAlternativas);
            detalles.put("alternativaPrincipalId", ex.getHorariosAlternativos().getFirst().id().toString());
        } else {
            detalles.put("horariosAlternativosSugeridos", "Sin horarios alternativos inmediatos para la misma actividad.");
        }

        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                "CONFLICTO_CUPO_AGOTADO",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request),
                detalles
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(RecursoReservaNoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> handleNoEncontrado(
            RecursoReservaNoEncontradoException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                "RECURSO_NO_ENCONTRADO",
                ex.getMessage(),
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

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
                "DATOS_RESERVA_INVALIDOS",
                "Los datos de la solicitud de reserva contienen errores de validación.",
                request.getRequestURI(),
                resolverTraceId(request),
                detalles
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
                "ERROR_INTERNO_RESERVAS",
                "Ocurrió un error interno procesando la operación de reserva.",
                request.getRequestURI(),
                resolverTraceId(request)
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String formatearAlternativa(Disponibilidad d) {
        return String.format("%s %s (ID=%s, cupos=%d)", d.fecha(), d.horaInicio(), d.id(), d.cuposDisponibles());
    }

    private String resolverTraceId(HttpServletRequest request) {
        String header = request.getHeader(SecurityHeaders.X_CORRELATION_ID);
        return (header != null && !header.isBlank()) ? header : UUID.randomUUID().toString();
    }
}
