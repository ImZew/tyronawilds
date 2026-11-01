package co.edu.unimagdalena.tyronawilds.indicadores.application.service;

import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.IndicadorCapacidadDestino;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.ReporteSostenibilidadTerritorial;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.port.in.ConsultarIndicadoresUseCase;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.port.out.IndicadorCapacidadRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class IndicadoresApplicationService implements ConsultarIndicadoresUseCase {

    private final IndicadorCapacidadRepositoryPort repositoryPort;

    public IndicadoresApplicationService(IndicadorCapacidadRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    @Override
    @Transactional(readOnly = true)
    public List<IndicadorCapacidadDestino> listarIndicadoresCapacidad(String estadoAlerta) {
        if (estadoAlerta != null && !estadoAlerta.isBlank()) {
            return repositoryPort.buscarPorEstadoAlerta(estadoAlerta.trim().toUpperCase());
        }
        return repositoryPort.buscarTodos();
    }

    @Override
    @Transactional(readOnly = true)
    public ReporteSostenibilidadTerritorial generarReporteSostenibilidad() {
        List<IndicadorCapacidadDestino> todos = repositoryPort.buscarTodos();
        int total = todos.size();
        int criticos = (int) todos.stream().filter(i -> "CRITICA".equalsIgnoreCase(i.estadoAlerta())).count();
        int moderados = (int) todos.stream().filter(i -> "MODERADA".equalsIgnoreCase(i.estadoAlerta())).count();
        int normales = total - criticos - moderados;

        BigDecimal promedio = total == 0
                ? BigDecimal.ZERO
                : todos.stream()
                        .map(IndicadorCapacidadDestino::porcentajeOcupacion)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

        String recomendacion = criticos > 0
                ? "ALERTA ACTIVA (RF-10 / RF-11): Redirigir flujo turístico desde Cabo San Juan (Tayrona) hacia Minca, Bonda y Río Don Diego."
                : "Capacidad de carga territorial dentro de umbrales sostenibles.";

        return new ReporteSostenibilidadTerritorial(
                total,
                criticos,
                moderados,
                normales,
                promedio,
                recomendacion,
                todos,
                Instant.now()
        );
    }

    @Override
    @Transactional
    public IndicadorCapacidadDestino procesarReservaConfirmada(UUID actividadId, int cuposReservados, String traceId) {
        return repositoryPort.buscarPorActividadId(actividadId)
                .map(existente -> {
                    IndicadorCapacidadDestino actualizado = existente.incrementarOcupacionPorReserva(cuposReservados);
                    return repositoryPort.guardar(actualizado);
                })
                .orElseGet(() -> {
                    IndicadorCapacidadDestino nuevo = new IndicadorCapacidadDestino(
                            UUID.randomUUID(),
                            actividadId,
                            "Expedición Registrada (" + actividadId.toString().substring(0, 8) + ")",
                            "Distrito Turístico de Santa Marta",
                            100,
                            cuposReservados,
                            BigDecimal.valueOf(cuposReservados),
                            IndicadorCapacidadDestino.calcularEstadoAlerta(cuposReservados),
                            "Minca & Corregimiento de Bonda",
                            Instant.now()
                    );
                    return repositoryPort.guardar(nuevo);
                });
    }
}
