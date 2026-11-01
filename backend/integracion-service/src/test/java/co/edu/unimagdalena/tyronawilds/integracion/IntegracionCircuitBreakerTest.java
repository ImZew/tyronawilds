package co.edu.unimagdalena.tyronawilds.integracion;

import co.edu.unimagdalena.tyronawilds.integracion.application.service.AdaptadorAforo;
import co.edu.unimagdalena.tyronawilds.integracion.application.service.AdaptadorClima;
import co.edu.unimagdalena.tyronawilds.integracion.application.service.AdaptadorEventos;
import co.edu.unimagdalena.tyronawilds.integracion.application.service.IntegracionApplicationService;
import co.edu.unimagdalena.tyronawilds.integracion.domain.model.ContextoTerritorialAgregado;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class IntegracionCircuitBreakerTest {

    private IntegracionApplicationService service;
    private AtomicBoolean simulacionFalloGlobal;

    @BeforeEach
    void setUp() {
        simulacionFalloGlobal = new AtomicBoolean(false);

        ContextoCachePort inMemoryCache = new ContextoCachePort() {
            private final Map<String, Object> storage = new ConcurrentHashMap<>();

            @Override
            public <T> void guardarSnapshot(String clave, T valor, Class<T> clazz) {
                storage.put(clave, valor);
            }

            @Override
            @SuppressWarnings("unchecked")
            public <T> Optional<T> recuperarSnapshot(String clave, Class<T> clazz) {
                return Optional.ofNullable((T) storage.get(clave));
            }
        };

        CircuitBreakerConfig cbConfig = CircuitBreakerConfig.custom()
                .slidingWindowSize(2)
                .minimumNumberOfCalls(2)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .build();
        CircuitBreakerRegistry cbRegistry = CircuitBreakerRegistry.of(cbConfig);

        TimeLimiterConfig tlConfig = TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(2))
                .build();
        TimeLimiterRegistry tlRegistry = TimeLimiterRegistry.of(tlConfig);

        AdaptadorClima adaptadorClima = new AdaptadorClima(inMemoryCache, cbRegistry, tlRegistry, simulacionFalloGlobal);
        AdaptadorAforo adaptadorAforo = new AdaptadorAforo(inMemoryCache, cbRegistry, tlRegistry, simulacionFalloGlobal);
        AdaptadorEventos adaptadorEventos = new AdaptadorEventos(inMemoryCache, cbRegistry, tlRegistry, simulacionFalloGlobal);

        service = new IntegracionApplicationService(adaptadorClima, adaptadorAforo, adaptadorEventos, simulacionFalloGlobal);
    }

    @Test
    @DisplayName("En operación normal retorna LIVE_API, degradado=false y Circuit Breaker CLOSED")
    void debeConsultarFuentesEnVivoNormalizandoDatos() {
        ContextoTerritorialAgregado contexto = service.consultarContextoActual();

        assertThat(contexto.degradado()).isFalse();
        assertThat(contexto.fuenteDatos()).isEqualTo("LIVE_API");
        assertThat(contexto.estadoCircuitBreaker()).isEqualTo("CLOSED");
        assertThat(contexto.clima().temperaturaCelsius()).isEqualTo(29.4);
        assertThat(contexto.aforo().ocupacionPromedioTayronaPorcentaje()).isEqualTo(86);
    }

    @Test
    @DisplayName("ER-01: Ante fallo de API externa activa Circuit Breaker OPEN y responde desde REDIS_CACHE_FALLBACK con degradado=true")
    void debeActivarCircuitBreakerYResponderDesdeCacheAnteFalloExterno() {
        // 1. Calentamos el caché con una llamada exitosa
        ContextoTerritorialAgregado inicial = service.consultarContextoActual();
        assertThat(inicial.degradado()).isFalse();

        // 2. Activamos la simulación de caída del proveedor externo (ER-01 / EXC-01)
        ContextoTerritorialAgregado enFallo = service.configurarSimulacionFallo(true);

        assertThat(enFallo.degradado()).isTrue();
        assertThat(enFallo.fuenteDatos()).isEqualTo("REDIS_CACHE_FALLBACK");
        assertThat(enFallo.estadoCircuitBreaker()).isEqualTo("OPEN");
        assertThat(enFallo.clima()).isNotNull();
        assertThat(enFallo.aforo()).isNotNull();
        assertThat(enFallo.eventos()).isNotNull();
    }
}
