package co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.adapter.in.web;

import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.IndicadorCapacidadDestino;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.ReporteSostenibilidadTerritorial;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.port.in.ConsultarIndicadoresUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/indicadores")
public class IndicadoresController {

    private final ConsultarIndicadoresUseCase consultarIndicadoresUseCase;

    public IndicadoresController(ConsultarIndicadoresUseCase consultarIndicadoresUseCase) {
        this.consultarIndicadoresUseCase = consultarIndicadoresUseCase;
    }

    @GetMapping("/capacidad")
    public ResponseEntity<List<IndicadorCapacidadDestino>> listarCapacidadDestinos(
            @RequestParam(name = "alerta", required = false) String alerta
    ) {
        return ResponseEntity.ok(consultarIndicadoresUseCase.listarIndicadoresCapacidad(alerta));
    }

    @GetMapping("/reporte-sostenibilidad")
    public ResponseEntity<ReporteSostenibilidadTerritorial> obtenerReporteSostenibilidad() {
        return ResponseEntity.ok(consultarIndicadoresUseCase.generarReporteSostenibilidad());
    }
}
