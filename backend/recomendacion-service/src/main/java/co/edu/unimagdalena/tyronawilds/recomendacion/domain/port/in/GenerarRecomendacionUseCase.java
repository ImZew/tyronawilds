package co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.in;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ResultadoRecomendacion;

import java.math.BigDecimal;
import java.util.UUID;

public interface GenerarRecomendacionUseCase {

    record ComandoGenerarRecomendacion(
            UUID usuarioId,
            String interesesAdicionales,
            Boolean priorizarSostenible,
            BigDecimal presupuestoMaximoCop,
            Boolean forzarContextoDegradado,
            String correlacionId
    ) {
    }

    ResultadoRecomendacion generarRecomendacion(ComandoGenerarRecomendacion comando);

    String obtenerNivelIaActivo();

    String cambiarNivelIaEnCaliente(String nuevoNivel);
}
