package co.edu.unimagdalena.tyronawilds.recomendacion;

import co.edu.unimagdalena.tyronawilds.recomendacion.application.service.ContextoExterno;
import co.edu.unimagdalena.tyronawilds.recomendacion.application.service.ExplicadorRecomendacion;
import co.edu.unimagdalena.tyronawilds.recomendacion.application.service.MotorRecomendacionStateMachineService;
import co.edu.unimagdalena.tyronawilds.recomendacion.application.service.PerfilPreferencias;
import co.edu.unimagdalena.tyronawilds.recomendacion.application.service.RankingPersonalizadoVectorStrategy;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ResultadoRecomendacion;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.in.GenerarRecomendacionUseCase;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.CatalogoOfertaClientPort;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.ContextoExternoClientPort;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.PerfilRecomendacionRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MotorRecomendacionStateMachineTest {

    @Mock
    private PerfilRecomendacionRepositoryPort repositoryPort;

    @Mock
    private CatalogoOfertaClientPort catalogoOfertaClientPort;

    @Mock
    private ContextoExternoClientPort contextoExternoClientPort;

    private MotorRecomendacionStateMachineService service;

    @BeforeEach
    void setUp() {
        PerfilPreferencias perfilPreferencias = new PerfilPreferencias(repositoryPort);
        ContextoExterno contextoExterno = new ContextoExterno(contextoExternoClientPort);
        ExplicadorRecomendacion explicador = new ExplicadorRecomendacion();
        RankingPersonalizadoVectorStrategy strategy = new RankingPersonalizadoVectorStrategy();

        service = new MotorRecomendacionStateMachineService(
                perfilPreferencias,
                contextoExterno,
                catalogoOfertaClientPort,
                explicador,
                repositoryPort,
                strategy,
                "PERSONALIZADO"
        );
    }

    @Test
    @DisplayName("Máquina de Estados 4.2: Flujo normal PERSONALIZADO recorre Solicitada -> CargandoPerfil -> EnriqueciendoContexto -> Ranqueando -> GenerandoExplicacion -> FINAL_EXITO")
    void debeTransicionarCorrectamenteEnModoPersonalizadoNormal() {
        when(repositoryPort.buscarPerfilPorUsuarioId(any())).thenReturn(Optional.empty());
        when(contextoExternoClientPort.consultarContextoTerritorial()).thenReturn(
                new ContextoTerritorialResumen(29.4, "SOLEADO", 88, "Minca / Bonda", false, "LIVE_API")
        );
        when(catalogoOfertaClientPort.consultarCandidatosCatalogo(any())).thenReturn(crearCandidatosPrueba());

        ResultadoRecomendacion resultado = service.generarRecomendacion(
                new GenerarRecomendacionUseCase.ComandoGenerarRecomendacion(
                        UUID.randomUUID(),
                        "minca,cascadas,sostenible",
                        true,
                        new BigDecimal("1500000"),
                        false,
                        "trace-ia-01"
                )
        );

        assertThat(resultado.estadoFinal()).isEqualTo("FINAL_EXITO");
        assertThat(resultado.nivelIaAplicado()).isEqualTo("PERSONALIZADO");
        assertThat(resultado.contextoDegradado()).isFalse();
        assertThat(resultado.trazaEstados()).containsExactly(
                "Solicitada",
                "CargandoPerfil",
                "EnriqueciendoContexto",
                "Ranqueando",
                "GenerandoExplicacion",
                "FINAL_EXITO"
        );
        // Minca (ocupación 28%) debe quedar por encima de Cabo San Juan (ocupación 88% saturado - RF-10)
        assertThat(resultado.recomendaciones().getFirst().nombreEs()).contains("MARINKA");
        verify(repositoryPort).guardarHistorialRecomendacion(any());
    }

    @Test
    @DisplayName("Máquina de Estados 4.2 + Ficha 5.2: Con contexto degradado y modo BASICO transita por ContextoDegradado y ModoBasico")
    void debeTransicionarAContextoDegradadoYModoBasico() {
        when(repositoryPort.buscarPerfilPorUsuarioId(any())).thenReturn(Optional.empty());
        when(catalogoOfertaClientPort.consultarCandidatosCatalogo(any())).thenReturn(crearCandidatosPrueba());

        service.cambiarNivelIaEnCaliente("BASICO");

        ResultadoRecomendacion resultado = service.generarRecomendacion(
                new GenerarRecomendacionUseCase.ComandoGenerarRecomendacion(
                        UUID.randomUUID(),
                        null,
                        true,
                        null,
                        true, // Forzar ContextoDegradado
                        "trace-ia-degradado"
                )
        );

        assertThat(resultado.contextoDegradado()).isTrue();
        assertThat(resultado.nivelIaAplicado()).isEqualTo("BASICO");
        assertThat(resultado.trazaEstados()).containsExactly(
                "Solicitada",
                "CargandoPerfil",
                "EnriqueciendoContexto",
                "ContextoDegradado",
                "ModoBasico",
                "GenerandoExplicacion",
                "FINAL_EXITO"
        );
    }

    private List<CandidatoOferta> crearCandidatosPrueba() {
        return List.of(
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000002"),
                        102L,
                        "CABO SAN JUAN & SENDERO NUIJPIA",
                        "CABO SAN JUAN & NUIJPIA TRAIL",
                        "cabo-san-juan",
                        "COSTA_PARQUE_NACIONAL",
                        "Parque Tayrona",
                        "11°19'51\"N 73°57'43\"W",
                        15,
                        new BigDecimal("290000"),
                        88, // Ocupación crítica
                        true,
                        "https://img/tayrona.jpg",
                        "playa,tayrona"
                ),
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000003"),
                        103L,
                        "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
                        "BIOCLIMATIC EXPEDITION & MARINKA WATERFALLS",
                        "marinka-minca",
                        "BOSQUE_NIEBLA_SOSTENIBLE",
                        "Minca / Corregimiento de Bonda",
                        "11°08'35\"N 74°06'58\"W",
                        650,
                        new BigDecimal("210000"),
                        28, // Baja ocupación
                        true,
                        "https://img/minca.jpg",
                        "minca,bonda,cascadas,sostenible"
                )
        );
    }
}
