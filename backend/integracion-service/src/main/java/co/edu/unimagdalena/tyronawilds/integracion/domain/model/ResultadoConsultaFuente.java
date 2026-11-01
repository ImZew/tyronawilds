package co.edu.unimagdalena.tyronawilds.integracion.domain.model;

public record ResultadoConsultaFuente<T>(
        String nombreFuente,
        T datos,
        boolean degradado,
        String fuenteDatos,
        String estadoCircuitBreaker
) {
}
