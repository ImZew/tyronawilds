package co.edu.unimagdalena.tyronawilds.recomendacion.infrastructure.adapter.in.web;

import java.util.List;

public record ConfiguracionVariabilidadIaDto(
        String puntoVariabilidad,
        String nivelIaActivo,
        List<String> variantesSoportadas
) {
}
