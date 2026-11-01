package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.adapter.in.web;

import java.math.BigDecimal;

public record ActualizarActividadRequestDto(
        String nombreEs,
        String nombreEn,
        BigDecimal precioCop,
        Integer capacidadMaxima,
        Integer nivelOcupacionActual,
        Boolean esSostenible,
        String descripcionEs,
        String descripcionEn,
        String tagsAfinidad
) {
}
