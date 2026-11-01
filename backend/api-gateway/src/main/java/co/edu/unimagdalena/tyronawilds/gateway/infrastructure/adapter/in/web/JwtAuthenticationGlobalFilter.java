package co.edu.unimagdalena.tyronawilds.gateway.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.errores.ApiErrorResponse;
import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.gateway.domain.exception.TokenInvalidoException;
import co.edu.unimagdalena.tyronawilds.gateway.domain.model.TokenClaims;
import co.edu.unimagdalena.tyronawilds.gateway.domain.port.in.ValidarTokenGatewayUseCase;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class JwtAuthenticationGlobalFilter implements GlobalFilter, Ordered {

    private final ValidarTokenGatewayUseCase validarTokenGatewayUseCase;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationGlobalFilter(
            ValidarTokenGatewayUseCase validarTokenGatewayUseCase,
            ObjectMapper objectMapper
    ) {
        this.validarTokenGatewayUseCase = validarTokenGatewayUseCase;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String method = request.getMethod() != null ? request.getMethod().name() : "GET";
        String path = request.getURI().getPath();
        String traceId = resolverCorrelationId(request);

        exchange.getResponse().getHeaders().set(SecurityHeaders.X_CORRELATION_ID, traceId);

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (validarTokenGatewayUseCase.esRutaPublica(method, path)) {
            ServerHttpRequest.Builder mutatedBuilder = request.mutate()
                    .header(SecurityHeaders.X_CORRELATION_ID, traceId);

            // Si en una ruta pública envían un token válido opcional, propagamos contexto
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    TokenClaims claims = validarTokenGatewayUseCase.validarYExtraerClaims(authHeader);
                    inyectarCabecerasSeguridad(mutatedBuilder, claims);
                } catch (TokenInvalidoException ignored) {
                    // En ruta pública no bloqueamos si el header opcional no es requerido
                }
            }
            return chain.filter(exchange.mutate().request(mutatedBuilder.build()).build());
        }

        try {
            TokenClaims claims = validarTokenGatewayUseCase.validarYExtraerClaims(authHeader);
            ServerHttpRequest.Builder mutatedBuilder = request.mutate()
                    .header(SecurityHeaders.X_CORRELATION_ID, traceId);
            inyectarCabecerasSeguridad(mutatedBuilder, claims);

            return chain.filter(exchange.mutate().request(mutatedBuilder.build()).build());
        } catch (TokenInvalidoException ex) {
            return responderNoAutorizado(exchange, path, traceId, ex.getMessage());
        }
    }

    private void inyectarCabecerasSeguridad(ServerHttpRequest.Builder builder, TokenClaims claims) {
        builder.headers(httpHeaders -> {
            httpHeaders.remove(SecurityHeaders.X_USER_ID);
            httpHeaders.remove(SecurityHeaders.X_ROL);
            httpHeaders.remove(SecurityHeaders.X_PRESTADOR_ID);
            httpHeaders.set(SecurityHeaders.X_USER_ID, claims.userId());
            httpHeaders.set(SecurityHeaders.X_ROL, claims.rol());
            if (claims.prestadorId() != null && !claims.prestadorId().isBlank()) {
                httpHeaders.set(SecurityHeaders.X_PRESTADOR_ID, claims.prestadorId());
            }
        });
    }

    private Mono<Void> responderNoAutorizado(
            ServerWebExchange exchange,
            String path,
            String traceId,
            String mensaje
    ) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiErrorResponse errorResponse = ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                "NO_AUTORIZADO",
                mensaje,
                path,
                traceId
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            String fallback = "{\"status\":401,\"codigo\":\"NO_AUTORIZADO\",\"mensaje\":\"" + mensaje + "\"}";
            bytes = fallback.getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private String resolverCorrelationId(ServerHttpRequest request) {
        String correlationHeader = request.getHeaders().getFirst(SecurityHeaders.X_CORRELATION_ID);
        return (correlationHeader != null && !correlationHeader.isBlank())
                ? correlationHeader
                : UUID.randomUUID().toString();
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
