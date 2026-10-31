package co.edu.unimagdalena.tyronawilds.identidad.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.identidad.domain.port.out.AuditoriaAuthEventPublisherPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RabbitMqAuditoriaEventPublisherAdapter implements AuditoriaAuthEventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(RabbitMqAuditoriaEventPublisherAdapter.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchangeName;
    private final String routingKey;

    public RabbitMqAuditoriaEventPublisherAdapter(
            RabbitTemplate rabbitTemplate,
            @Value("${app.messaging.exchange:tyronawilds.eventos.exchange}") String exchangeName,
            @Value("${app.messaging.auditoria-routing-key:seguridad.acceso.denegado}") String routingKey
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchangeName = exchangeName;
        this.routingKey = routingKey;
    }

    @Override
    public void publicarAccesoDenegado(EventoAccesoDenegado evento) {
        try {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, evento);
            log.info("EventoAccesoDenegado publicado en RabbitMQ -> recurso={}, motivo={}, traceId={}",
                    evento.recurso(), evento.motivo(), evento.traceId());
        } catch (Exception ex) {
            log.warn("No se pudo publicar EventoAccesoDenegado en RabbitMQ (modo degradado RNF-07): {}", ex.getMessage());
        }
    }
}
