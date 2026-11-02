package co.edu.unimagdalena.tyronawilds.reservas.domain.port.in;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;

import java.util.List;
import java.util.UUID;

public interface CrearReservaUseCase {

    record PasajeroReservaComando(
            String nombre,
            String documento,
            boolean esTitular
    ) {
    }

    record ComandoCrearReserva(
            UUID usuarioId,
            UUID disponibilidadId,
            int cantidadCupos,
            String idempotencyKey,
            String traceId,
            List<PasajeroReservaComando> pasajeros
    ) {
        public ComandoCrearReserva(
                UUID usuarioId,
                UUID disponibilidadId,
                int cantidadCupos,
                String idempotencyKey,
                String traceId
        ) {
            this(usuarioId, disponibilidadId, cantidadCupos, idempotencyKey, traceId, List.of());
        }
    }

    Reserva crearReserva(ComandoCrearReserva comando);

    List<Reserva> consultarReservasPorUsuario(UUID usuarioId);
}
