package co.edu.unimagdalena.tyronawilds.contratos.eventos;

import java.time.Instant;
import java.util.UUID;

public record EventoAccesoDenegado(
        UUID eventoId,
        UUID usuarioId,
        String rol,
        String recurso,
        String accion,
        String motivo,
        String ipOrigen,
        String traceId,
        Instant timestamp
) {
}
