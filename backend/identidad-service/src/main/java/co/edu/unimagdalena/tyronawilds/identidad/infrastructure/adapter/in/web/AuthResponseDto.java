package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;

import java.util.UUID;

public record AuthResponseDto(
        String accessToken,
        String tokenType,
        long expiresInMs,
        UUID usuarioId,
        String nombre,
        String email,
        RolUsuario rol,
        UUID prestadorId,
        String proveedorAuth
) {
    public static AuthResponseDto fromDomain(ResultadoAutenticacion r) {
        return new AuthResponseDto(
                r.accessToken(),
                r.tokenType(),
                r.expiresInMs(),
                r.usuarioId(),
                r.nombre(),
                r.email(),
                r.rol(),
                r.prestadorId(),
                r.proveedorAuth()
        );
    }
}
