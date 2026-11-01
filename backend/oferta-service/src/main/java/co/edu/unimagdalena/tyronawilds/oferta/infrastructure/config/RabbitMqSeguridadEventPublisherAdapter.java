package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.SeguridadEventPublisherPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RabbitMqSeguridadEventPublisherAdapter implements SeguridadEventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(RabbitMqSeguridadEventPublisherAdapter.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchangeName;
    private final String routingKey;

    public RabbitMqSeguridadEventPublisherAdapter(
            RabbitTemplate rabbitTemplate,
            @Value("${app.messaging.exchange:tyronawilds.events}") String exchangeName,
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
            log.warn("[OFERTA-SEGURIDAD] [traceId={}] EventoAccesoDenegado publicado en RabbitMQ -> recurso={}, motivo={}",
                    evento.traceId(), evento.recurso(), evento.motivo());
        } catch (Exception ex) {
            log.warn("No se pudo publicar EventoAccesoDenegado en RabbitMQ (modo degradado): {}", ex.getMessage());
        }
    }
}
