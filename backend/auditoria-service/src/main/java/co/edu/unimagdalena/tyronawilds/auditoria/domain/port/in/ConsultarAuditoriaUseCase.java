package co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;

import java.util.List;

public interface ConsultarAuditoriaUseCase {

    List<RegistroAuditoria> consultarEventos(String resultado, int page, int size);
}
