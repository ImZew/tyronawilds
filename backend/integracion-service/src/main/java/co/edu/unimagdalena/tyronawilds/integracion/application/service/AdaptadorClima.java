package co.edu.unimagdalena.tyronawilds.integracion.application.service;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosClimaNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class AdaptadorClima extends AdaptadorFuente<DatosClimaNormalizados> {

    public AdaptadorClima(
            ContextoCachePort cachePort,
            CircuitBreakerRegistry circuitBreakerRegistry,
            TimeLimiterRegistry timeLimiterRegistry,
            AtomicBoolean simulacionFalloGlobal
    ) {
        super(
                cachePort,
                circuitBreakerRegistry,
                timeLimiterRegistry,
                "climaFuente",
                DatosClimaNormalizados.class,
                simulacionFalloGlobal
        );
    }

    @Override
    public String nombreFuente() {
        return "AdaptadorClima (IDEAM / OpenMeteo Santa Marta)";
    }

    @Override
    protected String claveCacheRedis() {
        return "tyronawilds:integracion:clima:v1";
    }

    @Override
    protected Map<String, Object> invocarProveedorExternoCrudo() {
        return Map.of(
                "station_name", "Estación Meteorológica Parque Tayrona & Sierra Nevada",
                "temp_c", 29.4,
                "humidity_pct", 76,
                "weather_code", "SOLEADO_BRISA_CARIBE",
                "rain_prob_pct", 18.0,
                "advisory", "Condiciones óptimas en costa y bosque húmedo de Minca"
        );
    }

    @Override
    protected DatosClimaNormalizados normalizarPayloadHeterogeneo(Map<String, Object> payloadCrudo) {
        return new DatosClimaNormalizados(
                String.valueOf(payloadCrudo.get("station_name")),
                ((Number) payloadCrudo.get("temp_c")).doubleValue(),
                ((Number) payloadCrudo.get("humidity_pct")).intValue(),
                String.valueOf(payloadCrudo.get("weather_code")),
                ((Number) payloadCrudo.get("rain_prob_pct")).doubleValue(),
                String.valueOf(payloadCrudo.get("advisory"))
        );
    }

    @Override
    protected DatosClimaNormalizados construirSnapshotRespaldoPorDefecto() {
        return new DatosClimaNormalizados(
                "Estación Santa Marta (Snapshot Caché ER-01)",
                28.5,
                78,
                "PARCIALMENTE_NUBLADO_CACHE",
                22.0,
                "Datos meteorológicos servidos desde caché de contingencia (ER-01)"
        );
    }
}
