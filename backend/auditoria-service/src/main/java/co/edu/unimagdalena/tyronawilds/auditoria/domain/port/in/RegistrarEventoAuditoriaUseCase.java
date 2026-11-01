package co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;

import java.time.Instant;
import java.util.UUID;

public interface RegistrarEventoAuditoriaUseCase {

    record ComandoRegistrarAuditoria(
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

    RegistroAuditoria registrar(ComandoRegistrarAuditoria comando);
}
