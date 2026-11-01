package co.edu.unimagdalena.tyronawilds.gateway.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.gateway.domain.exception.TokenInvalidoException;
import co.edu.unimagdalena.tyronawilds.gateway.domain.model.TokenClaims;
import co.edu.unimagdalena.tyronawilds.gateway.domain.port.out.JwtTokenValidatorPort;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JjwtTokenValidatorAdapter implements JwtTokenValidatorPort {

    private final SecretKey secretKey;

    public JjwtTokenValidatorAdapter(@Value("${app.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public TokenClaims parsearYValidar(String rawJwt) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(rawJwt)
                    .getPayload();

            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            String rol = claims.get("rol", String.class);
            String prestadorId = claims.get("prestadorId", String.class);

            if (userId == null || userId.isBlank() || rol == null || rol.isBlank()) {
                throw new TokenInvalidoException("El token JWT no contiene los claims obligatorios (sub, rol).");
            }

            return new TokenClaims(userId, email, rol, prestadorId);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new TokenInvalidoException("Token JWT inválido o expirado.");
        }
    }
}
