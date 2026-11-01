package co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.adapter.in.messaging;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.model.IndicadorCapacidadDestino;
import co.edu.unimagdalena.tyronawilds.indicadores.domain.port.in.ConsultarIndicadoresUseCase;
import co.edu.unimagdalena.tyronawilds.indicadores.infrastructure.config.RabbitMqConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class IndicadoresReservaConsumerAdapter {

    private static final Logger log = LoggerFactory.getLogger(IndicadoresReservaConsumerAdapter.class);

    private final ConsultarIndicadoresUseCase consultarIndicadoresUseCase;

    public IndicadoresReservaConsumerAdapter(ConsultarIndicadoresUseCase consultarIndicadoresUseCase) {
        this.consultarIndicadoresUseCase = consultarIndicadoresUseCase;
    }

    @RabbitListener(queues = RabbitMqConfig.INDICADORES_QUEUE)
    public void onEventoReservaConfirmada(EventoReservaConfirmada evento) {
        IndicadorCapacidadDestino actualizado = consultarIndicadoresUseCase.procesarReservaConfirmada(
                evento.actividadId(),
                evento.cuposReservados(),
                evento.traceId()
        );
        log.info("[INDICADORES-SOSTENIBILIDAD] [traceId={}] Ocupación actualizada para '{}' -> {}% (alerta={})",
                evento.traceId(),
                actualizado.nombreDestino(),
                actualizado.porcentajeOcupacion(),
                actualizado.estadoAlerta());
    }
}
