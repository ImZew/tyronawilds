package co.edu.unimagdalena.tyronawilds.integracion.application.service;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ContextoTerritorialAgregado;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosAforoNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosClimaNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosEventosNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ResultadoConsultaFuente;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.in.ConsultarContextoTerritorialUseCase;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class IntegracionApplicationService implements ConsultarContextoTerritorialUseCase {

    private final AdaptadorClima adaptadorClima;
    private final AdaptadorAforo adaptadorAforo;
    private final AdaptadorEventos adaptadorEventos;
    private final AtomicBoolean simulacionFalloGlobal;

    public IntegracionApplicationService(
            AdaptadorClima adaptadorClima,
            AdaptadorAforo adaptadorAforo,
            AdaptadorEventos adaptadorEventos,
            AtomicBoolean simulacionFalloGlobal
    ) {
        this.adaptadorClima = adaptadorClima;
        this.adaptadorAforo = adaptadorAforo;
        this.adaptadorEventos = adaptadorEventos;
        this.simulacionFalloGlobal = simulacionFalloGlobal;
    }

    @Override
    public ContextoTerritorialAgregado consultarContextoActual() {
        ResultadoConsultaFuente<DatosClimaNormalizados> rClima = adaptadorClima.consultarConResiliencia();
        ResultadoConsultaFuente<DatosAforoNormalizados> rAforo = adaptadorAforo.consultarConResiliencia();
        ResultadoConsultaFuente<DatosEventosNormalizados> rEventos = adaptadorEventos.consultarConResiliencia();

        boolean degradado = rClima.degradado() || rAforo.degradado() || rEventos.degradado();
        String fuenteDatos = degradado ? "REDIS_CACHE_FALLBACK" : "LIVE_API";
        String estadoCircuitBreaker = rClima.estadoCircuitBreaker();

        return new ContextoTerritorialAgregado(
                rClima.datos(),
                rAforo.datos(),
                rEventos.datos(),
                degradado,
                fuenteDatos,
                estadoCircuitBreaker,
                simulacionFalloGlobal.get(),
                Instant.now()
        );
    }

    @Override
    public ContextoTerritorialAgregado configurarSimulacionFallo(boolean activarFallo) {
        simulacionFalloGlobal.set(activarFallo);
        if (!activarFallo) {
            adaptadorClima.resetearCircuitBreaker();
            adaptadorAforo.resetearCircuitBreaker();
            adaptadorEventos.resetearCircuitBreaker();
        } else {
            // Disparamos llamadas para que el Circuit Breaker registre el fallo inmediatamente
            adaptadorClima.consultarConResiliencia();
        }
        return consultarContextoActual();
    }
}
