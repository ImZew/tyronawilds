package co.edu.unimagdalena.tyronawilds.reservas.domain.port.in;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;

import java.util.UUID;

public interface CancelarReservaUseCase {

    Reserva cancelarReserva(UUID reservaId, String traceId);
}
