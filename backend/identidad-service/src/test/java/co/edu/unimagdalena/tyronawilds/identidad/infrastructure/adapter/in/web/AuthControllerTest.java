package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.exception.ProveedorAuthNoHabilitadoException;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.AutenticarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.ConsultarProveedoresAuthUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.in.RegistrarUsuarioUseCase;
import co.edu.unimagdalena.tyronawilds.identidad.infrastructure.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RegistrarUsuarioUseCase registrarUsuarioUseCase;

    @MockBean
    private AutenticarUsuarioUseCase autenticarUsuarioUseCase;

    @MockBean
    private ConsultarProveedoresAuthUseCase consultarProveedoresAuthUseCase;

    @Test
    @DisplayName("POST /api/v1/auth/login retorna 200 OK con token JWT")
    void loginLocalRetorna200() throws Exception {
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID prestadorId = UUID.fromString("00000000-0000-0000-0000-000000000077");

        when(autenticarUsuarioUseCase.autenticarLocal(any())).thenReturn(
                new ResultadoAutenticacion(
                        "jwt.mock.token",
                        "Bearer",
                        86400000L,
                        userId,
                        "Expediciones Tayrona Ancestral",
                        "tayrona@tyronawilds.co",
                        RolUsuario.PRESTADOR,
                        prestadorId,
                        "LOCAL"
                )
        );

        LoginLocalRequestDto request = new LoginLocalRequestDto("tayrona@tyronawilds.co", "Tyrona2026*");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt.mock.token"))
                .andExpect(jsonPath("$.rol").value("PRESTADOR"))
                .andExpect(jsonPath("$.prestadorId").value(prestadorId.toString()));
    }

    @Test
    @DisplayName("POST /api/v1/auth/oauth2/google retorna 403 con ApiErrorResponse cuando el proveedor no está habilitado")
    void loginGoogleDeshabilitadoRetorna403ApiErrorResponse() throws Exception {
        when(autenticarUsuarioUseCase.autenticarGoogle(any()))
                .thenThrow(new ProveedorAuthNoHabilitadoException("google"));

        LoginGoogleRequestDto request = new LoginGoogleRequestDto(
                "google-id-token",
                "turista@gmail.com",
                "Turista Google"
        );

        mockMvc.perform(post("/api/v1/auth/oauth2/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.codigo").value("PROVEEDOR_AUTH_NO_HABILITADO"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/oauth2/google"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/proveedores-activos retorna la lista configurada en AUTH_PROVEEDORES")
    void obtenerProveedoresActivosRetorna200() throws Exception {
        when(consultarProveedoresAuthUseCase.obtenerProveedoresActivos())
                .thenReturn(List.of("local", "google"));

        mockMvc.perform(get("/api/v1/auth/proveedores-activos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puntoVariabilidad").value("PROVEEDOR_AUTENTICACION"))
                .andExpect(jsonPath("$.proveedoresActivos[0]").value("local"))
                .andExpect(jsonPath("$.proveedoresActivos[1]").value("google"));
    }
}
