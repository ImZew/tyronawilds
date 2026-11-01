package co.edu.unimagdalena.tyronawilds.recomendacion.infrastructure.adapter.in.web;

import java.math.BigDecimal;
import java.util.UUID;

public record SolicitudRecomendacionRequestDto(
        UUID usuarioId,
        String intereses,
        Boolean priorizarSostenible,
        BigDecimal presupuestoMaximoCop,
        Boolean forzarContextoDegradado
) {
}
