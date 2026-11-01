package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.ReporteSimulacionConcurrencia;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CancelarReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CrearReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.SimularConcurrenciaUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservas")
public class ReservasController {

    private static final UUID DEFAULT_TURISTA_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    private final CrearReservaUseCase crearReservaUseCase;
    private final CancelarReservaUseCase cancelarReservaUseCase;
    private final SimularConcurrenciaUseCase simularConcurrenciaUseCase;

    public ReservasController(
            CrearReservaUseCase crearReservaUseCase,
            CancelarReservaUseCase cancelarReservaUseCase,
            SimularConcurrenciaUseCase simularConcurrenciaUseCase
    ) {
        this.crearReservaUseCase = crearReservaUseCase;
        this.cancelarReservaUseCase = cancelarReservaUseCase;
        this.simularConcurrenciaUseCase = simularConcurrenciaUseCase;
    }

    @PostMapping
    public ResponseEntity<ReservaResponseDto> crearReserva(
            @Valid @RequestBody CrearReservaRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader, request.usuarioId());
        String traceId = (correlationId != null && !correlationId.isBlank())
                ? correlationId
                : UUID.randomUUID().toString();

        Reserva creada = crearReservaUseCase.crearReserva(
                new CrearReservaUseCase.ComandoCrearReserva(
                        usuarioId,
                        request.disponibilidadId(),
                        request.cantidadCupos(),
                        request.idempotencyKey(),
                        traceId
                )
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ReservaResponseDto.fromDomain(creada));
    }

    @GetMapping
    public ResponseEntity<List<ReservaResponseDto>> consultarReservas(
            @RequestParam(name = "usuarioId", required = false) UUID usuarioIdParam,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userIdHeader
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader, usuarioIdParam);
        List<ReservaResponseDto> respuesta = crearReservaUseCase
                .consultarReservasPorUsuario(usuarioId)
                .stream()
                .map(ReservaResponseDto::fromDomain)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDto> cancelarReserva(
            @PathVariable("id") UUID id,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId
    ) {
        String traceId = (correlationId != null && !correlationId.isBlank())
                ? correlationId
                : UUID.randomUUID().toString();
        Reserva cancelada = cancelarReservaUseCase.cancelarReserva(id, traceId);
        return ResponseEntity.ok(ReservaResponseDto.fromDomain(cancelada));
    }

    @PostMapping("/simulacion-concurrencia")
    public ResponseEntity<ReporteSimulacionConcurrencia> simularConcurrencia(
            @RequestBody(required = false) SimulacionConcurrenciaRequestDto request
    ) {
        SimularConcurrenciaUseCase.ComandoSimularConcurrencia comando = (request != null)
                ? new SimularConcurrenciaUseCase.ComandoSimularConcurrencia(
                        request.disponibilidadId(),
                        request.cuposIniciales(),
                        request.hilosConcurrentes()
                )
                : new SimularConcurrenciaUseCase.ComandoSimularConcurrencia(null, 5, 30);

        return ResponseEntity.ok(simularConcurrenciaUseCase.ejecutarSimulacionConcurrencia(comando));
    }

    private UUID resolverUsuarioId(String userIdHeader, UUID fallbackUsuarioId) {
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                return UUID.fromString(userIdHeader.trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return fallbackUsuarioId != null ? fallbackUsuarioId : DEFAULT_TURISTA_ID;
    }
}
