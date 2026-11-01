package co.edu.unimagdalena.tyronawilds.oferta.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ActividadTuristica(
        UUID id,
        long codigoServicio,
        UUID prestadorId,
        long codigoPrestador,
        String nombreEs,
        String nombreEn,
        String slug,
        String categoria,
        String ubicacion,
        String coordenadasHud,
        int altitudMsnm,
        BigDecimal precioCop,
        int capacidadMaxima,
        int nivelOcupacionActual,
        boolean esSostenible,
        String imagenUrl,
        String descripcionEs,
        String descripcionEn,
        String tagsAfinidad,
        Instant ultimaActualizacion
) {
}
