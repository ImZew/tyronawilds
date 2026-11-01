package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import java.util.UUID;

public record SimulacionConcurrenciaRequestDto(
        UUID disponibilidadId,
        Integer cuposIniciales,
        Integer hilosConcurrentes
) {
}
