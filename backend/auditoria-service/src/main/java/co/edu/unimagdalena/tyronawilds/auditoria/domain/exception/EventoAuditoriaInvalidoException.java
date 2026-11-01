package co.edu.unimagdalena.tyronawilds.auditoria.domain.exception;

public class EventoAuditoriaInvalidoException extends RuntimeException {
    public EventoAuditoriaInvalidoException(String mensaje) {
        super(mensaje);
    }
}
