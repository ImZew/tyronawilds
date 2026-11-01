package co.edu.unimagdalena.tyronawilds.gateway.domain.model;

public record TokenClaims(
        String userId,
        String email,
        String rol,
        String prestadorId
) {
}
