package co.edu.unimagdalena.tyronawilds.integracion.domain.exception;

public class FuenteExternaNoDisponibleException extends RuntimeException {
    public FuenteExternaNoDisponibleException(String fuente, String detalle) {
        super("Fallo en fuente externa '" + fuente + "' (ER-01): " + detalle);
    }
}
