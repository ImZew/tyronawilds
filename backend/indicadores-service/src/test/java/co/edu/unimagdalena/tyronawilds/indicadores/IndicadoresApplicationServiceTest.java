package co.edu.unimagdalena.tyronawilds.indicadores;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.indicadores.application.service.IndicadoresApplicationService;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.IndicadorCapacidadDestino;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.ReporteSostenibilidadTerritorial;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.port.out.IndicadorCapacidadRepositoryPort;
import co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.adapter.in.messaging.IndicadoresReservaConsumerAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IndicadoresApplicationServiceTest {

    @Mock
    private IndicadorCapacidadRepositoryPort repositoryPort;

    private IndicadoresApplicationService service;
    private IndicadoresReservaConsumerAdapter consumerAdapter;

    @BeforeEach
    void setUp() {
        service = new IndicadoresApplicationService(repositoryPort);
        consumerAdapter = new IndicadoresReservaConsumerAdapter(service);
    }

    @Test
    @DisplayName("RF-10 / RF-11: Al recibir EventoReservaConfirmada actualiza la ocupación y eleva la alerta a CRITICA si supera el 80%")
    void debeActualizarOcupacionYActivarAlertaCriticaAlSuperarUmbral() {
        UUID actividadId = UUID.fromString("a0000000-0000-0000-0000-000000000004");
        IndicadorCapacidadDestino islaAguja = new IndicadorCapacidadDestino(
                UUID.randomUUID(),
                actividadId,
                "INMERSIÓN CORALINA ISLA AGUJA & GRANATE",
                "Taganga / Bahía de Granate",
                100,
                76,
                new BigDecimal("76.00"),
                "MODERADA",
                "Travesía Nocturna Centro Histórico",
                Instant.now()
        );

        when(repositoryPort.buscarPorActividadId(actividadId)).thenReturn(Optional.of(islaAguja));
        when(repositoryPort.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        EventoReservaConfirmada evento = new EventoReservaConfirmada(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                actividadId,
                UUID.randomUUID(),
                6, // 76 + 6 = 82% -> pasa de MODERADA a CRITICA
                2,
                new BigDecimal("2040000.00"),
                LocalDate.of(2026, 11, 15),
                "trace-indicadores-01",
                Instant.now()
        );

        consumerAdapter.onEventoReservaConfirmada(evento);

        ArgumentCaptor<IndicadorCapacidadDestino> captor = ArgumentCaptor.forClass(IndicadorCapacidadDestino.class);
        verify(repositoryPort).guardar(captor.capture());

        IndicadorCapacidadDestino guardado = captor.getValue();
        assertThat(guardado.ocupacionActual()).isEqualTo(82);
        assertThat(guardado.porcentajeOcupacion()).isEqualByComparingTo("82.00");
        assertThat(guardado.estadoAlerta()).isEqualTo("CRITICA");
    }

    @Test
    @DisplayName("RF-09 / CU-07: Debe generar el reporte consolidado de sostenibilidad territorial")
    void debeGenerarReporteSostenibilidadTerritorial() {
        when(repositoryPort.buscarTodos()).thenReturn(List.of(
                new IndicadorCapacidadDestino(
                        UUID.randomUUID(),
                        UUID.fromString("a0000000-0000-0000-0000-000000000002"),
                        "CABO SAN JUAN & SENDERO NUIJPIA",
                        "Parque Tayrona",
                        500,
                        440,
                        new BigDecimal("88.00"),
                        "CRITICA",
                        "Minca / Bonda",
                        Instant.now()
                ),
                new IndicadorCapacidadDestino(
                        UUID.randomUUID(),
                        UUID.fromString("a0000000-0000-0000-0000-000000000003"),
                        "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
                        "Minca / Bonda",
                        300,
                        84,
                        new BigDecimal("28.00"),
                        "NORMAL",
                        "Ruta Cafetera",
                        Instant.now()
                )
        ));

        ReporteSostenibilidadTerritorial reporte = service.generarReporteSostenibilidad();

        assertThat(reporte.totalDestinosMonitoreados()).isEqualTo(2);
        assertThat(reporte.destinosEnAlertaCritica()).isEqualTo(1);
        assertThat(reporte.destinosEnEstadoNormal()).isEqualTo(1);
        assertThat(reporte.promedioOcupacionTerritorial()).isEqualByComparingTo("58.00");
        assertThat(reporte.recomendacionEstrategicaDistrital()).contains("Minca");
    }
}
