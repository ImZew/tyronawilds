package co.edu.unimagdalena.tyronawilds.recomendacion.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.CatalogoOfertaClientPort;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.ContextoExternoClientPort;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class HttpDownstreamClientsAdapter implements CatalogoOfertaClientPort, ContextoExternoClientPort {

    private static final Logger log = LoggerFactory.getLogger(HttpDownstreamClientsAdapter.class);

    private final RestClient ofertaRestClient;
    private final RestClient integracionRestClient;
    private final CircuitBreaker contextoCircuitBreaker;

    public HttpDownstreamClientsAdapter(
            @Value("${app.services.oferta-url:http://localhost:8082}") String ofertaUrl,
            @Value("${app.services.integracion-url:http://localhost:8085}") String integracionUrl,
            @Value("${app.services.timeout-ms:2000}") int timeoutMs,
            CircuitBreakerRegistry circuitBreakerRegistry
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);

        this.ofertaRestClient = RestClient.builder()
                .baseUrl(ofertaUrl)
                .requestFactory(requestFactory)
                .build();
        this.integracionRestClient = RestClient.builder()
                .baseUrl(integracionUrl)
                .requestFactory(requestFactory)
                .build();
        this.contextoCircuitBreaker = circuitBreakerRegistry.circuitBreaker("contextoTerritorialClient");
    }

    @Override
    public List<CandidatoOferta> consultarCandidatosCatalogo(String tags) {
        try {
            List<CandidatoOferta> remotos = ofertaRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/ofertas/similares")
                            .queryParam("tags", tags != null ? tags : "")
                            .queryParam("priorizarBajaOcupacion", true)
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (remotos != null && !remotos.isEmpty()) {
                return remotos;
            }
        } catch (Exception ex) {
            log.warn("No se pudo contactar oferta-service remoto ({}), usando catálogo local de respaldo: {}",
                    ex.getMessage(), tags);
        }
        return construirCatalogoRespaldoSantaMarta();
    }

    @Override
    @SuppressWarnings("unchecked")
    public ContextoTerritorialResumen consultarContextoTerritorial() {
        try {
            return contextoCircuitBreaker.executeSupplier(() -> {
                Map<String, Object> body = integracionRestClient.get()
                        .uri("/api/v1/contexto")
                        .retrieve()
                        .body(new ParameterizedTypeReference<>() {});

                if (body == null) {
                    throw new IllegalStateException("Respuesta vacía desde integracion-service");
                }

                Map<String, Object> clima = (Map<String, Object>) body.getOrDefault("clima", Map.of());
                Map<String, Object> aforo = (Map<String, Object>) body.getOrDefault("aforo", Map.of());

                double temp = clima.get("temperaturaCelsius") instanceof Number n ? n.doubleValue() : 29.0;
                String condicion = String.valueOf(clima.getOrDefault("condicion", "SOLEADO_CARIBE"));
                int ocupacion = aforo.get("ocupacionPromedioTayronaPorcentaje") instanceof Number n ? n.intValue() : 85;
                String zonaAlt = String.valueOf(aforo.getOrDefault("zonaRecomendadaDesconcentracion", "Minca / Bonda"));
                boolean degradado = Boolean.TRUE.equals(body.get("degradado"));
                String fuenteDatos = String.valueOf(body.getOrDefault("fuenteDatos", "LIVE_API"));

                return new ContextoTerritorialResumen(temp, condicion, ocupacion, zonaAlt, degradado, fuenteDatos);
            });
        } catch (Exception ex) {
            log.warn("[RECOMENDACION-ER01] Timeout o error consultando integracion-service: {}. Transicionando a ContextoDegradado.",
                    ex.getMessage());
            return new ContextoTerritorialResumen(
                    28.5,
                    "CONTINGENCIA_CACHE_ER01",
                    85,
                    "Minca / Corregimiento de Bonda",
                    true,
                    "REDIS_CACHE_FALLBACK"
            );
        }
    }

    private List<CandidatoOferta> construirCatalogoRespaldoSantaMarta() {
        return List.of(
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000003"),
                        103L,
                        "EXPEDICIÓN BIOCLIMÁTICA & CASCADAS DE MARINKA",
                        "BIOCLIMATIC EXPEDITION & MARINKA WATERFALLS",
                        "expedicion-bioclimatica-cascadas-marinka",
                        "BOSQUE_NIEBLA_SOSTENIBLE",
                        "Minca / Corregimiento de Bonda",
                        "11°08'35\"N 74°06'58\"W",
                        650,
                        new BigDecimal("210000.00"),
                        28,
                        true,
                        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80",
                        "minca,bonda,cascadas,cafe,avistamiento-aves,sostenible,desconcentracion"
                ),
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000009"),
                        9L,
                        "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
                        "LOSE THE MAP: LOST CITY (TEYUNA) TREK",
                        "pierde-el-mapa-ciudad-perdida-teyuna",
                        "ALTA_MONTANA_ANCESTRAL",
                        "Sierra Nevada de Santa Marta",
                        "11°02'16\"N 73°55'31\"W",
                        1200,
                        new BigDecimal("1850000.00"),
                        42,
                        true,
                        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80",
                        "trekking,sierra-nevada,ancestral,sostenible,arqueologia,selva"
                ),
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000005"),
                        105L,
                        "DESCENSO RÍO DON DIEGO & CONEXIÓN ARHUACA",
                        "DON DIEGO RIVER DESCENT & ARHUACO CONNECTION",
                        "descenso-rio-don-diego-conexion-arhuaca",
                        "TURISMO_COMUNITARIO",
                        "Piedemonte Sierra Nevada",
                        "11°15'22\"N 73°42'10\"W",
                        45,
                        new BigDecimal("245000.00"),
                        30,
                        true,
                        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80",
                        "rio,comunitario,arhuaco,kayak,sostenible,naturaleza"
                ),
                new CandidatoOferta(
                        UUID.fromString("a0000000-0000-0000-0000-000000000002"),
                        102L,
                        "CABO SAN JUAN & SENDERO NUIJPIA",
                        "CABO SAN JUAN & NUIJPIA TRAIL",
                        "cabo-san-juan-sendero-nuijpia",
                        "COSTA_PARQUE_NACIONAL",
                        "Parque Nacional Natural Tayrona",
                        "11°19'51\"N 73°57'43\"W",
                        15,
                        new BigDecimal("290000.00"),
                        88,
                        true,
                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
                        "playa,tayrona,senderismo,naturaleza,caribe,fotografia"
                )
        );
    }
}
