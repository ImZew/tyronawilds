package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.PerfilTurista;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.PerfilRecomendacionRepositoryPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Submódulo PerfilPreferencias del Diagrama de Componentes UML 1.2 y Vista 2.1.
 */
@Component
public class PerfilPreferencias {

    private static final UUID DEFAULT_TURISTA_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    private final PerfilRecomendacionRepositoryPort repositoryPort;

    public PerfilPreferencias(PerfilRecomendacionRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    public PerfilTurista cargarOCrearPerfil(
            UUID usuarioId,
            String interesesAdicionales,
            Boolean priorizarSostenible,
            BigDecimal presupuestoMaximoCop
    ) {
        UUID idEfectivo = usuarioId != null ? usuarioId : DEFAULT_TURISTA_ID;

        PerfilTurista base = repositoryPort.buscarPerfilPorUsuarioId(idEfectivo)
                .orElseGet(() -> new PerfilTurista(
                        idEfectivo,
                        "trekking,sierra-nevada,minca,cascadas,sostenible,naturaleza",
                        true,
                        new BigDecimal("2000000.00"),
                        "[0.88, 0.94, 0.79, 0.91, 0.85, 0.12]",
                        Instant.now()
                ));

        String interesesCombinados = (interesesAdicionales != null && !interesesAdicionales.isBlank())
                ? base.intereses() + "," + interesesAdicionales.trim().toLowerCase()
                : base.intereses();

        boolean sostenibleEfectivo = priorizarSostenible != null ? priorizarSostenible : base.prefiereSostenible();
        BigDecimal presupuestoEfectivo = presupuestoMaximoCop != null ? presupuestoMaximoCop : base.presupuestoMaxCop();

        return new PerfilTurista(
                base.usuarioId(),
                interesesCombinados,
                sostenibleEfectivo,
                presupuestoEfectivo,
                base.embeddingTexto(),
                Instant.now()
        );
    }
}
