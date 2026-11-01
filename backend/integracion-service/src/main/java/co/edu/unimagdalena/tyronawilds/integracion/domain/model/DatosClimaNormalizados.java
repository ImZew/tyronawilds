package co.edu.unimagdalena.tyronawilds.integracion.domain.model;

public record DatosClimaNormalizados(
        String estacion,
        double temperaturaCelsius,
        int humedadRelativaPorcentaje,
        String condicion,
        double probabilidadLluviaPorcentaje,
        String alertaMeteorologica
) {
}
