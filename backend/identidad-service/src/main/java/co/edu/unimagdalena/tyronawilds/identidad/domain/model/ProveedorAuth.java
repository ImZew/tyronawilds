package co.edu.unimagdalena.tyronawilds.identidad.domain.model;

public enum ProveedorAuth {
    LOCAL("local"),
    GOOGLE("google");

    private final String codigoConfiguracion;

    ProveedorAuth(String codigoConfiguracion) {
        this.codigoConfiguracion = codigoConfiguracion;
    }

    public String getCodigoConfiguracion() {
        return codigoConfiguracion;
    }

    public static ProveedorAuth fromString(String valor) {
        if (valor == null) {
            throw new IllegalArgumentException("El proveedor de autenticación no puede ser nulo");
        }
        String normalizado = valor.trim().toUpperCase();
        return switch (normalizado) {
            case "LOCAL" -> LOCAL;
            case "GOOGLE", "OAUTH2_GOOGLE" -> GOOGLE;
            default -> throw new IllegalArgumentException("Proveedor de autenticación desconocido: " + valor);
        };
    }
}
