package co.edu.unimagdalena.tyronawilds.integracion.domain.port.in;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ContextoTerritorialAgregado;

public interface ConsultarContextoTerritorialUseCase {

    ContextoTerritorialAgregado consultarContextoActual();

    ContextoTerritorialAgregado configurarSimulacionFallo(boolean activarFallo);
}
