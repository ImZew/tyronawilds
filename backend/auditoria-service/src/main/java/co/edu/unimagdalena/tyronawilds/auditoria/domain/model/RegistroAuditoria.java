package co.edu.unimagdalena.tyronawilds.auditoria.domain.model;

import java.time.Instant;
import java.util.UUID;

public record RegistroAuditoria(
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
}
