package co.edu.unimagdalena.tyronawilds.identidad.domain.model;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;

import java.time.Instant;
import java.util.UUID;

public record Usuario(
        UUID id,
        String nombre,
        String email,
        String passwordHash,
        RolUsuario rol,
        UUID prestadorId,
        ProveedorAuth proveedorAuth,
        boolean aceptaTratamientoDatos,
        Instant creadoEn
) {
}
