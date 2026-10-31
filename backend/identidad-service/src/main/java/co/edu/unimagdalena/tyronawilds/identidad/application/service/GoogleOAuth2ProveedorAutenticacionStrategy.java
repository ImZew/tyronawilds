package co.edu.unimagdalena.tyronawilds.identidad.application.service;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.CredencialesInvalidasException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ProveedorAuth;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.Usuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.ProveedorAutenticacionStrategy;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.UsuarioRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class GoogleOAuth2ProveedorAutenticacionStrategy implements ProveedorAutenticacionStrategy {

    private final UsuarioRepositoryPort usuarioRepositoryPort;

    public GoogleOAuth2ProveedorAutenticacionStrategy(UsuarioRepositoryPort usuarioRepositoryPort) {
        this.usuarioRepositoryPort = usuarioRepositoryPort;
    }

    @Override
    public ProveedorAuth tipoProveedor() {
        return ProveedorAuth.GOOGLE;
    }

    @Override
    public Usuario autenticar(SolicitudAutenticacion solicitud) {
        if (solicitud.credencialSecreta() == null || solicitud.credencialSecreta().isBlank()
                || "INVALID_GOOGLE_TOKEN".equalsIgnoreCase(solicitud.credencialSecreta().trim())) {
            throw new CredencialesInvalidasException("El token de identidad de Google OAuth2 es inválido o ha expirado.");
        }

        return usuarioRepositoryPort.buscarPorEmail(solicitud.email())
                .orElseGet(() -> {
                    String nombre = (solicitud.nombreOpcional() != null && !solicitud.nombreOpcional().isBlank())
                            ? solicitud.nombreOpcional().trim()
                            : "Turista Google (" + solicitud.email() + ")";
                    Usuario nuevoUsuarioOAuth = new Usuario(
                            UUID.randomUUID(),
                            nombre,
                            solicitud.email(),
                            null,
                            RolUsuario.TURISTA,
                            null,
                            ProveedorAuth.GOOGLE,
                            true,
                            Instant.now()
                    );
                    return usuarioRepositoryPort.guardar(nuevoUsuarioOAuth);
                });
    }
}
