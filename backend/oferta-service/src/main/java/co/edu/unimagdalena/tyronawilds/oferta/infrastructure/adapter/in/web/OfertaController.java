package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.SecurityHeaders;
import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.BuscarSimilaresUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.ConsultarCatalogoUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.GestionarServicioTuristicoUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class OfertaController {

    private final ConsultarCatalogoUseCase consultarCatalogoUseCase;
    private final BuscarSimilaresUseCase buscarSimilaresUseCase;
    private final GestionarServicioTuristicoUseCase gestionarServicioUseCase;

    public OfertaController(
            ConsultarCatalogoUseCase consultarCatalogoUseCase,
            BuscarSimilaresUseCase buscarSimilaresUseCase,
            GestionarServicioTuristicoUseCase gestionarServicioUseCase
    ) {
        this.consultarCatalogoUseCase = consultarCatalogoUseCase;
        this.buscarSimilaresUseCase = buscarSimilaresUseCase;
        this.gestionarServicioUseCase = gestionarServicioUseCase;
    }

    @GetMapping({"/ofertas", "/actividades"})
    public ResponseEntity<List<ActividadResponseDto>> listarCatalogo(
            @RequestParam(name = "categoria", required = false) String categoria,
            @RequestParam(name = "sostenible", required = false) Boolean sostenible
    ) {
        List<ActividadResponseDto> respuesta = consultarCatalogoUseCase
                .listarActividades(categoria, sostenible)
                .stream()
                .map(ActividadResponseDto::fromDomain)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping({"/ofertas/similares", "/actividades/similares"})
    public ResponseEntity<List<ActividadResponseDto>> buscarSimilares(
            @RequestParam(name = "tags", required = false) String tags,
            @RequestParam(name = "priorizarBajaOcupacion", defaultValue = "true") boolean priorizarBajaOcupacion
    ) {
        List<ActividadResponseDto> respuesta = buscarSimilaresUseCase
                .buscarSimilaresPorTags(tags, priorizarBajaOcupacion)
                .stream()
                .map(ActividadResponseDto::fromDomain)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @GetMapping({"/ofertas/{id}", "/actividades/{id}"})
    public ResponseEntity<ActividadResponseDto> obtenerPorId(@PathVariable("id") UUID id) {
        ActividadTuristica actividad = consultarCatalogoUseCase.obtenerPorId(id);
        return ResponseEntity.ok(ActividadResponseDto.fromDomain(actividad));
    }

    @PostMapping("/actividades")
    public ResponseEntity<ActividadResponseDto> crearActividad(
            @Valid @RequestBody CrearActividadRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userId,
            @RequestHeader(value = SecurityHeaders.X_ROL, required = false) String rol,
            @RequestHeader(value = SecurityHeaders.X_PRESTADOR_ID, required = false) String prestadorIdHeader,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        GestionarServicioTuristicoUseCase.ContextoSeguridadActor actor = construirActor(
                userId, rol, prestadorIdHeader, correlationId, servletRequest
        );
        ActividadTuristica creada = gestionarServicioUseCase.crearActividad(
                new GestionarServicioTuristicoUseCase.ComandoCrearActividad(
                        request.codigoServicio(),
                        request.nombreEs(),
                        request.nombreEn(),
                        request.slug(),
                        request.categoria(),
                        request.ubicacion(),
                        request.coordenadasHud(),
                        request.altitudMsnm(),
                        request.precioCop(),
                        request.capacidadMaxima(),
                        request.esSostenible(),
                        request.imagenUrl(),
                        request.descripcionEs(),
                        request.descripcionEn(),
                        request.tagsAfinidad()
                ),
                actor
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ActividadResponseDto.fromDomain(creada));
    }

    @PutMapping("/actividades/{id}")
    public ResponseEntity<ActividadResponseDto> actualizarPorId(
            @PathVariable("id") UUID id,
            @RequestBody ActualizarActividadRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userId,
            @RequestHeader(value = SecurityHeaders.X_ROL, required = false) String rol,
            @RequestHeader(value = SecurityHeaders.X_PRESTADOR_ID, required = false) String prestadorIdHeader,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        GestionarServicioTuristicoUseCase.ContextoSeguridadActor actor = construirActor(
                userId, rol, prestadorIdHeader, correlationId, servletRequest
        );
        ActividadTuristica actualizada = gestionarServicioUseCase.actualizarPorId(
                id,
                toComandoActualizar(request),
                actor
        );
        return ResponseEntity.ok(ActividadResponseDto.fromDomain(actualizada));
    }

    /**
     * Endpoint oficial del Diagrama de Secuencia 4.1 del Laboratorio 3:
     * PUT /api/v1/prestadores/{prestadorId}/servicios/{servicioId}
     */
    @PutMapping("/prestadores/{prestadorId}/servicios/{servicioId}")
    public ResponseEntity<ActividadResponseDto> actualizarServicioDePrestador(
            @PathVariable("prestadorId") String prestadorId,
            @PathVariable("servicioId") String servicioId,
            @RequestBody ActualizarActividadRequestDto request,
            @RequestHeader(value = SecurityHeaders.X_USER_ID, required = false) String userId,
            @RequestHeader(value = SecurityHeaders.X_ROL, required = false) String rol,
            @RequestHeader(value = SecurityHeaders.X_PRESTADOR_ID, required = false) String prestadorIdHeader,
            @RequestHeader(value = SecurityHeaders.X_CORRELATION_ID, required = false) String correlationId,
            HttpServletRequest servletRequest
    ) {
        GestionarServicioTuristicoUseCase.ContextoSeguridadActor actor = construirActor(
                userId, rol, prestadorIdHeader, correlationId, servletRequest
        );
        ActividadTuristica actualizada = gestionarServicioUseCase.actualizarServicioDePrestador(
                prestadorId,
                servicioId,
                toComandoActualizar(request),
                actor
        );
        return ResponseEntity.ok(ActividadResponseDto.fromDomain(actualizada));
    }

    private GestionarServicioTuristicoUseCase.ComandoActualizarActividad toComandoActualizar(ActualizarActividadRequestDto dto) {
        return new GestionarServicioTuristicoUseCase.ComandoActualizarActividad(
                dto.nombreEs(),
                dto.nombreEn(),
                dto.precioCop(),
                dto.capacidadMaxima(),
                dto.nivelOcupacionActual(),
                dto.esSostenible(),
                dto.descripcionEs(),
                dto.descripcionEn(),
                dto.tagsAfinidad()
        );
    }

    private GestionarServicioTuristicoUseCase.ContextoSeguridadActor construirActor(
            String userId,
            String rol,
            String prestadorIdHeader,
            String correlationId,
            HttpServletRequest servletRequest
    ) {
        String traceId = (correlationId != null && !correlationId.isBlank())
                ? correlationId
                : UUID.randomUUID().toString();
        return new GestionarServicioTuristicoUseCase.ContextoSeguridadActor(
                userId,
                rol,
                prestadorIdHeader,
                servletRequest.getRemoteAddr(),
                traceId
        );
    }
}
