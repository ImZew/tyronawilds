package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.identidad.domain.model.Usuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.TokenProviderPort;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProviderAdapter implements TokenProviderPort {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtTokenProviderAdapter(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    @Override
    public String generarToken(Usuario usuario) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + expirationMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", usuario.email());
        claims.put("rol", usuario.rol().name());
        claims.put("nombre", usuario.nombre());
        if (usuario.prestadorId() != null) {
            claims.put("prestadorId", usuario.prestadorId().toString());
        }

        return Jwts.builder()
                .subject(usuario.id().toString())
                .claims(claims)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(secretKey)
                .compact();
    }

    @Override
    public long obtenerExpiracionMs() {
        return expirationMs;
    }
}
