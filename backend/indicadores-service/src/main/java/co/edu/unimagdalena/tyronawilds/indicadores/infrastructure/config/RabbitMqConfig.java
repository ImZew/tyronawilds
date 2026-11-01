package co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String INDICADORES_QUEUE = "indicadores.capacidad.q";

    private final String exchangeName;
    private final String queueName;
    private final String routingKey;

    public RabbitMqConfig(
            @Value("${app.messaging.exchange:tyronawilds.events}") String exchangeName,
            @Value("${app.messaging.indicadores-queue:indicadores.capacidad.q}") String queueName,
            @Value("${app.messaging.reserva-confirmada-routing-key:reservas.confirmada}") String routingKey
    ) {
        this.exchangeName = exchangeName;
        this.queueName = queueName;
        this.routingKey = routingKey;
    }

    @Bean
    public TopicExchange tyronaWildsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue indicadoresQueue() {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Binding indicadoresReservaBinding(Queue indicadoresQueue, TopicExchange tyronaWildsExchange) {
        return BindingBuilder.bind(indicadoresQueue)
                .to(tyronaWildsExchange)
                .with(routingKey);
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
