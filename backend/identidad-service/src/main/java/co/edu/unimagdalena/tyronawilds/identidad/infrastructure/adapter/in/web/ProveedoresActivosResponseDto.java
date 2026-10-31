package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import java.util.List;

public record ProveedoresActivosResponseDto(
        String puntoVariabilidad,
        List<String> proveedoresActivos
) {
}
