package co.edu.unimagdalena.tyronawilds.integracion.application.service;

import co.edu.unimagdalena.tyronawilds.integracion.domain.model.DatosAforoNormalizados;
import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class AdaptadorAforo extends AdaptadorFuente<DatosAforoNormalizados> {

    public AdaptadorAforo(
            ContextoCachePort cachePort,
            CircuitBreakerRegistry circuitBreakerRegistry,
            TimeLimiterRegistry timeLimiterRegistry,
            AtomicBoolean simulacionFalloGlobal
    ) {
        super(
                cachePort,
                circuitBreakerRegistry,
                timeLimiterRegistry,
                "aforoFuente",
                DatosAforoNormalizados.class,
                simulacionFalloGlobal
        );
    }

    @Override
    public String nombreFuente() {
        return "AdaptadorAforo (PNN Tayrona / Sensores Capacidad de Carga)";
    }

    @Override
    protected String claveCacheRedis() {
        return "tyronawilds:integracion:aforo:v1";
    }

    @Override
    protected Map<String, Object> invocarProveedorExternoCrudo() {
        return Map.of(
                "tayrona_avg_occ", 86,
                "park_status", "ALTA_CONGESTION_CABO_SAN_JUAN",
                "recommended_alt_zone", "Minca / Bonda / Río Don Diego"
        );
    }

    @Override
    protected DatosAforoNormalizados normalizarPayloadHeterogeneo(Map<String, Object> payloadCrudo) {
        int ocupacionTayrona = ((Number) payloadCrudo.get("tayrona_avg_occ")).intValue();
        List<DatosAforoNormalizados.AforoZona> zonas = List.of(
                new DatosAforoNormalizados.AforoZona("PNN-TAY-CSJ", "Parque Tayrona - Cabo San Juan", ocupacionTayrona, 6900, "CRITICO"),
                new DatosAforoNormalizados.AforoZona("SNSM-TEYUNA", "Sierra Nevada - Sendero Teyuna", 42, 400, "OPTIMO"),
                new DatosAforoNormalizados.AforoZona("MINCA-MARINKA", "Minca & Corregimiento de Bonda", 28, 1800, "BAJA_OCUPACION"),
                new DatosAforoNormalizados.AforoZona("TAG-AGUJA", "Taganga & Arrecife Isla Aguja", 45, 950, "MODERADO")
        );

        return new DatosAforoNormalizados(
                ocupacionTayrona,
                String.valueOf(payloadCrudo.get("park_status")),
                String.valueOf(payloadCrudo.get("recommended_alt_zone")),
                zonas
        );
    }

    @Override
    protected DatosAforoNormalizados construirSnapshotRespaldoPorDefecto() {
        return new DatosAforoNormalizados(
                82,
                "MODO_CONTINGENCIA_CACHE",
                "Minca / Corregimiento de Bonda",
                List.of(
                        new DatosAforoNormalizados.AforoZona("PNN-TAY-CSJ", "Parque Tayrona - Cabo San Juan (Caché)", 82, 6900, "ALTO"),
                        new DatosAforoNormalizados.AforoZona("MINCA-MARINKA", "Minca & Corregimiento de Bonda (Caché)", 30, 1800, "BAJA_OCUPACION")
                )
        );
    }
}
