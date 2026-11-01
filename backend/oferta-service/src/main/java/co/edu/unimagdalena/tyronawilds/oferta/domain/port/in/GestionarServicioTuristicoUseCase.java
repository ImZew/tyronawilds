package co.edu.unimagdalena.tyronawilds.oferta.domain.port.in;

import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;

import java.math.BigDecimal;
import java.util.UUID;

public interface GestionarServicioTuristicoUseCase {

    record ContextoSeguridadActor(
            String usuarioId,
            String rol,
            String prestadorIdHeader,
            String ipOrigen,
            String traceId
    ) {
    }

    record ComandoCrearActividad(
            long codigoServicio,
            String nombreEs,
            String nombreEn,
            String slug,
            String categoria,
            String ubicacion,
            String coordenadasHud,
            int altitudMsnm,
            BigDecimal precioCop,
            int capacidadMaxima,
            boolean esSostenible,
            String imagenUrl,
            String descripcionEs,
            String descripcionEn,
            String tagsAfinidad
    ) {
    }

    record ComandoActualizarActividad(
            String nombreEs,
            String nombreEn,
            BigDecimal precioCop,
            Integer capacidadMaxima,
            Integer nivelOcupacionActual,
            Boolean esSostenible,
            String descripcionEs,
            String descripcionEn,
            String tagsAfinidad
    ) {
    }

    ActividadTuristica crearActividad(ComandoCrearActividad comando, ContextoSeguridadActor actor);

    ActividadTuristica actualizarPorId(UUID actividadId, ComandoActualizarActividad comando, ContextoSeguridadActor actor);

    ActividadTuristica actualizarServicioDePrestador(
            String prestadorPathId,
            String servicioPathId,
            ComandoActualizarActividad comando,
            ContextoSeguridadActor actor
    );
}
