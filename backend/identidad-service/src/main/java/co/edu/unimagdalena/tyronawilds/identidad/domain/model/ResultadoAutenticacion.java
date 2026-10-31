package co.edu.unimagdalena.tyronawilds.identidad.domain.model;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;

import java.util.UUID;

public record ResultadoAutenticacion(
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
}
