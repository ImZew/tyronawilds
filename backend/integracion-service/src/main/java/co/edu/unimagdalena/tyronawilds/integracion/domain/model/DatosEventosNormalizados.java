package co.edu.unimagdalena.tyronawilds.integracion.domain.model;

import java.util.List;

public record DatosEventosNormalizados(
        String temporadaActual,
        List<EventoCulturalAgenda> eventosActivos
) {
    public record EventoCulturalAgenda(
            String codigo,
            String tituloEs,
            String tituloEn,
            String ubicacion,
            String fechaHora
    ) {
    }
}
