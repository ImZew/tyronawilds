package co.edu.unimagdalena.tyronawilds.oferta.domain.port.in;

import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;

import java.util.List;
import java.util.UUID;

public interface ConsultarCatalogoUseCase {

    List<ActividadTuristica> listarActividades(String categoria, Boolean soloSostenibles);

    ActividadTuristica obtenerPorId(UUID id);

    ActividadTuristica obtenerPorCodigoServicio(long codigoServicio);
}
