package co.edu.unimagdalena.tyronawilds.indicadores.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

public record IndicadorCapacidadDestino(
        UUID id,
        UUID actividadId,
        String nombreDestino,
        String zona,
        int capacidadMaxima,
        int ocupacionActual,
        BigDecimal porcentajeOcupacion,
        String estadoAlerta,
        String alternativaSostenibleSugerida,
        Instant ultimaActualizacion
) {

    public IndicadorCapacidadDestino incrementarOcupacionPorReserva(int cuposReservados) {
        int nuevaOcupacion = Math.min(capacidadMaxima, Math.max(0, ocupacionActual + cuposReservados));
        BigDecimal nuevoPorcentaje = BigDecimal.valueOf(nuevaOcupacion)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(Math.max(1, capacidadMaxima)), 2, RoundingMode.HALF_UP);

        String nuevoEstadoAlerta = calcularEstadoAlerta(nuevoPorcentaje.doubleValue());

        return new IndicadorCapacidadDestino(
                this.id,
                this.actividadId,
                this.nombreDestino,
                this.zona,
                this.capacidadMaxima,
                nuevaOcupacion,
                nuevoPorcentaje,
                nuevoEstadoAlerta,
                this.alternativaSostenibleSugerida,
                Instant.now()
        );
    }

    public static String calcularEstadoAlerta(double porcentaje) {
        if (porcentaje >= 80.0) {
            return "CRITICA";
        }
        if (porcentaje >= 60.0) {
            return "MODERADA";
        }
        return "NORMAL";
    }
}
