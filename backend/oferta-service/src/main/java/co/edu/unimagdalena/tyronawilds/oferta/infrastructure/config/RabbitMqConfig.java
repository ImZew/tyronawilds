package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.config;

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

    private final String exchangeName;
    private final String auditoriaQueueName;
    private final String auditoriaRoutingKey;

    public RabbitMqConfig(
            @Value("${app.messaging.exchange:tyronawilds.events}") String exchangeName,
            @Value("${app.messaging.auditoria-queue:auditoria.q}") String auditoriaQueueName,
            @Value("${app.messaging.auditoria-routing-key:seguridad.acceso.denegado}") String auditoriaRoutingKey
    ) {
        this.exchangeName = exchangeName;
        this.auditoriaQueueName = auditoriaQueueName;
        this.auditoriaRoutingKey = auditoriaRoutingKey;
    }

    @Bean
    public TopicExchange tyronaWildsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue auditoriaQueue() {
        return QueueBuilder.durable(auditoriaQueueName).build();
    }

    @Bean
    public Binding auditoriaBinding(Queue auditoriaQueue, TopicExchange tyronaWildsExchange) {
        return BindingBuilder.bind(auditoriaQueue)
                .to(tyronaWildsExchange)
                .with(auditoriaRoutingKey);
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
