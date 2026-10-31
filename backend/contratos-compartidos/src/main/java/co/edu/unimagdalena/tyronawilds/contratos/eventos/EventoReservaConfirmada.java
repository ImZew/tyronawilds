package co.edu.unimagdalena.tyronawilds.contratos.eventos;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EventoReservaConfirmada(
        UUID eventoId,
        UUID reservaId,
        UUID usuarioId,
        UUID actividadId,
        UUID disponibilidadId,
        int cuposReservados,
        int cuposRestantes,
        BigDecimal montoTotal,
        LocalDate fechaActividad,
        String traceId,
        Instant timestamp
) {
}
