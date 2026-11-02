package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CrearReservaRequestDto(
        UUID usuarioId,

        @NotNull(message = "El ID de disponibilidad es obligatorio")
        UUID disponibilidadId,

        @Min(value = 1, message = "La cantidad de cupos solicitados debe ser al menos 1")
        int cantidadCupos,

        String idempotencyKey,

        List<PasajeroRequestDto> pasajeros
) {
    public record PasajeroRequestDto(
            String nombre,
            String documento,
            boolean esTitular
    ) {
    }
}
