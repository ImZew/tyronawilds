package co.edu.unimagdalena.tyronawilds.integracion.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.atomic.AtomicBoolean;

@Configuration
public class IntegracionBeansConfig {

    @Bean
    public AtomicBoolean simulacionFalloGlobal() {
        return new AtomicBoolean(false);
    }
}
