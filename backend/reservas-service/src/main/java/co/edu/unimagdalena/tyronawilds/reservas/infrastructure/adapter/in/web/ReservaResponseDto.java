package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.EstadoReserva;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReservaResponseDto(
        UUID id,
        String codigoReserva,
        UUID usuarioId,
        UUID disponibilidadId,
        UUID actividadId,
        int cantidadCupos,
        BigDecimal montoTotalCop,
        EstadoReserva estadoReserva,
        String idempotencyKey,
        Instant fechaOperacion
) {
    public static ReservaResponseDto fromDomain(Reserva r) {
        return new ReservaResponseDto(
                r.id(),
                r.codigoReserva(),
                r.usuarioId(),
                r.disponibilidadId(),
                r.actividadId(),
                r.cantidadCupos(),
                r.montoTotalCop(),
                r.estadoReserva(),
                r.idempotencyKey(),
                r.fechaOperacion()
        );
    }
}
