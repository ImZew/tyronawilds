package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ActividadResponseDto(
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
    public static ActividadResponseDto fromDomain(ActividadTuristica a) {
        return new ActividadResponseDto(
                a.id(),
                a.codigoServicio(),
                a.prestadorId(),
                a.codigoPrestador(),
                a.nombreEs(),
                a.nombreEn(),
                a.slug(),
                a.categoria(),
                a.ubicacion(),
                a.coordenadasHud(),
                a.altitudMsnm(),
                a.precioCop(),
                a.capacidadMaxima(),
                a.nivelOcupacionActual(),
                a.esSostenible(),
                a.imagenUrl(),
                a.descripcionEs(),
                a.descripcionEn(),
                a.tagsAfinidad(),
                a.ultimaActualizacion()
        );
    }
}
