package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemRecomendado(
        UUID actividadId,
        long codigoServicio,
        String nombreEs,
        String nombreEn,
        String slug,
        String categoria,
        String ubicacion,
        String coordenadasHud,
        int altitudMsnm,
        BigDecimal precioCop,
        int nivelOcupacionActual,
        boolean esSostenible,
        String imagenUrl,
        double puntajeAfinidad,
        String explicacionEs,
        String explicacionEn
) {
}
