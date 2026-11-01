package co.edu.unimagdalena.tyronawilds.reservas.application.service;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.RecursoReservaNoEncontradoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.EstadoReserva;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CancelarReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.ConsultarDisponibilidadUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CrearReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.DisponibilidadRepositoryPort;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.ReservaEventPublisherPort;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.ReservaRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CrearReservaService implements
        ConsultarDisponibilidadUseCase,
        CrearReservaUseCase,
        CancelarReservaUseCase {

    private final DisponibilidadRepositoryPort disponibilidadRepositoryPort;
    private final ReservaRepositoryPort reservaRepositoryPort;
    private final ReservaEventPublisherPort reservaEventPublisherPort;

    public CrearReservaService(
            DisponibilidadRepositoryPort disponibilidadRepositoryPort,
            ReservaRepositoryPort reservaRepositoryPort,
            ReservaEventPublisherPort reservaEventPublisherPort
    ) {
        this.disponibilidadRepositoryPort = disponibilidadRepositoryPort;
        this.reservaRepositoryPort = reservaRepositoryPort;
        this.reservaEventPublisherPort = reservaEventPublisherPort;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Disponibilidad> listarDisponibilidades(UUID actividadId, LocalDate fecha) {
        if (actividadId != null || fecha != null) {
            return disponibilidadRepositoryPort.buscarPorActividadYFecha(actividadId, fecha);
        }
        return disponibilidadRepositoryPort.buscarTodas();
    }

    @Override
    @Transactional
    public Disponibilidad crearOActualizarDisponibilidad(ComandoCrearDisponibilidad comando) {
        Disponibilidad nueva = new Disponibilidad(
                UUID.randomUUID(),
                comando.actividadId(),
                comando.nombreActividad(),
                comando.fecha(),
                comando.horaInicio(),
                comando.capacidadTotal(),
                comando.cuposDisponibles(),
                comando.precioUnitarioCop(),
                0L
        );
        return disponibilidadRepositoryPort.guardar(nueva);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Reserva crearReserva(ComandoCrearReserva comando) {
        if (comando.idempotencyKey() != null && !comando.idempotencyKey().isBlank()) {
            Optional<Reserva> existente = reservaRepositoryPort.buscarPorIdempotencyKey(comando.idempotencyKey().trim());
            if (existente.isPresent()) {
                return existente.get();
            }
        }

        // 1. Bloqueo pesimista por fila (SELECT ... FOR UPDATE) para evitar condiciones de carrera (RNF-13 / ER-02)
        Disponibilidad disponibilidad = disponibilidadRepositoryPort
                .buscarPorIdConBloqueoPesimista(comando.disponibilidadId())
                .orElseThrow(() -> new RecursoReservaNoEncontradoException(
                        "No se encontró la disponibilidad con ID: " + comando.disponibilidadId()
                ));

        // 2. Verificación de invariante de cupos bajo el bloqueo exclusivo
        if (!disponibilidad.tieneCuposSuficientes(comando.cantidadCupos())) {
            List<Disponibilidad> alternativas = disponibilidadRepositoryPort.buscarAlternativasConCupos(
                    disponibilidad.actividadId(),
                    disponibilidad.id(),
                    comando.cantidadCupos()
            );
            String mensaje = String.format(
                    "Cupos agotados o insuficientes para '%s' (%s %s). Solicitados: %d, disponibles: %d (ER-02).",
                    disponibilidad.nombreActividad(),
                    disponibilidad.fecha(),
                    disponibilidad.horaInicio(),
                    comando.cantidadCupos(),
                    disponibilidad.cuposDisponibles()
            );
            throw new ConflictoConcurrenciaCupoException(mensaje, alternativas);
        }

        // 3. Descuento atómico de cupos y persistencia de la disponibilidad
        Disponibilidad actualizada = disponibilidad.descontarCupos(comando.cantidadCupos());
        disponibilidadRepositoryPort.guardar(actualizada);

        // 4. Creación de la Reserva en estado CONFIRMADA
        BigDecimal montoTotal = disponibilidad.precioUnitarioCop()
                .multiply(BigDecimal.valueOf(comando.cantidadCupos()));

        UUID reservaId = UUID.randomUUID();
        String codigoReserva = "TW-" + reservaId.toString().substring(0, 8).toUpperCase();
        String traceId = comando.traceId() != null ? comando.traceId() : UUID.randomUUID().toString();

        Reserva nuevaReserva = new Reserva(
                reservaId,
                codigoReserva,
                comando.usuarioId(),
                disponibilidad.id(),
                disponibilidad.actividadId(),
                comando.cantidadCupos(),
                montoTotal,
                EstadoReserva.CONFIRMADA,
                comando.idempotencyKey(),
                Instant.now()
        );

        Reserva guardada = reservaRepositoryPort.guardar(nuevaReserva);

        // 5. Publicación de EventoReservaConfirmada en RabbitMQ (exchange tyronawilds.events -> reservas.confirmada)
        EventoReservaConfirmada evento = new EventoReservaConfirmada(
                UUID.randomUUID(),
                guardada.id(),
                guardada.usuarioId(),
                guardada.actividadId(),
                guardada.disponibilidadId(),
                guardada.cantidadCupos(),
                actualizada.cuposDisponibles(),
                guardada.montoTotalCop(),
                actualizada.fecha(),
                traceId,
                Instant.now()
        );
        reservaEventPublisherPort.publicarReservaConfirmada(evento);

        return guardada;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reserva> consultarReservasPorUsuario(UUID usuarioId) {
        return reservaRepositoryPort.buscarPorUsuarioId(usuarioId);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Reserva cancelarReserva(UUID reservaId, String traceId) {
        Reserva existente = reservaRepositoryPort.buscarReservaPorId(reservaId)
                .orElseThrow(() -> new RecursoReservaNoEncontradoException("No se encontró la reserva con ID: " + reservaId));

        if (existente.estadoReserva() == EstadoReserva.CANCELADA) {
            return existente;
        }

        Disponibilidad disponibilidad = disponibilidadRepositoryPort
                .buscarPorIdConBloqueoPesimista(existente.disponibilidadId())
                .orElseThrow(() -> new RecursoReservaNoEncontradoException(
                        "No se encontró la disponibilidad asociada a la reserva: " + existente.disponibilidadId()
                ));

        Disponibilidad restaurada = disponibilidad.restaurarCupos(existente.cantidadCupos());
        disponibilidadRepositoryPort.guardar(restaurada);

        Reserva cancelada = existente.cancelar();
        return reservaRepositoryPort.guardar(cancelada);
    }
}
