package co.edu.unimagdalena.tyronawilds.auditoria;

import co.edu.unimagdalena.tyronawilds.auditoria.application.service.AuditoriaApplicationService;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.out.RegistroAuditoriaRepositoryPort;
import co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.messaging.AuditoriaRabbitConsumerAdapter;
import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditoriaApplicationAndConsumerTest {

    @Mock
    private RegistroAuditoriaRepositoryPort repositoryPort;

    private AuditoriaApplicationService applicationService;
    private AuditoriaRabbitConsumerAdapter rabbitConsumerAdapter;

    @BeforeEach
    void setUp() {
        applicationService = new AuditoriaApplicationService(repositoryPort);
        rabbitConsumerAdapter = new AuditoriaRabbitConsumerAdapter(applicationService);
    }

    @Test
    @DisplayName("Debe consumir EventoAccesoDenegado de auditoria.q y persistirlo con resultado DENEGADA (Secuencia 4.1)")
    void debeConsumirYPersistirEventoAccesoDenegado() {
        when(repositoryPort.insertar(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID eventoId = UUID.randomUUID();
        UUID intrusoId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        EventoAccesoDenegado evento = new EventoAccesoDenegado(
                eventoId,
                intrusoId,
                "PRESTADOR",
                "oferta-service:/api/v1/ofertas/999",
                "ACTUALIZAR_OFERTA_AJENA",
                "prestadorId (41) != recurso.prestadorId (77)",
                "192.168.1.50",
                "trace-secuencia-4-1",
                Instant.now()
        );

        rabbitConsumerAdapter.onEventoAccesoDenegado(evento);

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(repositoryPort).insertar(captor.capture());

        RegistroAuditoria persistido = captor.getValue();
        assertThat(persistido.eventoOrigenId()).isEqualTo(eventoId);
        assertThat(persistido.usuarioId()).isEqualTo(intrusoId.toString());
        assertThat(persistido.rol()).isEqualTo("PRESTADOR");
        assertThat(persistido.resultado()).isEqualTo("DENEGADA");
        assertThat(persistido.traceId()).isEqualTo("trace-secuencia-4-1");
    }

    @Test
    @DisplayName("Debe consumir EventoReservaConfirmada de auditoria.q y persistirlo con resultado EXITOSA")
    void debeConsumirYPersistirEventoReservaConfirmada() {
        when(repositoryPort.insertar(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID eventoId = UUID.randomUUID();
        UUID reservaId = UUID.randomUUID();
        UUID turistaId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        EventoReservaConfirmada evento = new EventoReservaConfirmada(
                eventoId,
                reservaId,
                turistaId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                2,
                8,
                new BigDecimal("350000.00"),
                LocalDate.of(2026, 11, 15),
                "trace-reserva-ok",
                Instant.now()
        );

        rabbitConsumerAdapter.onEventoReservaConfirmada(evento);

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(repositoryPort).insertar(captor.capture());

        RegistroAuditoria persistido = captor.getValue();
        assertThat(persistido.eventoOrigenId()).isEqualTo(eventoId);
        assertThat(persistido.usuarioId()).isEqualTo(turistaId.toString());
        assertThat(persistido.accion()).isEqualTo("RESERVA_CONFIRMADA");
        assertThat(persistido.resultado()).isEqualTo("EXITOSA");
    }

    @Test
    @DisplayName("Debe consultar eventos filtrados por resultado DENEGADA")
    void debeConsultarEventosFiltradosPorResultado() {
        RegistroAuditoria mockRegistro = new RegistroAuditoria(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "33333333-3333-3333-3333-333333333333",
                "PRESTADOR",
                "ACTUALIZAR_OFERTA",
                "/api/v1/ofertas/1",
                "DENEGADA",
                "Intruso detectado",
                "127.0.0.1",
                "trace-01",
                Instant.now()
        );
        when(repositoryPort.buscarPorResultadoPaginado("DENEGADA", 0, 10))
                .thenReturn(List.of(mockRegistro));

        List<RegistroAuditoria> resultados = applicationService.consultarEventos("denegada", 0, 10);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.getFirst().resultado()).isEqualTo("DENEGADA");
    }
}
