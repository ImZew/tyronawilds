package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.AutenticarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.ConsultarProveedoresAuthUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.RegistrarUsuarioUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegistrarUsuarioUseCase registrarUsuarioUseCase;
    private final AutenticarUsuarioUseCase autenticarUsuarioUseCase;
    private final ConsultarProveedoresAuthUseCase consultarProveedoresAuthUseCase;

    public AuthController(
            RegistrarUsuarioUseCase registrarUsuarioUseCase,
            AutenticarUsuarioUseCase autenticarUsuarioUseCase,
            ConsultarProveedoresAuthUseCase consultarProveedoresAuthUseCase
    ) {
        this.registrarUsuarioUseCase = registrarUsuarioUseCase;
        this.autenticarUsuarioUseCase = autenticarUsuarioUseCase;
        this.consultarProveedoresAuthUseCase = consultarProveedoresAuthUseCase;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(
            @Valid @RequestBody RegistroRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        String traceId = correlationId != null ? correlationId : UUID.randomUUID().toString();
        ResultadoAutenticacion resultado = registrarUsuarioUseCase.registrar(new RegistrarUsuarioUseCase.ComandoRegistro(
                request.nombre(),
                request.email(),
                request.password(),
                request.rol(),
                request.prestadorId(),
                request.aceptaTratamientoDatos(),
                servletRequest.getRemoteAddr(),
                traceId
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponseDto.fromDomain(resultado));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> loginLocal(
            @Valid @RequestBody LoginLocalRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        String traceId = correlationId != null ? correlationId : UUID.randomUUID().toString();
        ResultadoAutenticacion resultado = autenticarUsuarioUseCase.autenticarLocal(
                new AutenticarUsuarioUseCase.ComandoLoginLocal(
                        request.email(),
                        request.password(),
                        servletRequest.getRemoteAddr(),
                        traceId
                )
        );
        return ResponseEntity.ok(AuthResponseDto.fromDomain(resultado));
    }

    @PostMapping("/oauth2/google")
    public ResponseEntity<AuthResponseDto> loginGoogle(
            @Valid @RequestBody LoginGoogleRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        String traceId = correlationId != null ? correlationId : UUID.randomUUID().toString();
        ResultadoAutenticacion resultado = autenticarUsuarioUseCase.autenticarGoogle(
                new AutenticarUsuarioUseCase.ComandoLoginGoogle(
                        request.idToken(),
                        request.email(),
                        request.nombre(),
                        servletRequest.getRemoteAddr(),
                        traceId
                )
        );
        return ResponseEntity.ok(AuthResponseDto.fromDomain(resultado));
    }

    @GetMapping("/proveedores-activos")
    public ResponseEntity<ProveedoresActivosResponseDto> obtenerProveedoresActivos() {
        return ResponseEntity.ok(new ProveedoresActivosResponseDto(
                "PROVEEDOR_AUTENTICACION",
                consultarProveedoresAuthUseCase.obtenerProveedoresActivos()
        ));
    }
}
