package co.edu.unimagdalena.tyronawilds.indicadores.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ReporteSostenibilidadTerritorial(
        int totalDestinosMonitoreados,
        int destinosEnAlertaCritica,
        int destinosEnAlertaModerada,
        int destinosEnEstadoNormal,
        BigDecimal promedioOcupacionTerritorial,
        String recomendacionEstrategicaDistrital,
        List<IndicadorCapacidadDestino> detalleDestinos,
        Instant fechaGeneracion
) {
}
