package co.edu.unimagdalena.tyronawilds.identidad.application.service;

import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.CredencialesInvalidasException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ProveedorAuth;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.Usuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.ProveedorAutenticacionStrategy;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.UsuarioRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class LocalProveedorAutenticacionStrategy implements ProveedorAutenticacionStrategy {

    private final UsuarioRepositoryPort usuarioRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    public LocalProveedorAutenticacionStrategy(
            UsuarioRepositoryPort usuarioRepositoryPort,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepositoryPort = usuarioRepositoryPort;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public ProveedorAuth tipoProveedor() {
        return ProveedorAuth.LOCAL;
    }

    @Override
    public Usuario autenticar(SolicitudAutenticacion solicitud) {
        Usuario usuario = usuarioRepositoryPort.buscarPorEmail(solicitud.email())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales inválidas para el correo suministrado."));

        if (usuario.passwordHash() == null || !passwordEncoder.matches(solicitud.credencialSecreta(), usuario.passwordHash())) {
            throw new CredencialesInvalidasException("Credenciales inválidas para el correo suministrado.");
        }

        return usuario;
    }
}
