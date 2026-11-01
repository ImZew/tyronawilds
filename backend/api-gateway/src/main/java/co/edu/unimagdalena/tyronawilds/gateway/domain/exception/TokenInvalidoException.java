package co.edu.unimagdalena.tyronawilds.gateway.domain.exception;

public class TokenInvalidoException extends RuntimeException {
    public TokenInvalidoException(String mensaje) {
        super(mensaje);
    }
}
