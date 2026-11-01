package co.edu.unimagdalena.tyronawilds.reservas.application.service;

import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;
import co.edu.unimagdalena.tyronawilds.reservas.domain.model.ReporteSimulacionConcurrencia;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.CrearReservaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.in.SimularConcurrenciaUseCase;
import co.edu.unimagdalena.tyronawilds.reservas.domain.port.out.DisponibilidadRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SimularConcurrenciaService implements SimularConcurrenciaUseCase {

    private static final UUID ACTIVIDAD_TEYUNA_ID = UUID.fromString("a0000000-0000-0000-0000-000000000009");

    private final CrearReservaUseCase crearReservaUseCase;
    private final DisponibilidadRepositoryPort disponibilidadRepositoryPort;

    public SimularConcurrenciaService(
            CrearReservaUseCase crearReservaUseCase,
            DisponibilidadRepositoryPort disponibilidadRepositoryPort
    ) {
        this.crearReservaUseCase = crearReservaUseCase;
        this.disponibilidadRepositoryPort = disponibilidadRepositoryPort;
    }

    @Override
    public ReporteSimulacionConcurrencia ejecutarSimulacionConcurrencia(ComandoSimularConcurrencia comando) {
        int cuposIniciales = (comando != null && comando.cuposIniciales() != null && comando.cuposIniciales() > 0)
                ? comando.cuposIniciales()
                : 5;
        int totalHilos = (comando != null && comando.hilosConcurrentes() != null && comando.hilosConcurrentes() > 0)
                ? Math.min(comando.hilosConcurrentes(), 100)
                : 30;

        Disponibilidad objetivo = prepararDisponibilidadObjetivo(
                comando != null ? comando.disponibilidadId() : null,
                cuposIniciales
        );

        int cuposAntesDeRafaga = objetivo.cuposDisponibles();
        AtomicInteger reservasExitosas = new AtomicInteger(0);
        AtomicInteger conflictos409 = new AtomicInteger(0);

        ExecutorService pool = Executors.newFixedThreadPool(totalHilos);
        CountDownLatch readyLatch = new CountDownLatch(totalHilos);
        CountDownLatch startGun = new CountDownLatch(1);

        long inicioNs = System.nanoTime();
        List<Future<Void>> futuros = new ArrayList<>(totalHilos);

        for (int i = 0; i < totalHilos; i++) {
            final int indiceTurista = i + 1;
            Callable<Void> tarea = () -> {
                readyLatch.countDown();
                startGun.await(5, TimeUnit.SECONDS);
                try {
                    crearReservaUseCase.crearReserva(new CrearReservaUseCase.ComandoCrearReserva(
                            UUID.randomUUID(),
                            objetivo.id(),
                            1,
                            null,
                            "sim-concurrencia-hilo-" + indiceTurista
                    ));
                    reservasExitosas.incrementAndGet();
                } catch (ConflictoConcurrenciaCupoException ex) {
                    conflictos409.incrementAndGet();
                } catch (Exception ex) {
                    conflictos409.incrementAndGet();
                }
                return null;
            };
            futuros.add(pool.submit(tarea));
        }

        try {
            readyLatch.await(5, TimeUnit.SECONDS);
            startGun.countDown();
            for (Future<Void> f : futuros) {
                f.get(15, TimeUnit.SECONDS);
            }
        } catch (Exception ignored) {
            Thread.currentThread().interrupt();
        } finally {
            pool.shutdownNow();
        }

        long duracionMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - inicioNs);

        Disponibilidad estadoFinal = disponibilidadRepositoryPort.buscarPorId(objetivo.id())
                .orElse(objetivo);

        boolean sobreasignacion = estadoFinal.cuposDisponibles() < 0
                || reservasExitosas.get() > cuposAntesDeRafaga;

        return new ReporteSimulacionConcurrencia(
                estadoFinal.id(),
                estadoFinal.nombreActividad(),
                totalHilos,
                cuposAntesDeRafaga,
                reservasExitosas.get(),
                conflictos409.get(),
                estadoFinal.cuposDisponibles(),
                sobreasignacion,
                duracionMs,
                "SELECT ... FOR UPDATE (PESSIMISTIC_WRITE) + @Transactional(READ_COMMITTED) + CHECK (cupos_disponibles >= 0)"
        );
    }

    private Disponibilidad prepararDisponibilidadObjetivo(UUID disponibilidadIdSolicitado, int cuposIniciales) {
        if (disponibilidadIdSolicitado != null) {
            return disponibilidadRepositoryPort.buscarPorId(disponibilidadIdSolicitado)
                    .map(existente -> {
                        if (existente.cuposDisponibles() <= 0) {
                            Disponibilidad recargada = new Disponibilidad(
                                    existente.id(),
                                    existente.actividadId(),
                                    existente.nombreActividad(),
                                    existente.fecha(),
                                    existente.horaInicio(),
                                    Math.max(existente.capacidadTotal(), cuposIniciales),
                                    cuposIniciales,
                                    existente.precioUnitarioCop(),
                                    existente.version()
                            );
                            return disponibilidadRepositoryPort.guardar(recargada);
                        }
                        return existente;
                    })
                    .orElseGet(() -> crearNuevaDisponibilidadDeEstres(cuposIniciales));
        }
        return crearNuevaDisponibilidadDeEstres(cuposIniciales);
    }

    private Disponibilidad crearNuevaDisponibilidadDeEstres(int cuposIniciales) {
        int segundoUnico = (int) (System.nanoTime() % 86000);
        LocalTime horaUnica = LocalTime.ofSecondOfDay(Math.abs(segundoUnico));
        Disponibilidad nueva = new Disponibilidad(
                UUID.randomUUID(),
                ACTIVIDAD_TEYUNA_ID,
                "PIERDE EL MAPA: CIUDAD PERDIDA (TEYUNA) - LOTE CONCURRENCIA",
                LocalDate.now().plusDays(10),
                horaUnica,
                Math.max(16, cuposIniciales),
                cuposIniciales,
                new BigDecimal("1850000.00"),
                0L
        );
        return disponibilidadRepositoryPort.guardar(nueva);
    }
}
