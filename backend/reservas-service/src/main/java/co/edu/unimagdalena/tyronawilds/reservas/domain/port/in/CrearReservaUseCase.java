package co.edu.unimagdalena.tyronawilds.reservas.domain.port.in;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;

import java.util.List;
import java.util.UUID;

public interface CrearReservaUseCase {

    record ComandoCrearReserva(
            UUID usuarioId,
            UUID disponibilidadId,
            int cantidadCupos,
            String idempotencyKey,
            String traceId
    ) {
    }

    Reserva crearReserva(ComandoCrearReserva comando);

    List<Reserva> consultarReservasPorUsuario(UUID usuarioId);
}
