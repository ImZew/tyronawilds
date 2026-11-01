package co.edu.unimagdalena.tyronawilds.identidad.application.service;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.contratos.security.InputSanitizer;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.CredencialesInvalidasException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.ProveedorAuthNoHabilitadoException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.UsuarioYaExisteException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ProveedorAuth;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.Usuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.AutenticarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.ConsultarProveedoresAuthUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.RegistrarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.AuditoriaAuthEventPublisherPort;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.ProveedorAutenticacionStrategy;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.TokenProviderPort;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.UsuarioRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class IdentidadApplicationService implements
        RegistrarUsuarioUseCase,
        AutenticarUsuarioUseCase,
        ConsultarProveedoresAuthUseCase {

    private final UsuarioRepositoryPort usuarioRepositoryPort;
    private final TokenProviderPort tokenProviderPort;
    private final AuditoriaAuthEventPublisherPort auditoriaEventPublisherPort;
    private final PasswordEncoder passwordEncoder;
    private final Map<ProveedorAuth, ProveedorAutenticacionStrategy> estrategiasPorProveedor;
    private final List<String> proveedoresActivos;

    public IdentidadApplicationService(
            UsuarioRepositoryPort usuarioRepositoryPort,
            TokenProviderPort tokenProviderPort,
            AuditoriaAuthEventPublisherPort auditoriaEventPublisherPort,
            PasswordEncoder passwordEncoder,
            List<ProveedorAutenticacionStrategy> estrategias,
            @Value("${app.auth.proveedores:local,google}") String proveedoresConfigurados
    ) {
        this.usuarioRepositoryPort = usuarioRepositoryPort;
        this.tokenProviderPort = tokenProviderPort;
        this.auditoriaEventPublisherPort = auditoriaEventPublisherPort;
        this.passwordEncoder = passwordEncoder;
        this.estrategiasPorProveedor = estrategias.stream()
                .collect(Collectors.toMap(ProveedorAutenticacionStrategy::tipoProveedor, Function.identity()));
        this.proveedoresActivos = Arrays.stream(proveedoresConfigurados.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Override
    @Transactional
    public ResultadoAutenticacion registrar(ComandoRegistro comando) {
        verificarProveedorActivo(ProveedorAuth.LOCAL, comando.email(), comando.ipOrigen(), comando.traceId());

        String emailNormalizado = InputSanitizer.sanitizeEmail(comando.email());
        if (usuarioRepositoryPort.existePorEmail(emailNormalizado)) {
            throw new UsuarioYaExisteException(emailNormalizado);
        }

        RolUsuario rolAsignado = comando.rol() != null ? comando.rol() : RolUsuario.TURISTA;
        UUID prestadorId = (rolAsignado == RolUsuario.PRESTADOR || rolAsignado == RolUsuario.PEQUENO_OPERADOR)
                ? (comando.prestadorId() != null ? comando.prestadorId() : UUID.randomUUID())
                : null;

        Usuario nuevoUsuario = new Usuario(
                UUID.randomUUID(),
                InputSanitizer.sanitize(comando.nombre()),
                emailNormalizado,
                passwordEncoder.encode(comando.password()),
                rolAsignado,
                prestadorId,
                ProveedorAuth.LOCAL,
                comando.aceptaTratamientoDatos(),
                Instant.now()
        );

        Usuario guardado = usuarioRepositoryPort.guardar(nuevoUsuario);
        return emitirResultadoJwt(guardado);
    }

    @Override
    @Transactional
    public ResultadoAutenticacion autenticarLocal(ComandoLoginLocal comando) {
        verificarProveedorActivo(ProveedorAuth.LOCAL, comando.email(), comando.ipOrigen(), comando.traceId());

        ProveedorAutenticacionStrategy estrategia = obtenerEstrategia(ProveedorAuth.LOCAL);
        try {
            Usuario usuario = estrategia.autenticar(new ProveedorAutenticacionStrategy.SolicitudAutenticacion(
                    comando.email().trim().toLowerCase(),
                    comando.password(),
                    null
            ));
            return emitirResultadoJwt(usuario);
        } catch (CredencialesInvalidasException ex) {
            publicarFalloAutenticacion(comando.email(), "LOGIN_LOCAL", ex.getMessage(), comando.ipOrigen(), comando.traceId());
            throw ex;
        }
    }

    @Override
    @Transactional
    public ResultadoAutenticacion autenticarGoogle(ComandoLoginGoogle comando) {
        verificarProveedorActivo(ProveedorAuth.GOOGLE, comando.email(), comando.ipOrigen(), comando.traceId());

        ProveedorAutenticacionStrategy estrategia = obtenerEstrategia(ProveedorAuth.GOOGLE);
        try {
            Usuario usuario = estrategia.autenticar(new ProveedorAutenticacionStrategy.SolicitudAutenticacion(
                    comando.email().trim().toLowerCase(),
                    comando.googleIdToken(),
                    comando.nombre()
            ));
            return emitirResultadoJwt(usuario);
        } catch (CredencialesInvalidasException ex) {
            publicarFalloAutenticacion(comando.email(), "LOGIN_GOOGLE", ex.getMessage(), comando.ipOrigen(), comando.traceId());
            throw ex;
        }
    }

    @Override
    public List<String> obtenerProveedoresActivos() {
        return proveedoresActivos;
    }

    @Override
    public boolean estaHabilitado(String codigoProveedor) {
        if (codigoProveedor == null) {
            return false;
        }
        return proveedoresActivos.contains(codigoProveedor.trim().toLowerCase());
    }

    private void verificarProveedorActivo(ProveedorAuth proveedor, String email, String ipOrigen, String traceId) {
        if (!estaHabilitado(proveedor.getCodigoConfiguracion())) {
            publicarFalloAutenticacion(
                    email,
                    "PROVEEDOR_DESHABILITADO_" + proveedor.name(),
                    "Intento de uso de proveedor no habilitado en AUTH_PROVEEDORES: " + proveedor.getCodigoConfiguracion(),
                    ipOrigen,
                    traceId
            );
            throw new ProveedorAuthNoHabilitadoException(proveedor.getCodigoConfiguracion());
        }
    }

    private ProveedorAutenticacionStrategy obtenerEstrategia(ProveedorAuth proveedor) {
        ProveedorAutenticacionStrategy estrategia = estrategiasPorProveedor.get(proveedor);
        if (estrategia == null) {
            throw new ProveedorAuthNoHabilitadoException(proveedor.getCodigoConfiguracion());
        }
        return estrategia;
    }

    private ResultadoAutenticacion emitirResultadoJwt(Usuario usuario) {
        String jwt = tokenProviderPort.generarToken(usuario);
        return new ResultadoAutenticacion(
                jwt,
                "Bearer",
                tokenProviderPort.obtenerExpiracionMs(),
                usuario.id(),
                usuario.nombre(),
                usuario.email(),
                usuario.rol(),
                usuario.prestadorId(),
                usuario.proveedorAuth().name()
        );
    }

    private void publicarFalloAutenticacion(String email, String accion, String motivo, String ipOrigen, String traceId) {
        EventoAccesoDenegado evento = new EventoAccesoDenegado(
                UUID.randomUUID(),
                null,
                "ANONIMO",
                "identidad-service:/api/v1/auth (" + email + ")",
                accion,
                motivo,
                ipOrigen != null ? ipOrigen : "0.0.0.0",
                traceId != null ? traceId : UUID.randomUUID().toString(),
                Instant.now()
        );
        auditoriaEventPublisherPort.publicarAccesoDenegado(evento);
    }
}
