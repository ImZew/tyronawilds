package co.edu.unimagdalena.tyronawilds.integracion.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ContextoTerritorialAgregado;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.in.ConsultarContextoTerritorialUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class IntegracionContextoController {

    private final ConsultarContextoTerritorialUseCase consultarContextoUseCase;

    public IntegracionContextoController(ConsultarContextoTerritorialUseCase consultarContextoUseCase) {
        this.consultarContextoUseCase = consultarContextoUseCase;
    }

    @GetMapping({"/contexto", "/integracion/contexto"})
    public ResponseEntity<ContextoTerritorialAgregado> obtenerContexto() {
        return ResponseEntity.ok(consultarContextoUseCase.consultarContextoActual());
    }

    @PostMapping({"/contexto/simulacion-fallo", "/integracion/contexto/simulacion-fallo"})
    public ResponseEntity<ContextoTerritorialAgregado> configurarSimulacionFallo(
            @RequestBody(required = false) SimulacionFalloRequestDto body,
            @RequestParam(name = "activar", required = false) Boolean activarParam
    ) {
        boolean activar = body != null ? body.activarFallo() : (activarParam != null && activarParam);
        return ResponseEntity.ok(consultarContextoUseCase.configurarSimulacionFallo(activar));
    }
}
