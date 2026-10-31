package co.edu.unimagdalena.tyronawilds.identidad.domain.exception;

public class UsuarioYaExisteException extends RuntimeException {
    public UsuarioYaExisteException(String email) {
        super("Ya existe una cuenta registrada con el correo electrónico: " + email);
    }
}
