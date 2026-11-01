package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

public record ContextoTerritorialResumen(
        double temperaturaCelsius,
        String condicionClimatica,
        int ocupacionTayronaPorcentaje,
        String zonaRecomendadaDesconcentracion,
        boolean degradado,
        String fuenteDatos
) {
}
