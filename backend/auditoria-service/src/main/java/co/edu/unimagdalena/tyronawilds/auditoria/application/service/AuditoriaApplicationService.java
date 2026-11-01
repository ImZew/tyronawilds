package co.edu.unimagdalena.tyronawilds.auditoria.application.service;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.exception.EventoAuditoriaInvalidoException;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.ConsultarAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.RegistrarEventoAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.out.RegistroAuditoriaRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AuditoriaApplicationService implements
        RegistrarEventoAuditoriaUseCase,
        ConsultarAuditoriaUseCase {

    private final RegistroAuditoriaRepositoryPort repositoryPort;

    public AuditoriaApplicationService(RegistroAuditoriaRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    @Override
    @Transactional
    public RegistroAuditoria registrar(ComandoRegistrarAuditoria comando) {
        if (comando.accion() == null || comando.accion().isBlank()) {
            throw new EventoAuditoriaInvalidoException("La acción del evento de auditoría es obligatoria.");
        }
        if (comando.recurso() == null || comando.recurso().isBlank()) {
            throw new EventoAuditoriaInvalidoException("El recurso del evento de auditoría es obligatorio.");
        }

        RegistroAuditoria nuevoRegistro = new RegistroAuditoria(
                UUID.randomUUID(),
                comando.eventoOrigenId(),
                comando.usuarioId() != null && !comando.usuarioId().isBlank() ? comando.usuarioId() : "ANONIMO",
                comando.rol() != null && !comando.rol().isBlank() ? comando.rol() : "SIN_ROL",
                comando.accion().trim(),
                comando.recurso().trim(),
                comando.resultado() != null && !comando.resultado().isBlank()
                        ? comando.resultado().trim().toUpperCase()
                        : "REGISTRADA",
                comando.motivo(),
                comando.ipOrigen() != null ? comando.ipOrigen() : "0.0.0.0",
                comando.traceId() != null ? comando.traceId() : UUID.randomUUID().toString(),
                comando.fechaOperacion() != null ? comando.fechaOperacion() : Instant.now()
        );

        return repositoryPort.insertar(nuevoRegistro);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroAuditoria> consultarEventos(String resultado, int page, int size) {
        int paginaSegura = Math.max(0, page);
        int tamanoSeguro = Math.min(Math.max(1, size), 100);

        if (resultado != null && !resultado.isBlank()) {
            return repositoryPort.buscarPorResultadoPaginado(resultado.trim().toUpperCase(), paginaSegura, tamanoSeguro);
        }
        return repositoryPort.buscarTodosPaginado(paginaSegura, tamanoSeguro);
    }
}
