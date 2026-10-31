package co.edu.unimagdalena.tyronawilds.identidad;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.application.service.GoogleOAuth2ProveedorAutenticacionStrategy;
import co.edu.unimagdalena.tyronawilds.identidad.application.service.IdentidadApplicationService;
import co.edu.unimagdalena.tyronawilds.identidad.application.service.LocalProveedorAutenticacionStrategy;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.CredencialesInvalidasException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.ProveedorAuthNoHabilitadoException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ProveedorAuth;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.Usuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.AutenticarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.RegistrarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.AuditoriaAuthEventPublisherPort;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.UsuarioRepositoryPort;
import co.edu.unimagdalena.tyronawilds.identidad.infrastructure.config.JwtTokenProviderAdapter;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentidadApplicationServiceTest {

    private static final String TEST_SECRET = "TyronaWildsSantaMartaCaribeSierraNevadaSecretKeyForHS256Auth2026!";
    private static final long EXPIRATION_MS = 86400000L;

    @Mock
    private UsuarioRepositoryPort usuarioRepositoryPort;

    @Mock
    private AuditoriaAuthEventPublisherPort auditoriaEventPublisherPort;

    private PasswordEncoder passwordEncoder;
    private JwtTokenProviderAdapter jwtTokenProviderAdapter;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        jwtTokenProviderAdapter = new JwtTokenProviderAdapter(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("Debe autenticar un prestador local y emitir JWT con claims sub, email, rol y prestadorId")
    void debeAutenticarPrestadorLocalYGenerarJwtConClaims() {
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID prestadorId = UUID.fromString("00000000-0000-0000-0000-000000000077");
        Usuario prestador = new Usuario(
                userId,
                "Expediciones Tayrona Ancestral",
                "tayrona@tyronawilds.co",
                passwordEncoder.encode("Tyrona2026*"),
                RolUsuario.PRESTADOR,
                prestadorId,
                ProveedorAuth.LOCAL,
                true,
                Instant.now()
        );

        when(usuarioRepositoryPort.buscarPorEmail("tayrona@tyronawilds.co")).thenReturn(Optional.of(prestador));

        IdentidadApplicationService service = crearServicioConProveedores("local,google");

        ResultadoAutenticacion resultado = service.autenticarLocal(
                new AutenticarUsuarioUseCase.ComandoLoginLocal(
                        "tayrona@tyronawilds.co",
                        "Tyrona2026*",
                        "127.0.0.1",
                        "trace-test-01"
                )
        );

        assertThat(resultado.accessToken()).isNotBlank();
        assertThat(resultado.rol()).isEqualTo(RolUsuario.PRESTADOR);
        assertThat(resultado.prestadorId()).isEqualTo(prestadorId);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(resultado.accessToken())
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("tayrona@tyronawilds.co");
        assertThat(claims.get("rol", String.class)).isEqualTo("PRESTADOR");
        assertThat(claims.get("prestadorId", String.class)).isEqualTo(prestadorId.toString());
    }

    @Test
    @DisplayName("Debe rechazar login Google y publicar evento de auditoría cuando AUTH_PROVEEDORES solo tiene 'local'")
    void debeRechazarProveedorGoogleCuandoNoEstaHabilitadoEnVariabilidad() {
        IdentidadApplicationService service = crearServicioConProveedores("local");

        assertThatThrownBy(() -> service.autenticarGoogle(
                new AutenticarUsuarioUseCase.ComandoLoginGoogle(
                        "google-id-token-valido",
                        "viajero@gmail.com",
                        "Viajero Caribe",
                        "127.0.0.1",
                        "trace-variabilidad-02"
                )
        )).isInstanceOf(ProveedorAuthNoHabilitadoException.class)
                .hasMessageContaining("google");

        verify(auditoriaEventPublisherPort).publicarAccesoDenegado(any());
    }

    @Test
    @DisplayName("Debe rechazar credenciales inválidas y publicar EventoAccesoDenegado en RabbitMQ")
    void debeRechazarPasswordIncorrectoYPublicarEventoAuditoria() {
        Usuario turista = new Usuario(
                UUID.randomUUID(),
                "Valeria Viajera",
                "turista@tyronawilds.co",
                passwordEncoder.encode("Tyrona2026*"),
                RolUsuario.TURISTA,
                null,
                ProveedorAuth.LOCAL,
                true,
                Instant.now()
        );
        when(usuarioRepositoryPort.buscarPorEmail("turista@tyronawilds.co")).thenReturn(Optional.of(turista));

        IdentidadApplicationService service = crearServicioConProveedores("local,google");

        assertThatThrownBy(() -> service.autenticarLocal(
                new AutenticarUsuarioUseCase.ComandoLoginLocal(
                        "turista@tyronawilds.co",
                        "ClaveErronea999",
                        "192.168.1.10",
                        "trace-fallo-03"
                )
        )).isInstanceOf(CredencialesInvalidasException.class);

        verify(auditoriaEventPublisherPort).publicarAccesoDenegado(any());
    }

    @Test
    @DisplayName("Debe registrar un nuevo usuario turista y emitir el mismo formato invariante de JWT")
    void debeRegistrarNuevoUsuarioTurista() {
        when(usuarioRepositoryPort.existePorEmail("nuevo@tyronawilds.co")).thenReturn(false);
        when(usuarioRepositoryPort.guardar(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        IdentidadApplicationService service = crearServicioConProveedores("local,google");

        ResultadoAutenticacion resultado = service.registrar(
                new RegistrarUsuarioUseCase.ComandoRegistro(
                        "Carlos Explorador",
                        "nuevo@tyronawilds.co",
                        "Tyrona2026*",
                        RolUsuario.TURISTA,
                        null,
                        true,
                        "127.0.0.1",
                        "trace-reg-04"
                )
        );

        assertThat(resultado.email()).isEqualTo("nuevo@tyronawilds.co");
        assertThat(resultado.rol()).isEqualTo(RolUsuario.TURISTA);
        assertThat(resultado.accessToken()).isNotBlank();
    }

    private IdentidadApplicationService crearServicioConProveedores(String proveedoresConfig) {
        LocalProveedorAutenticacionStrategy localStrategy =
                new LocalProveedorAutenticacionStrategy(usuarioRepositoryPort, passwordEncoder);
        GoogleOAuth2ProveedorAutenticacionStrategy googleStrategy =
                new GoogleOAuth2ProveedorAutenticacionStrategy(usuarioRepositoryPort);

        return new IdentidadApplicationService(
                usuarioRepositoryPort,
                jwtTokenProviderAdapter,
                auditoriaEventPublisherPort,
                passwordEncoder,
                List.of(localStrategy, googleStrategy),
                proveedoresConfig
        );
    }
}
