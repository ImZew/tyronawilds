package co.edu.unimagdalena.tyronawilds.integracion.application.service;

import co.edu.unimagdalena.tyronawilds.integracion.domain.exception.FuenteExternaNoDisponibleException;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ResultadoConsultaFuente;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Jerarquía de generalización (is-a) de la Vista de Módulo 2.1:
 * AdaptadorFuente<T> define el contrato plantilla de invocación resiliente con
 * Circuit Breaker, Timeout 2s (ACME 1.3), normalización heterogénea (RNF-04) y
 * respaldo en caché Redis (ER-01).
 */
public abstract class AdaptadorFuente<T> {

    private static final Logger log = LoggerFactory.getLogger(AdaptadorFuente.class);
    private static final ExecutorService TIME_LIMITER_EXECUTOR = Executors.newCachedThreadPool();

    private final ContextoCachePort cachePort;
    private final CircuitBreaker circuitBreaker;
    private final TimeLimiter timeLimiter;
    private final Class<T> tipoModeloNormalizado;
    private final AtomicBoolean simulacionFalloActiva;

    protected AdaptadorFuente(
            ContextoCachePort cachePort,
            CircuitBreakerRegistry circuitBreakerRegistry,
            TimeLimiterRegistry timeLimiterRegistry,
            String nombreInstanciaResilience,
            Class<T> tipoModeloNormalizado,
            AtomicBoolean simulacionFalloActiva
    ) {
        this.cachePort = cachePort;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker(nombreInstanciaResilience);
        this.timeLimiter = timeLimiterRegistry.timeLimiter(nombreInstanciaResilience);
        this.tipoModeloNormalizado = tipoModeloNormalizado;
        this.simulacionFalloActiva = simulacionFalloActiva;
    }

    public final ResultadoConsultaFuente<T> consultarConResiliencia() {
        Callable<T> llamadaProtegida = CircuitBreaker.decorateCallable(
                circuitBreaker,
                timeLimiter.decorateFutureSupplier(() -> CompletableFuture.supplyAsync(() -> {
                    if (simulacionFalloActiva.get()) {
                        throw new FuenteExternaNoDisponibleException(
                                nombreFuente(),
                                "Timeout / HTTP 503 simulado en proveedor externo (ER-01)"
                        );
                    }
                    Map<String, Object> payloadCrudo = invocarProveedorExternoCrudo();
                    return normalizarPayloadHeterogeneo(payloadCrudo);
                }, TIME_LIMITER_EXECUTOR))
        );

        try {
            T normalizado = llamadaProtegida.call();
            cachePort.guardarSnapshot(claveCacheRedis(), normalizado, tipoModeloNormalizado);
            return new ResultadoConsultaFuente<>(
                    nombreFuente(),
                    normalizado,
                    false,
                    "LIVE_API",
                    circuitBreaker.getState().name()
            );
        } catch (Exception ex) {
            log.warn("[INTEGRACION-ER01] Fallo o Circuit Breaker en {} (estado={}): {}. Activando fallback Redis/Snapshot.",
                    nombreFuente(), circuitBreaker.getState(), ex.getMessage());

            T respaldo = cachePort.recuperarSnapshot(claveCacheRedis(), tipoModeloNormalizado)
                    .orElseGet(this:: construirSnapshotRespaldoPorDefecto);

            return new ResultadoConsultaFuente<>(
                    nombreFuente(),
                    respaldo,
                    true,
                    "REDIS_CACHE_FALLBACK",
                    circuitBreaker.getState().name()
            );
        }
    }

    public String obtenerEstadoCircuitBreaker() {
        return circuitBreaker.getState().name();
    }

    public void resetearCircuitBreaker() {
        circuitBreaker.reset();
    }

    public abstract String nombreFuente();

    protected abstract String claveCacheRedis();

    protected abstract Map<String, Object> invocarProveedorExternoCrudo();

    protected abstract T normalizarPayloadHeterogeneo(Map<String, Object> payloadCrudo);

    protected abstract T construirSnapshotRespaldoPorDefecto();
}
