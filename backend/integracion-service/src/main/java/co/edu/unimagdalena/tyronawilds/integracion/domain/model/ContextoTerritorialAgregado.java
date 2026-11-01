package co.edu.unimagdalena.tyronawilds.integracion.domain.model;

import java.time.Instant;

public record ContextoTerritorialAgregado(
        DatosClimaNormalizados clima,
        DatosAforoNormalizados aforo,
        DatosEventosNormalizados eventos,
        boolean degradado,
        String fuenteDatos,
        String estadoCircuitBreaker,
        boolean simulacionFalloActiva,
        Instant timestamp
) {
}
