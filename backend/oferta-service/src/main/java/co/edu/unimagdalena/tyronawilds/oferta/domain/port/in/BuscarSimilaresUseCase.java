package co.edu.unimagdalena.tyronawilds.oferta.domain.port.in;

import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;

import java.util.List;

public interface BuscarSimilaresUseCase {

    List<ActividadTuristica> buscarSimilaresPorTags(String tags, boolean priorizarBajaOcupacion);
}
