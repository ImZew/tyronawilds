package co.edu.unimagdalena.tyronawilds.integracion.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ContextoTerritorialAgregado;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosAforoNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosClimaNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosEventosNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.in.ConsultarContextoTerritorialUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = IntegracionContextoController.class)
@Import(GlobalExceptionHandler.class)
class IntegracionContextoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultarContextoTerritorialUseCase consultarContextoUseCase;

    @Test
    @DisplayName("GET /api/v1/contexto retorna el contexto territorial agregado")
    void obtenerContextoRetorna200() throws Exception {
        when(consultarContextoUseCase.consultarContextoActual())
                .thenReturn(crearContextoMock(false, "LIVE_API", "CLOSED"));

        mockMvc.perform(get("/api/v1/contexto"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.degradado").value(false))
                .andExpect(jsonPath("$.fuenteDatos").value("LIVE_API"))
                .andExpect(jsonPath("$.clima.temperaturaCelsius").value(29.4));
    }

    @Test
    @DisplayName("POST /api/v1/contexto/simulacion-fallo activa modo degradado ER-01 con REDIS_CACHE_FALLBACK")
    void activarSimulacionFalloRetornaModoDegradado() throws Exception {
        when(consultarContextoUseCase.configurarSimulacionFallo(true))
                .thenReturn(crearContextoMock(true, "REDIS_CACHE_FALLBACK", "OPEN"));

        mockMvc.perform(post("/api/v1/contexto/simulacion-fallo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activarFallo\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.degradado").value(true))
                .andExpect(jsonPath("$.fuenteDatos").value("REDIS_CACHE_FALLBACK"))
                .andExpect(jsonPath("$.estadoCircuitBreaker").value("OPEN"));
    }

    private ContextoTerritorialAgregado crearContextoMock(boolean degradado, String fuente, String cbState) {
        return new ContextoTerritorialAgregado(
                new DatosClimaNormalizados("Estación Tayrona", 29.4, 76, "SOLEADO", 15.0, "Normal"),
                new DatosAforoNormalizados(86, "ALTO", "Minca", List.of()),
                new DatosEventosNormalizados("TEMPORADA_2026", List.of()),
                degradado,
                fuente,
                cbState,
                degradado,
                Instant.now()
        );
    }
}
