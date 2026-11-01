package co.edu.unimagdalena.tyronawilds.reservas.domain.port.in;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.ReporteSimulacionConcurrencia;

import java.util.UUID;

public interface SimularConcurrenciaUseCase {

    record ComandoSimularConcurrencia(
            UUID disponibilidadId,
            Integer cuposIniciales,
            Integer hilosConcurrentes
    ) {
    }

    ReporteSimulacionConcurrencia ejecutarSimulacionConcurrencia(ComandoSimularConcurrencia comando);
}
