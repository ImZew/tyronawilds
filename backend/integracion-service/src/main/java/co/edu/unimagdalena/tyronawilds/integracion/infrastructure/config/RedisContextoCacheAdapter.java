package co.edu.unimagdalena.tyronawilds.integracion.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.integracion.domain.port.out.ContextoCachePort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RedisContextoCacheAdapter implements ContextoCachePort {

    private static final Logger log = LoggerFactory.getLogger(RedisContextoCacheAdapter.class);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration ttl;
    private final Map<String, String> localMemoryBackup = new ConcurrentHashMap<>();

    public RedisContextoCacheAdapter(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.cache.ttl-seconds:300}") long ttlSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    @Override
    public <T> void guardarSnapshot(String clave, T valor, Class<T> clazz) {
        try {
            String json = objectMapper.writeValueAsString(valor);
            localMemoryBackup.put(clave, json);
            redisTemplate.opsForValue().set(clave, json, ttl);
        } catch (Exception ex) {
            log.debug("No se pudo guardar snapshot en Redis para clave {} (respaldo en memoria local activo): {}", clave, ex.getMessage());
        }
    }

    @Override
    public <T> Optional<T> recuperarSnapshot(String clave, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(clave);
            if (json != null && !json.isBlank()) {
                return Optional.of(objectMapper.readValue(json, clazz));
            }
        } catch (Exception ex) {
            log.debug("Lectura Redis no disponible para {}, consultando respaldo local: {}", clave, ex.getMessage());
        }

        try {
            String localJson = localMemoryBackup.get(clave);
            if (localJson != null) {
                return Optional.of(objectMapper.readValue(localJson, clazz));
            }
        } catch (Exception ignored) {
        }

        return Optional.empty();
    }
}
