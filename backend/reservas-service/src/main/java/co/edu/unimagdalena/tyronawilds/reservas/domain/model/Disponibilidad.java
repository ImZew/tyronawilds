package co.edu.unimagdalena.tyronawilds.reservas.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record Disponibilidad(
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

    public boolean tieneCuposSuficientes(int cantidadSolicitada) {
        return cantidadSolicitada > 0 && this.cuposDisponibles >= cantidadSolicitada;
    }

    public Disponibilidad descontarCupos(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad de cupos a descontar debe ser mayor a cero.");
        }
        if (this.cuposDisponibles < cantidad) {
            throw new IllegalStateException("Invariante de cupo violada: cuposDisponibles (" + this.cuposDisponibles
                    + ") < cantidadSolicitada (" + cantidad + ").");
        }
        return new Disponibilidad(
                this.id,
                this.actividadId,
                this.nombreActividad,
                this.fecha,
                this.horaInicio,
                this.capacidadTotal,
                this.cuposDisponibles - cantidad,
                this.precioUnitarioCop,
                this.version
        );
    }

    public Disponibilidad restaurarCupos(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad de cupos a restaurar debe ser mayor a cero.");
        }
        int nuevosCupos = Math.min(this.capacidadTotal, this.cuposDisponibles + cantidad);
        return new Disponibilidad(
                this.id,
                this.actividadId,
                this.nombreActividad,
                this.fecha,
                this.horaInicio,
                this.capacidadTotal,
                nuevosCupos,
                this.precioUnitarioCop,
                this.version
        );
    }
}
