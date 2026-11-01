package co.edu.unimagdalena.tyronawilds.reservas.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Reserva(
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
    public Reserva cancelar() {
        return new Reserva(
                this.id,
                this.codigoReserva,
                this.usuarioId,
                this.disponibilidadId,
                this.actividadId,
                this.cantidadCupos,
                this.montoTotalCop,
                EstadoReserva.CANCELADA,
                this.idempotencyKey,
                this.fechaOperacion
        );
    }
}
