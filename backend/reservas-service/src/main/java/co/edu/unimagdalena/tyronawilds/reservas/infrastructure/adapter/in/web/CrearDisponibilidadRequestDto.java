package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CrearDisponibilidadRequestDto(
        @NotNull(message = "El ID de la actividad es obligatorio")
        UUID actividadId,

        @NotBlank(message = "El nombre de la actividad es obligatorio")
        String nombreActividad,

        @NotNull(message = "La fecha es obligatoria")
        LocalDate fecha,

        @NotNull(message = "La hora de inicio es obligatoria")
        LocalTime horaInicio,

        @Min(value = 1, message = "La capacidad total debe ser al menos 1")
        int capacidadTotal,

        @Min(value = 0, message = "Los cupos disponibles no pueden ser negativos")
        int cuposDisponibles,

        @NotNull(message = "El precio unitario es obligatorio")
        @Positive(message = "El precio unitario debe ser mayor a cero")
        BigDecimal precioUnitarioCop
) {
}
