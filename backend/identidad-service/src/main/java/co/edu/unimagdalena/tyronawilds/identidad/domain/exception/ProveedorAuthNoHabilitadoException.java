package co.edu.unimagdalena.tyronawilds.identidad.domain.exception;

public class ProveedorAuthNoHabilitadoException extends RuntimeException {
    public ProveedorAuthNoHabilitadoException(String proveedor) {
        super("El proveedor de autenticación '" + proveedor + "' no se encuentra habilitado en esta instancia (AUTH_PROVEEDORES).");
    }
}
