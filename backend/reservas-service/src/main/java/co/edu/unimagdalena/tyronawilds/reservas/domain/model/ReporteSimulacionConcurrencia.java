package co.edu.unimagdalena.tyronawilds.reservas.domain.model;

import java.util.UUID;

public record ReporteSimulacionConcurrencia(
        UUID disponibilidadId,
        String nombreActividad,
        int totalHilosConcurrentes,
        int cuposIniciales,
        int reservasExitosasConfirmadas,
        int conflictos409Bloqueados,
        int cuposFinalesRestantes,
        boolean sobreasignacionDetectada,
        long tiempoTotalEjecucionMs,
        String mecanismoProteccion
) {
}
