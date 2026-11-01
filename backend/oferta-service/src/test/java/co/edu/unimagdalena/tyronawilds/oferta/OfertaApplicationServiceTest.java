package co.edu.unimagdalena.tyronawilds.oferta;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.oferta.application.service.OfertaApplicationService;
import co.edu.unimagdalena.tyronawilds.oferta.domain.exception.AccesoRecursoProhibidoException;
import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.GestionarServicioTuristicoUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.ActividadRepositoryPort;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.CatalogoCachePort;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.SeguridadEventPublisherPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OfertaApplicationServiceTest {

    private static final UUID PRESTADOR_77_UUID = UUID.fromString("00000000-0000-0000-0000-000000000077");
    private static final UUID PRESTADOR_41_UUID = UUID.fromString("00000000-0000-0000-0000-000000000041");
    private static final UUID SERVICIO_9_UUID = UUID.fromString("a0000000-0000-0000-0000-000000000009");

    @Mock
    private ActividadRepositoryPort repositoryPort;

    @Mock
    private CatalogoCachePort cachePort;

    @Mock
    private SeguridadEventPublisherPort seguridadEventPublisherPort;

    private OfertaApplicationService service;

    @BeforeEach
    void setUp() {
        service = new OfertaApplicationService(repositoryPort, cachePort, seguridadEventPublisherPort);
    }

    @Test
    @DisplayName("Secuencia 4.1: Cuando Prestador 41 intenta modificar el Servicio 9 del Prestador 77, lanza 403 y publica EventoAccesoDenegado")
    void debeRechazarModificacionDeServicioAjenoYPublicarEventoAuditoria() {
        ActividadTuristica servicio9 = crearServicio9DePrestador77();
        when(repositoryPort.buscarPorCodigoServicio(9L)).thenReturn(Optional.of(servicio9));

        GestionarServicioTuristicoUseCase.ContextoSeguridadActor intruso41 =
                new GestionarServicioTuristicoUseCase.ContextoSeguridadActor(
                        "33333333-3333-3333-3333-333333333333",
                        "PRESTADOR",
                        PRESTADOR_41_UUID.toString(),
                        "192.168.1.99",
                        "trace-secuencia-4-1"
                );

        GestionarServicioTuristicoUseCase.ComandoActualizarActividad comando =
                new GestionarServicioTuristicoUseCase.ComandoActualizarActividad(
                        "INTENTO ALTERACION",
                        null,
                        new BigDecimal("50000.00"),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );

        assertThatThrownBy(() -> service.actualizarServicioDePrestador("77", "9", comando, intruso41))
                .isInstanceOf(AccesoRecursoProhibidoException.class)
                .hasMessageContaining("Violación de propiedad");

        ArgumentCaptor<EventoAccesoDenegado> captor = ArgumentCaptor.forClass(EventoAccesoDenegado.class);
        verify(seguridadEventPublisherPort).publicarAccesoDenegado(captor.capture());

        EventoAccesoDenegado publicado = captor.getValue();
        assertThat(publicado.rol()).isEqualTo("PRESTADOR");
        assertThat(publicado.recurso()).contains("/api/v1/prestadores/77/servicios/9");
        assertThat(publicado.traceId()).isEqualTo("trace-secuencia-4-1");
    }

    @Test
    @DisplayName("Debe permitir al Prestador 77 modificar su propio Servicio 9 e invalidar el caché Redis")
    void debePermitirModificacionPorDuenoLegitimo() {
        ActividadTuristica servicio9 = crearServicio9DePrestador77();
        when(repositoryPort.buscarPorCodigoServicio(9L)).thenReturn(Optional.of(servicio9));
        when(repositoryPort.guardar(any())).thenAnswer(inv -> inv.getArgument(0));

        GestionarServicioTuristicoUseCase.ContextoSeguridadActor dueno77 =
                new GestionarServicioTuristicoUseCase.ContextoSeguridadActor(
                        "22222222-2222-2222-2222-222222222222",
                        "PRESTADOR",
                        PRESTADOR_77_UUID.toString(),
                        "127.0.0.1",
                        "trace-dueno-77"
                );

        GestionarServicioTuristicoUseCase.ComandoActualizarActividad comando =
                new GestionarServicioTuristicoUseCase.ComandoActualizarActividad(
                        null,
                        null,
                        new BigDecimal("1900000.00"),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                );

        ActividadTuristica resultado = service.actualizarServicioDePrestador("77", "9", comando, dueno77);

        assertThat(resultado.precioCop()).isEqualByComparingTo("1900000.00");
        verify(cachePort).invalidarCacheCatalogo();
    }

    private ActividadTuristica crearServicio9DePrestador77() {
        return new ActividadTuristica(
                SERVICIO_9_UUID,
                9L,
                PRESTADOR_77_UUID,
                77L,
                "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
                "LOSE THE MAP: LOST CITY (TEYUNA) TREK",
                "pierde-el-mapa-ciudad-perdida-teyuna",
                "ALTA_MONTANA_ANCESTRAL",
                "Sierra Nevada de Santa Marta",
                "11°02'16\"N 73°55'31\"W",
                1200,
                new BigDecimal("1850000.00"),
                16,
                42,
                true,
                "https://images.unsplash.com/photo-1",
                "Descripción ES",
                "Description EN",
                "trekking,sierra-nevada,ancestral",
                Instant.now()
        );
    }
}
