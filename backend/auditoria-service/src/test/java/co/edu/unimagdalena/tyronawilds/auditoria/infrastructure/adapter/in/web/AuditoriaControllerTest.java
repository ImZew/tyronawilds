package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.ConsultarAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.RegistrarEventoAuditoriaUseCase;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuditoriaController.class)
@Import(GlobalExceptionHandler.class)
class AuditoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RegistrarEventoAuditoriaUseCase registrarEventoAuditoriaUseCase;

    @MockBean
    private ConsultarAuditoriaUseCase consultarAuditoriaUseCase;

    @Test
    @DisplayName("GET /api/v1/auditoria retorna 200 OK con la lista de eventos de auditoría")
    void consultarRegistrosRetorna200() throws Exception {
        UUID id = UUID.randomUUID();
        when(consultarAuditoriaUseCase.consultarEventos("DENEGADA", 0, 25))
                .thenReturn(List.of(new RegistroAuditoria(
                        id,
                        UUID.randomUUID(),
                        "33333333-3333-3333-3333-333333333333",
                        "PRESTADOR",
                        "MODIFICAR_OFERTA",
                        "/api/v1/ofertas/77",
                        "DENEGADA",
                        "Propiedad de recurso inválida",
                        "127.0.0.1",
                        "trace-403",
                        Instant.now()
                )));

        mockMvc.perform(get("/api/v1/auditoria").param("resultado", "DENEGADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].resultado").value("DENEGADA"))
                .andExpect(jsonPath("$[0].traceId").value("trace-403"));
    }

    @Test
    @DisplayName("POST /api/v1/auditoria/eventos retorna 201 Created cuando el payload es válido")
    void registrarEventoManualRetorna201() throws Exception {
        UUID id = UUID.randomUUID();
        when(registrarEventoAuditoriaUseCase.registrar(any()))
                .thenReturn(new RegistroAuditoria(
                        id,
                        null,
                        "11111111-1111-1111-1111-111111111111",
                        "ADMIN",
                        "CAMBIO_UMBRAL_AFORO",
                        "/api/v1/indicadores/aforo",
                        "EXITOSA",
                        "Ajuste preventivo temporada alta",
                        "127.0.0.1",
                        "trace-admin-01",
                        Instant.now()
                ));

        CrearEventoAuditoriaRequestDto request = new CrearEventoAuditoriaRequestDto(
                null,
                "11111111-1111-1111-1111-111111111111",
                "ADMIN",
                "CAMBIO_UMBRAL_AFORO",
                "/api/v1/indicadores/aforo",
                "EXITOSA",
                "Ajuste preventivo temporada alta",
                "127.0.0.1",
                "trace-admin-01"
        );

        mockMvc.perform(post("/api/v1/auditoria/eventos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.resultado").value("EXITOSA"));
    }
}
