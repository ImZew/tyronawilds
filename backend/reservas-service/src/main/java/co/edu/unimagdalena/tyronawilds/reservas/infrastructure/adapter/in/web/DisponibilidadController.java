package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.ConsultarDisponibilidadUseCase;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/disponibilidad")
public class DisponibilidadController {

    private final ConsultarDisponibilidadUseCase consultarDisponibilidadUseCase;

    public DisponibilidadController(ConsultarDisponibilidadUseCase consultarDisponibilidadUseCase) {
        this.consultarDisponibilidadUseCase = consultarDisponibilidadUseCase;
    }

    @GetMapping
    public ResponseEntity<List<DisponibilidadResponseDto>> listarDisponibilidad(
            @RequestParam(name = "actividadId", required = false) UUID actividadId,
            @RequestParam(name = "fecha", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        List<DisponibilidadResponseDto> respuesta = consultarDisponibilidadUseCase
                .listarDisponibilidades(actividadId, fecha)
                .stream()
                .map(DisponibilidadResponseDto::fromDomain)
                .toList();
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping
    public ResponseEntity<DisponibilidadResponseDto> crearDisponibilidad(
            @Valid @RequestBody CrearDisponibilidadRequestDto request
    ) {
        Disponibilidad creada = consultarDisponibilidadUseCase.crearOActualizarDisponibilidad(
                new ConsultarDisponibilidadUseCase.ComandoCrearDisponibilidad(
                        request.actividadId(),
                        request.nombreActividad(),
                        request.fecha(),
                        request.horaInicio(),
                        request.capacidadTotal(),
                        request.cuposDisponibles(),
                        request.precioUnitarioCop()
                )
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(DisponibilidadResponseDto.fromDomain(creada));
    }
}
