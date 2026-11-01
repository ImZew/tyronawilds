package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.CatalogoCachePort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Component
public class RedisCatalogoCacheAdapter implements CatalogoCachePort {

    private static final Logger log = LoggerFactory.getLogger(RedisCatalogoCacheAdapter.class);
    private static final String CACHE_KEY = "tyronawilds:oferta:catalogo:v1";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public RedisCatalogoCacheAdapter(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.cache.ttl-seconds:300}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    @Override
    public Optional<List<ActividadTuristica>> obtenerCatalogoCacheado() {
        try {
            String json = redisTemplate.opsForValue().get(CACHE_KEY);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            List<ActividadTuristica> lista = objectMapper.readValue(json, new TypeReference<>() {});
            return Optional.of(lista);
        } catch (Exception ex) {
            log.debug("Lectura de caché Redis omitida (fallback a BD): {}", ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void guardarCatalogoEnCache(List<ActividadTuristica> actividades) {
        try {
            String json = objectMapper.writeValueAsString(actividades);
            redisTemplate.opsForValue().set(CACHE_KEY, json, ttl);
        } catch (Exception ex) {
            log.debug("No se pudo almacenar el catálogo en Redis: {}", ex.getMessage());
        }
    }

    @Override
    public void invalidarCacheCatalogo() {
        try {
            redisTemplate.delete(CACHE_KEY);
        } catch (Exception ex) {
            log.debug("No se pudo invalidar el caché de catálogo en Redis: {}", ex.getMessage());
        }
    }
}
