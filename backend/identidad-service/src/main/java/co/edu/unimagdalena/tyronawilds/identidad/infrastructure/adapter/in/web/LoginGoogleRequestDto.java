package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginGoogleRequestDto(
        @NotBlank(message = "El idToken de Google OAuth2 es obligatorio")
        String idToken,

        @NotBlank(message = "El correo electrónico asociado a Google es obligatorio")
        @Email(message = "El formato del correo electrónico no es válido")
        String email,

        String nombre
) {
}
