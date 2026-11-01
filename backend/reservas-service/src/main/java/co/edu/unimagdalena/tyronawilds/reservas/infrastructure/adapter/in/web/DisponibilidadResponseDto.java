package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record DisponibilidadResponseDto(
        UUID id,
        UUID actividadId,
        String nombreActividad,
        LocalDate fecha,
        LocalTime horaInicio,
        int capacidadTotal,
        int cuposDisponibles,
        BigDecimal precioUnitarioCop,
        long version
) {
    public static DisponibilidadResponseDto fromDomain(Disponibilidad d) {
        return new DisponibilidadResponseDto(
                d.id(),
                d.actividadId(),
                d.nombreActividad(),
                d.fecha(),
                d.horaInicio(),
                d.capacidadTotal(),
                d.cuposDisponibles(),
                d.precioUnitarioCop(),
                d.version()
        );
    }
}
