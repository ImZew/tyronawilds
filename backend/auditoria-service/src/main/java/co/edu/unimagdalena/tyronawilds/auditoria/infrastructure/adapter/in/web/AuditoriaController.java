package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.ConsultarAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.RegistrarEventoAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaController {

    private final RegistrarEventoAuditoriaUseCase registrarEventoAuditoriaUseCase;
    private final ConsultarAuditoriaUseCase consultarAuditoriaUseCase;

    public AuditoriaController(
            RegistrarEventoAuditoriaUseCase registrarEventoAuditoriaUseCase,
            ConsultarAuditoriaUseCase consultarAuditoriaUseCase
    ) {
        this.registrarEventoAuditoriaUseCase = registrarEventoAuditoriaUseCase;
        this.consultarAuditoriaUseCase = consultarAuditoriaUseCase;
    }

    @GetMapping
    public ResponseEntity<List<RegistroAuditoriaResponseDto>> consultarRegistros(
            @RequestParam(name = "resultado", required = false) String resultado,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "25") int size
    ) {
        List<RegistroAuditoriaResponseDto> registros = consultarAuditoriaUseCase
                .consultarEventos(resultado, page, size)
                .stream()
                .map(RegistroAuditoriaResponseDto::fromDomain)
                .toList();
        return ResponseEntity.ok(registros);
    }

    @PostMapping("/eventos")
    public ResponseEntity<RegistroAuditoriaResponseDto> registrarEventoManual(
            @Valid @RequestBody CrearEventoAuditoriaRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        String traceId = request.traceId() != null && !request.traceId().isBlank()
                ? request.traceId()
                : (correlationId != null ? correlationId : UUID.randomUUID().toString());

        RegistroAuditoria creado = registrarEventoAuditoriaUseCase.registrar(
                new RegistrarEventoAuditoriaUseCase.ComandoRegistrarAuditoria(
                        request.eventoOrigenId(),
                        request.usuarioId(),
                        request.rol(),
                        request.accion(),
                        request.recurso(),
                        request.resultado(),
                        request.motivo(),
                        request.ipOrigen() != null ? request.ipOrigen() : servletRequest.getRemoteAddr(),
                        traceId,
                        Instant.now()
                )
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(RegistroAuditoriaResponseDto.fromDomain(creado));
    }
}
