package co.edu.unimagdalena.tyronawilds.recomendacion.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ResultadoRecomendacion;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.in.GenerarRecomendacionUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recomendaciones")
public class ControladorRecomendaciones {

    private final GenerarRecomendacionUseCase generarRecomendacionUseCase;

    public ControladorRecomendaciones(GenerarRecomendacionUseCase generarRecomendacionUseCase) {
        this.generarRecomendacionUseCase = generarRecomendacionUseCase;
    }

    @PostMapping
    public ResponseEntity<ResultadoRecomendacion> generarRecomendaciones(
            @RequestBody(required = false) SolicitudRecomendacionRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId
    ) {
        UUID usuarioId = resolverUsuarioId(userIdHeader, request != null ? request.usuarioId() : null);
        String traceId = (correlationId != null && !correlationId.isBlank())
                ? correlationId
                : UUID.randomUUID().toString();

        ResultadoRecomendacion resultado = generarRecomendacionUseCase.generarRecomendacion(
                new GenerarRecomendacionUseCase.ComandoGenerarRecomendacion(
                        usuarioId,
                        request != null ? request.intereses() : null,
                        request != null ? request.priorizarSostenible() : true,
                        request != null ? request.presupuestoMaximoCop() : null,
                        request != null ? request.forzarContextoDegradado() : false,
                        traceId
                )
        );
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/configuracion")
    public ResponseEntity<ConfiguracionVariabilidadIaDto> consultarConfiguracion(
            @RequestParam(name = "cambiarNivel", required = false) String cambiarNivel
    ) {
        String nivelActual = (cambiarNivel != null && !cambiarNivel.isBlank())
                ? generarRecomendacionUseCase.cambiarNivelIaEnCaliente(cambiarNivel)
                : generarRecomendacionUseCase.obtenerNivelIaActivo();

        return ResponseEntity.ok(new ConfiguracionVariabilidadIaDto(
                "NIVEL_RECOMENDACION_IA",
                nivelActual,
                List.of("PERSONALIZADO", "BASICO")
        ));
    }

    @PostMapping("/configuracion")
    public ResponseEntity<ConfiguracionVariabilidadIaDto> actualizarConfiguracion(
            @RequestBody Map<String, String> body
    ) {
        String nuevoNivel = body != null ? body.get("nivel") : null;
        String actualizado = generarRecomendacionUseCase.cambiarNivelIaEnCaliente(nuevoNivel);
        return ResponseEntity.ok(new ConfiguracionVariabilidadIaDto(
                "NIVEL_RECOMENDACION_IA",
                actualizado,
                List.of("PERSONALIZADO", "BASICO")
        ));
    }

    private UUID resolverUsuarioId(String header, UUID bodyUsuarioId) {
        if (header != null && !header.isBlank()) {
            try {
                return UUID.fromString(header.trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return bodyUsuarioId;
    }
}
