package co.edu.unimagdalena.tyronawilds.integracion.application.service;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosEventosNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class AdaptadorEventos extends AdaptadorFuente<DatosEventosNormalizados> {

    public AdaptadorEventos(
            ContextoCachePort cachePort,
            CircuitBreakerRegistry circuitBreakerRegistry,
            TimeLimiterRegistry timeLimiterRegistry,
            AtomicBoolean simulacionFalloGlobal
    ) {
        super(
                cachePort,
                circuitBreakerRegistry,
                timeLimiterRegistry,
                "eventosFuente",
                DatosEventosNormalizados.class,
                simulacionFalloGlobal
        );
    }

    @Override
    public String nombreFuente() {
        return "AdaptadorEventos (Agenda Cultural Distrito de Santa Marta)";
    }

    @Override
    protected String claveCacheRedis() {
        return "tyronawilds:integracion:eventos:v1";
    }

    @Override
    protected Map<String, Object> invocarProveedorExternoCrudo() {
        return Map.of("season", "TEMPORADA_EXPEDICION_SIERRA_Y_CARIBE_2026");
    }

    @Override
    protected DatosEventosNormalizados normalizarPayloadHeterogeneo(Map<String, Object> payloadCrudo) {
        return new DatosEventosNormalizados(
                String.valueOf(payloadCrudo.get("season")),
                List.of(
                        new DatosEventosNormalizados.EventoCulturalAgenda(
                                "EVT-SM-01",
                                "Encuentro de Saberes Arhuacos y Cafés de Origen en Minca",
                                "Arhuaco Ancestral Knowledge & Origin Coffee Gathering in Minca",
                                "Minca - Estación Bioclimática",
                                "Sábado 16:00 COT"
                        ),
                        new DatosEventosNormalizados.EventoCulturalAgenda(
                                "EVT-SM-02",
                                "Ruta Sonora al Atardecer en el Camellón de la Bahía",
                                "Sunset Sonic Walk at Santa Marta Bay Boardwalk",
                                "Centro Histórico Santa Marta",
                                "Viernes 17:45 COT"
                        )
                )
        );
    }

    @Override
    protected DatosEventosNormalizados construirSnapshotRespaldoPorDefecto() {
        return new DatosEventosNormalizados(
                "AGENDA_DESDE_CACHE_REDIS",
                List.of(
                        new DatosEventosNormalizados.EventoCulturalAgenda(
                                "EVT-CACHE-01",
                                "Recorrido Patrimonial Centro Histórico (Snapshot Caché)",
                                "Historic Center Heritage Walk (Cached Snapshot)",
                                "Centro Histórico Santa Marta",
                                "Diario 18:00 COT"
                        )
                )
        );
    }
}
