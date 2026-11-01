package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CancelarReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CrearReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.SimularConcurrenciaUseCase;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReservasController.class)
@Import(GlobalExceptionHandler.class)
class ReservasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CrearReservaUseCase crearReservaUseCase;

    @MockBean
    private CancelarReservaUseCase cancelarReservaUseCase;

    @MockBean
    private SimularConcurrenciaUseCase simularConcurrenciaUseCase;

    @Test
    @DisplayName("POST /api/v1/reservas ante agotamiento de cupo devuelve 409 Conflict con ApiErrorResponse y horarios alternativos (ER-02)")
    void postReservaSinCuposRetorna409ConAlternativas() throws Exception {
        UUID dispAlternativaId = UUID.fromString("d0000000-0000-0000-0000-000000000002");
        Disponibilidad alternativa = new Disponibilidad(
                dispAlternativaId,
                UUID.fromString("a0000000-0000-0000-0000-000000000009"),
                "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
                LocalDate.of(2026, 11, 16),
                LocalTime.of(6, 0),
                16,
                14,
                new BigDecimal("1850000.00"),
                0L
        );

        when(crearReservaUseCase.crearReserva(any()))
                .thenThrow(new ConflictoConcurrenciaCupoException(
                        "Cupos agotados para el horario seleccionado (ER-02).",
                        List.of(alternativa)
                ));

        CrearReservaRequestDto request = new CrearReservaRequestDto(
                UUID.randomUUID(),
                UUID.fromString("d0000000-0000-0000-0000-000000000001"),
                2,
                null
        );

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.codigo").value("CONFLICTO_CUPO_AGOTADO"))
                .andExpect(jsonPath("$.detalles.alternativaPrincipalId").value(dispAlternativaId.toString()));
    }
}
