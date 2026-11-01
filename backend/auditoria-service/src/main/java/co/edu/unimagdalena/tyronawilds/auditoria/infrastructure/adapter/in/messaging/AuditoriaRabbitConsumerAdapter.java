package co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.adapter.in.messaging;

import co.edu.unimagdalena.tyronawilds.auditoria.domain.model.RegistroAuditoria;
import co.edu.unimagdalena.tyronawilds.auditoria.domain.port.in.RegistrarEventoAuditoriaUseCase;
import co.edu.unimagdalena.tyronawilds.auditoria.infrastructure.config.RabbitMqConfig;
import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RabbitListener(queues = RabbitMqConfig.AUDITORIA_QUEUE)
public class AuditoriaRabbitConsumerAdapter {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaRabbitConsumerAdapter.class);

    private final RegistrarEventoAuditoriaUseCase registrarEventoAuditoriaUseCase;

    public AuditoriaRabbitConsumerAdapter(RegistrarEventoAuditoriaUseCase registrarEventoAuditoriaUseCase) {
        this.registrarEventoAuditoriaUseCase = registrarEventoAuditoriaUseCase;
    }

    @RabbitHandler
    public void onEventoAccesoDenegado(EventoAccesoDenegado evento) {
        String usuarioId = evento.usuarioId() != null ? evento.usuarioId().toString() : "ANONIMO";
        RegistroAuditoria guardado = registrarEventoAuditoriaUseCase.registrar(
                new RegistrarEventoAuditoriaUseCase.ComandoRegistrarAuditoria(
                        evento.eventoId(),
                        usuarioId,
                        evento.rol(),
                        evento.accion() != null ? evento.accion() : "ACCESO_DENEGADO",
                        evento.recurso() != null ? evento.recurso() : "DESCONOCIDO",
                        "DENEGADA",
                        evento.motivo(),
                        evento.ipOrigen(),
                        evento.traceId(),
                        evento.timestamp() != null ? evento.timestamp() : Instant.now()
                )
        );
        log.warn("[AUDITORIA-SEGURIDAD] [traceId={}] Operación DENEGADA persistida id={} | usuario={} | rol={} | recurso={} | motivo={}",
                guardado.traceId(), guardado.id(), guardado.usuarioId(), guardado.rol(), guardado.recurso(), guardado.motivo());
    }

    @RabbitHandler
    public void onEventoReservaConfirmada(EventoReservaConfirmada evento) {
        String usuarioId = evento.usuarioId() != null ? evento.usuarioId().toString() : "SISTEMA";
        String motivoDetalle = String.format(
                "Reserva confirmada id=%s, actividad=%s, cupos=%d, restantes=%d, monto=%s, fecha=%s",
                evento.reservaId(),
                evento.actividadId(),
                evento.cuposReservados(),
                evento.cuposRestantes(),
                evento.montoTotal(),
                evento.fechaActividad()
        );

        RegistroAuditoria guardado = registrarEventoAuditoriaUseCase.registrar(
                new RegistrarEventoAuditoriaUseCase.ComandoRegistrarAuditoria(
                        evento.eventoId(),
                        usuarioId,
                        "TURISTA",
                        "RESERVA_CONFIRMADA",
                        "reservas-service:/api/v1/reservas/" + evento.reservaId(),
                        "EXITOSA",
                        motivoDetalle,
                        "INTERNO_RABBITMQ",
                        evento.traceId(),
                        evento.timestamp() != null ? evento.timestamp() : Instant.now()
                )
        );
        log.info("[AUDITORIA-NEGOCIO] [traceId={}] Operación EXITOSA persistida id={} | reservaId={} | usuario={}",
                guardado.traceId(), guardado.id(), evento.reservaId(), guardado.usuarioId());
    }
}
