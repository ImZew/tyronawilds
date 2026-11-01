package co.edu.unimagdalena.tyronawilds.indicadores.domain.port.in;

import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.IndicadorCapacidadDestino;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.ReporteSostenibilidadTerritorial;

import java.util.List;
import java.util.UUID;

public interface ConsultarIndicadoresUseCase {

    List<IndicadorCapacidadDestino> listarIndicadoresCapacidad(String estadoAlerta);

    ReporteSostenibilidadTerritorial generarReporteSostenibilidad();

    IndicadorCapacidadDestino procesarReservaConfirmada(UUID actividadId, int cuposReservados, String traceId);
}
