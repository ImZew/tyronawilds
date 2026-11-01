package co.edu.unimagdalena.tyronawilds.reservas;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.reservas.application.service.CrearReservaService;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Reserva;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CrearReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.DisponibilidadRepositoryPort;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.ReservaEventPublisherPort;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.ReservaRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

import static org.assertj.core.api.Assertions.assertThat;

class ReservasMultithreadedConcurrencyTest {

    @Test
    @DisplayName("RNF-13 / ER-02: 30 hilos simultáneos contra 5 cupos -> exactamente 5 reservas confirmadas, 25 conflictos y 0 cupos restantes")
    void debeGarantizarCeroSobreasignacionBajo30HilosConcurrentes() throws Exception {
        UUID actividadId = UUID.fromString("a0000000-0000-0000-0000-000000000009");
        UUID dispObjetivoId = UUID.fromString("d0000000-0000-0000-0000-000000000001");
        UUID dispAlternativaId = UUID.fromString("d0000000-0000-0000-0000-000000000002");

        InMemoryPessimisticDisponibilidadRepo disponibilidadRepo = new InMemoryPessimisticDisponibilidadRepo();
        disponibilidadRepo.putSinLock(new Disponibilidad(
                dispObjetivoId,
                actividadId,
                "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
                LocalDate.of(2026, 11, 15),
                LocalTime.of(5, 30),
                16,
                5, // Exactamente 5 cupos disponibles
                new BigDecimal("1850000.00"),
                0L
        ));
        disponibilidadRepo.putSinLock(new Disponibilidad(
                dispAlternativaId,
                actividadId,
                "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA)",
                LocalDate.of(2026, 11, 16),
                LocalTime.of(6, 0),
                16,
                14,
                new BigDecimal("1850000.00"),
                0L
        ));

        InMemoryReservaRepo reservaRepo = new InMemoryReservaRepo();
        List<EventoReservaConfirmada> eventosPublicados = new CopyOnWriteArrayList<>();
        ReservaEventPublisherPort publisherPort = eventosPublicados::add;

        CrearReservaService baseService = new CrearReservaService(disponibilidadRepo, reservaRepo, publisherPort);

        int totalHilos = 30;
        ExecutorService executor = Executors.newFixedThreadPool(totalHilos);
        CountDownLatch readyLatch = new CountDownLatch(totalHilos);
        CountDownLatch startGun = new CountDownLatch(1);

        AtomicInteger confirmadas = new AtomicInteger(0);
        AtomicInteger rechazadasPorCupo = new AtomicInteger(0);
        AtomicInteger alternativasSugeridasEnError = new AtomicInteger(0);

        List<Future<Void>> futures = new ArrayList<>(totalHilos);
        for (int i = 0; i < totalHilos; i++) {
            final int idx = i + 1;
            Callable<Void> task = () -> {
                readyLatch.countDown();
                startGun.await(5, TimeUnit.SECONDS);
                disponibilidadRepo.ejecutarEnTransaccionConLockFila(dispObjetivoId, () -> {
                    try {
                        baseService.crearReserva(new CrearReservaUseCase.ComandoCrearReserva(
                                UUID.randomUUID(),
                                dispObjetivoId,
                                1,
                                null,
                                "trace-concurrente-" + idx
                        ));
                        confirmadas.incrementAndGet();
                    } catch (ConflictoConcurrenciaCupoException ex) {
                        rechazadasPorCupo.incrementAndGet();
                        if (!ex.getHorariosAlternativos().isEmpty()) {
                            alternativasSugeridasEnError.incrementAndGet();
                        }
                    }
                });
                return null;
            };
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startGun.countDown();
        for (Future<Void> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdownNow();

        Disponibilidad estadoFinal = disponibilidadRepo.buscarPorId(dispObjetivoId).orElseThrow();

        assertThat(confirmadas.get()).isEqualTo(5);
        assertThat(rechazadasPorCupo.get()).isEqualTo(25);
        assertThat(alternativasSugeridasEnError.get()).isEqualTo(25);
        assertThat(estadoFinal.cuposDisponibles()).isEqualTo(0);
        assertThat(eventosPublicados).hasSize(5);
    }

    private static class InMemoryPessimisticDisponibilidadRepo implements DisponibilidadRepositoryPort {
        private final Map<UUID, Disponibilidad> store = new ConcurrentHashMap<>();
        private final Map<UUID, ReentrantLock> rowLocks = new ConcurrentHashMap<>();

        void putSinLock(Disponibilidad d) {
            store.put(d.id(), d);
            rowLocks.putIfAbsent(d.id(), new ReentrantLock(true));
        }

        void ejecutarEnTransaccionConLockFila(UUID id, Runnable accionTransaccional) {
            ReentrantLock lock = rowLocks.computeIfAbsent(id, k -> new ReentrantLock(true));
            lock.lock();
            try {
                accionTransaccional.run();
            } finally {
                lock.unlock();
            }
        }

        @Override
        public List<Disponibilidad> buscarTodas() {
            return List.copyOf(store.values());
        }

        @Override
        public List<Disponibilidad> buscarPorActividadYFecha(UUID actividadId, LocalDate fecha) {
            return List.copyOf(store.values());
        }

        @Override
        public Optional<Disponibilidad> buscarPorId(UUID id) {
            return Optional.ofNullable(store.get(id));
        }

        @Override
        public Optional<Disponibilidad> buscarPorIdConBloqueoPesimista(UUID id) {
            return Optional.ofNullable(store.get(id));
        }

        @Override
        public List<Disponibilidad> buscarAlternativasConCupos(UUID actividadId, UUID disponibilidadExcluidaId, int cuposRequeridos) {
            return store.values().stream()
                    .filter(d -> d.actividadId().equals(actividadId))
                    .filter(d -> !d.id().equals(disponibilidadExcluidaId))
                    .filter(d -> d.cuposDisponibles() >= cuposRequeridos)
                    .toList();
        }

        @Override
        public Disponibilidad guardar(Disponibilidad disponibilidad) {
            store.put(disponibilidad.id(), disponibilidad);
            return disponibilidad;
        }
    }

    private static class InMemoryReservaRepo implements ReservaRepositoryPort {
        private final Map<UUID, Reserva> reservas = new ConcurrentHashMap<>();

        @Override
        public Reserva guardar(Reserva reserva) {
            reservas.put(reserva.id(), reserva);
            return reserva;
        }

        @Override
        public Optional<Reserva> buscarReservaPorId(UUID id) {
            return Optional.ofNullable(reservas.get(id));
        }

        @Override
        public Optional<Reserva> buscarPorIdempotencyKey(String idempotencyKey) {
            return reservas.values().stream()
                    .filter(r -> idempotencyKey.equals(r.idempotencyKey()))
                    .findFirst();
        }

        @Override
        public List<Reserva> buscarPorUsuarioId(UUID usuarioId) {
            return reservas.values().stream()
                    .filter(r -> r.usuarioId().equals(usuarioId))
                    .toList();
        }
    }
}
