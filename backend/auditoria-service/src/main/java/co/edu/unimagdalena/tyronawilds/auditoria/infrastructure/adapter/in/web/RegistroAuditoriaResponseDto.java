package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;

import java.time.Instant;
import java.util.UUID;

public record RegistroAuditoriaResponseDto(
        UUID id,
        UUID eventoOrigenId,
        String usuarioId,
        String rol,
        String accion,
        String recurso,
        String resultado,
        String motivo,
        String ipOrigen,
        String traceId,
        Instant fechaOperacion
) {
    public static RegistroAuditoriaResponseDto fromDomain(RegistroAuditoria r) {
        return new RegistroAuditoriaResponseDto(
                r.id(),
                r.eventoOrigenId(),
                r.usuarioId(),
                r.rol(),
                r.accion(),
                r.recurso(),
                r.resultado(),
                r.motivo(),
                r.ipOrigen(),
                r.traceId(),
                r.fechaOperacion()
        );
    }
}
