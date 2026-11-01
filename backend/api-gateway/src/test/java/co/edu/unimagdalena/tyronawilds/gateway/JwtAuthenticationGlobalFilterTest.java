package co.edu.unimagdalena.tyronawilds.gateway;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.gateway.application.service.GatewaySecurityApplicationService;
import co.edu.unimagdalena.tyronawilds.gateway.infrastructure.adapter.in.web.JwtAuthenticationGlobalFilter;
import co.edu.unimagdalena.tyronawilds.gateway.infrastructure.config.JjwtTokenValidatorAdapter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationGlobalFilterTest {

    private static final String SECRET = "TyronaWildsSantaMartaCaribeSierraNevadaSecretKeyForHS256Auth2026!";

    private JwtAuthenticationGlobalFilter filter;
    private SecretKey secretKey;

    @BeforeEach
    void setUp() {
        secretKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        JjwtTokenValidatorAdapter validatorAdapter = new JjwtTokenValidatorAdapter(SECRET);
        GatewaySecurityApplicationService securityService = new GatewaySecurityApplicationService(validatorAdapter);
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        filter = new JwtAuthenticationGlobalFilter(securityService, objectMapper);
    }

    @Test
    @DisplayName("Debe permitir sin token las rutas públicas como GET /api/v1/ofertas y POST /api/v1/auth/login")
    void debePermitirRutasPublicasSinToken() {
        MockServerHttpRequest getOfertasRequest = MockServerHttpRequest
                .get("/api/v1/ofertas/destacadas")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(getOfertasRequest);

        AtomicReference<ServerWebExchange> capturedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            capturedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(capturedExchange.get()).isNotNull();
        assertThat(capturedExchange.get().getRequest().getHeaders().getFirst(SecurityHeaders.X_CORRELATION_ID))
                .isNotBlank();
    }

    @Test
    @DisplayName("Debe rechazar con 401 Unauthorized y ApiErrorResponse una ruta protegida sin token JWT")
    void debeRechazarRutaProtegidaSinToken() {
        MockServerHttpRequest putOfertaRequest = MockServerHttpRequest
                .put("/api/v1/ofertas/00000000-0000-0000-0000-000000000999")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(putOfertaRequest);

        GatewayFilterChain chain = ex -> Mono.empty();

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        String body = exchange.getResponse().getBodyAsString().block();
        assertThat(body).contains("\"status\":401");
        assertThat(body).contains("\"codigo\":\"NO_AUTORIZADO\"");
    }

    @Test
    @DisplayName("Debe validar JWT e inyectar X-User-Id, X-Rol, X-Prestador-Id y X-Correlation-Id (Secuencia 4.1)")
    void debeValidarJwtEInyectarSecurityHeaders() {
        String userId = "33333333-3333-3333-3333-333333333333";
        String prestadorId = "00000000-0000-0000-0000-000000000041";

        String jwt = Jwts.builder()
                .subject(userId)
                .claims(Map.of(
                        "email", "intruso@tyronawilds.co",
                        "rol", "PRESTADOR",
                        "prestadorId", prestadorId
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(secretKey)
                .compact();

        MockServerHttpRequest request = MockServerHttpRequest
                .put("/api/v1/ofertas/00000000-0000-0000-0000-000000000077")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt)
                .header(SecurityHeaders.X_CORRELATION_ID, "trace-secuencia-4-1")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> mutatedExchangeRef = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            mutatedExchangeRef.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(mutatedExchangeRef.get()).isNotNull();
        HttpHeaders mutatedHeaders = mutatedExchangeRef.get().getRequest().getHeaders();
        assertThat(mutatedHeaders.getFirst(SecurityHeaders.X_USER_ID)).isEqualTo(userId);
        assertThat(mutatedHeaders.getFirst(SecurityHeaders.X_ROL)).isEqualTo("PRESTADOR");
        assertThat(mutatedHeaders.getFirst(SecurityHeaders.X_PRESTADOR_ID)).isEqualTo(prestadorId);
        assertThat(mutatedHeaders.getFirst(SecurityHeaders.X_CORRELATION_ID)).isEqualTo("trace-secuencia-4-1");
    }
}
