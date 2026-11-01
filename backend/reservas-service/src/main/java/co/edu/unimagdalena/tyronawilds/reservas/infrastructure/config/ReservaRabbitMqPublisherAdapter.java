package co.edu.unimagdalena.tyronawilds.reservas.infrastructure.config;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.ReservaEventPublisherPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ReservaRabbitMqPublisherAdapter implements ReservaEventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(ReservaRabbitMqPublisherAdapter.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchangeName;
    private final String routingKey;

    public ReservaRabbitMqPublisherAdapter(
            RabbitTemplate rabbitTemplate,
            @Value("${app.messaging.exchange:tyronawilds.events}") String exchangeName,
            @Value("${app.messaging.reserva-confirmada-routing-key:reservas.confirmada}") String routingKey
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchangeName = exchangeName;
        this.routingKey = routingKey;
    }

    @Override
    public void publicarReservaConfirmada(EventoReservaConfirmada evento) {
        try {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, evento);
            log.info("[RESERVAS-EVENTO] [traceId={}] EventoReservaConfirmada publicado -> reservaId={}, cuposRestantes={}",
                    evento.traceId(), evento.reservaId(), evento.cuposRestantes());
        } catch (Exception ex) {
            log.warn("No se pudo publicar EventoReservaConfirmada en RabbitMQ (modo degradado): {}", ex.getMessage());
        }
    }
}
