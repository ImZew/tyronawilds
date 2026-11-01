package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PerfilTurista(
        UUID usuarioId,
        String intereses,
        boolean prefiereSostenible,
        BigDecimal presupuestoMaxCop,
        String embeddingTexto,
        Instant actualizadoEn
) {
}
