package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.config;

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

    public static final String AUDITORIA_QUEUE = "auditoria.q";
    public static final String TYRONAWILDS_EXCHANGE = "tyronawilds.events";

    private final String exchangeName;
    private final String queueName;

    public RabbitMqConfig(
            @Value("${app.messaging.exchange:tyronawilds.events}") String exchangeName,
            @Value("${app.messaging.auditoria-queue:auditoria.q}") String queueName
    ) {
        this.exchangeName = exchangeName;
        this.queueName = queueName;
    }

    @Bean
    public TopicExchange tyronaWildsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue auditoriaQueue() {
        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public Binding bindingSeguridad(Queue auditoriaQueue, TopicExchange tyronaWildsExchange) {
        return BindingBuilder.bind(auditoriaQueue)
                .to(tyronaWildsExchange)
                .with("seguridad.#");
    }

    @Bean
    public Binding bindingReservas(Queue auditoriaQueue, TopicExchange tyronaWildsExchange) {
        return BindingBuilder.bind(auditoriaQueue)
                .to(tyronaWildsExchange)
                .with("reservas.#");
    }

    @Bean
    public Binding bindingAuditoria(Queue auditoriaQueue, TopicExchange tyronaWildsExchange) {
        return BindingBuilder.bind(auditoriaQueue)
                .to(tyronaWildsExchange)
                .with("auditoria.#");
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
