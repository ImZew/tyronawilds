package co.edu.unimagdalena.tyronawilds.oferta.domain.model;

import java.util.UUID;

public record Prestador(
        UUID id,
        long codigoPublico,
        String nombre,
        String tipoOperador,
        String emailContacto,
        boolean activo
) {
}
