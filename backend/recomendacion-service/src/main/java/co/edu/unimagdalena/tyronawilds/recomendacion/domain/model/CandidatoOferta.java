package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record CandidatoOferta(
        UUID id,
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
        String tagsAfinidad
) {
}
