package co.edu.unimagdalena.tyronawilds.gateway.application.service;

import co.edu.unimagdalena.tyronawilds.gateway.domain.exception.TokenInvalidoException;
import co.edu.unimagdalena.tyronawilds.gateway.domain.model.TokenClaims;
import co.edu.unimagdalena.tyronawilds.gateway.domain.port.in.ValidarTokenGatewayUseCase;
import co.edu.unimagdalena.tyronawilds.gateway.domain.port.out.JwtTokenValidatorPort;
import org.springframework.stereotype.Service;
import org.springframework.util.AntPathMatcher;

import java.util.List;

@Service
public class GatewaySecurityApplicationService implements ValidarTokenGatewayUseCase {

    private static final String BEARER_PREFIX = "Bearer ";

    private static final List<String> PUBLIC_GET_PATTERNS = List.of(
            "/api/v1/auth/proveedores-activos",
            "/api/v1/ofertas",
            "/api/v1/ofertas/**",
            "/api/v1/actividades",
            "/api/v1/actividades/**",
            "/api/v1/disponibilidad",
            "/api/v1/disponibilidad/**",
            "/api/v1/contexto",
            "/api/v1/contexto/**"
    );

    private static final List<String> PUBLIC_POST_PATTERNS = List.of(
            "/api/v1/auth/**"
    );

    private final JwtTokenValidatorPort jwtTokenValidatorPort;
    private final AntPathMatcher pathMatcher;

    public GatewaySecurityApplicationService(JwtTokenValidatorPort jwtTokenValidatorPort) {
        this.jwtTokenValidatorPort = jwtTokenValidatorPort;
        this.pathMatcher = new AntPathMatcher();
    }

    @Override
    public boolean esRutaPublica(String metodoHttp, String path) {
        if (metodoHttp == null || path == null) {
            return false;
        }
        String method = metodoHttp.trim().toUpperCase();
        if ("OPTIONS".equals(method)) {
            return true;
        }
        if ("POST".equals(method)) {
            return PUBLIC_POST_PATTERNS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
        }
        if ("GET".equals(method)) {
            return PUBLIC_GET_PATTERNS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
        }
        return false;
    }

    @Override
    public TokenClaims validarYExtraerClaims(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new TokenInvalidoException("Cabecera Authorization Bearer ausente o con formato inválido.");
        }
        String rawJwt = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (rawJwt.isEmpty()) {
            throw new TokenInvalidoException("El token JWT proporcionado está vacío.");
        }
        return jwtTokenValidatorPort.parsearYValidar(rawJwt);
    }
}
