package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.web;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CrearEventoAuditoriaRequestDto(
        UUID eventoOrigenId,
        String usuarioId,
        String rol,

        @NotBlank(message = "La acción auditada es obligatoria")
        String accion,

        @NotBlank(message = "El recurso auditado es obligatorio")
        String recurso,

        @NotBlank(message = "El resultado de la operación es obligatorio (ej. DENEGADA, EXITOSA)")
        String resultado,

        String motivo,
        String ipOrigen,
        String traceId
) {
}
