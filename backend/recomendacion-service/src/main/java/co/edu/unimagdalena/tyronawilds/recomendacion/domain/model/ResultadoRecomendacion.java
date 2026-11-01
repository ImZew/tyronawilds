package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResultadoRecomendacion(
        UUID recomendacionId,
        String correlacionId,
        UUID usuarioId,
        String nivelIaAplicado,
        String estadoFinal,
        boolean contextoDegradado,
        List<String> trazaEstados,
        ContextoTerritorialResumen contextoAplicado,
        List<ItemRecomendado> recomendaciones,
        Instant generadoEn
) {
}
