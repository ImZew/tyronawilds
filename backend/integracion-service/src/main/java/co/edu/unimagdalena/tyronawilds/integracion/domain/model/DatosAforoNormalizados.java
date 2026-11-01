package co.edu.unimagdalena.tyronawilds.integracion.domain.model;

import java.util.List;

public record DatosAforoNormalizados(
        int ocupacionPromedioTayronaPorcentaje,
        String estadoCapacidadParque,
        String zonaRecomendadaDesconcentracion,
        List<AforoZona> zonasMonitoreadas
) {
    public record AforoZona(
            String codigoZona,
            String nombreZona,
            int ocupacionPorcentaje,
            int capacidadMaximaDiaria,
            String nivelAlerta
    ) {
    }
}
