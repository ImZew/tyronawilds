package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.ContextoExternoClientPort;
import org.springframework.stereotype.Component;

/**
 * Submódulo ContextoExterno del Diagrama de Componentes UML 1.2 y Vista 2.1.
 */
@Component
public class ContextoExterno {

    private final ContextoExternoClientPort clientPort;

    public ContextoExterno(ContextoExternoClientPort clientPort) {
        this.clientPort = clientPort;
    }

    public ContextoTerritorialResumen enriquecerContexto(Boolean forzarContextoDegradado) {
        if (Boolean.TRUE.equals(forzarContextoDegradado)) {
            return new ContextoTerritorialResumen(
                    28.5,
                    "PARCIALMENTE_NUBLADO_CACHE",
                    85,
                    "Minca / Corregimiento de Bonda",
                    true,
                    "REDIS_CACHE_FALLBACK"
            );
        }
        return clientPort.consultarContextoTerritorial();
    }
}
