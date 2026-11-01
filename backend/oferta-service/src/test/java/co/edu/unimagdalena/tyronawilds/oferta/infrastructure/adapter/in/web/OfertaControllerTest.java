package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.oferta.domain.exception.AccesoRecursoProhibidoException;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.BuscarSimilaresUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.ConsultarCatalogoUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.GestionarServicioTuristicoUseCase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OfertaController.class)
@Import(GlobalExceptionHandler.class)
class OfertaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConsultarCatalogoUseCase consultarCatalogoUseCase;

    @MockBean
    private BuscarSimilaresUseCase buscarSimilaresUseCase;

    @MockBean
    private GestionarServicioTuristicoUseCase gestionarServicioUseCase;

    @Test
    @DisplayName("PUT /api/v1/prestadores/77/servicios/9 con Prestador 41 devuelve 403 Forbidden y codigo ACCESO_DENEGADO (Secuencia 4.1)")
    void putServicioAjenoRetorna403AccesoDenegado() throws Exception {
        when(gestionarServicioUseCase.actualizarServicioDePrestador(any(), any(), any(), any()))
                .thenThrow(new AccesoRecursoProhibidoException(
                        "Violación de propiedad (RF-03 / Secuencia 4.1): prestador autenticado (41) != dueño del servicio 9 (77)."
                ));

        ActualizarActividadRequestDto dto = new ActualizarActividadRequestDto(
                "Intento Intruso",
                null,
                new BigDecimal("100000"),
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/v1/prestadores/77/servicios/9")
                        .header(SecurityHeaders.X_USER_ID, "33333333-3333-3333-3333-333333333333")
                        .header(SecurityHeaders.X_ROL, "PRESTADOR")
                        .header(SecurityHeaders.X_PRESTADOR_ID, "00000000-0000-0000-0000-000000000041")
                        .header(SecurityHeaders.X_CORRELATION_ID, "trace-403-secuencia")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"))
                .andExpect(jsonPath("$.traceId").value("trace-403-secuencia"))
                .andExpect(jsonPath("$.path").value("/api/v1/prestadores/77/servicios/9"));
    }
}
