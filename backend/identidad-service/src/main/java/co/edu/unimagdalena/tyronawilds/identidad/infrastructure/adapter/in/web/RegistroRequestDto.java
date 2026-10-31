package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RegistroRequestDto(
        @NotBlank(message = "El nombre completo es obligatorio")
        @Size(max = 120, message = "El nombre no puede exceder 120 caracteres")
        String nombre,

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "El formato del correo electrónico no es válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
        String password,

        RolUsuario rol,

        UUID prestadorId,

        @AssertTrue(message = "Debe aceptar expresamente la política de tratamiento de datos personales (RNF-10 / Ley 1581)")
        boolean aceptaTratamientoDatos
) {
}
