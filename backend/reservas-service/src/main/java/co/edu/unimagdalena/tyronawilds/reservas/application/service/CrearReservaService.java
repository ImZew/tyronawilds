package co.edu.unimagdalena.tyronawilds.reservas.application.service;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoReservaConfirmada;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.ConflictoConcurrenciaCupoException;
import co.edu.unimagdalena.tyronawilds.reservas.domain.exception.IntegridadIdentidadPasajeroException;
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
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CrearReservaService implements
        ConsultarDisponibilidadUseCase,
        CrearReservaUseCase,
        CancelarReservaUseCase {

    private final DisponibilidadRepositoryPort disponibilidadRepositoryPort;
    private final ReservaRepositoryPort reservaRepositoryPort;
    private final ReservaEventPublisherPort reservaEventPublisherPort;

    private final Map<String, String> directorioIdentidadCivil = new ConcurrentHashMap<>();
    private final Set<String> pasajerosConfirmadosPorSalida = ConcurrentHashMap.newKeySet();

    public CrearReservaService(
            DisponibilidadRepositoryPort disponibilidadRepositoryPort,
            ReservaRepositoryPort reservaRepositoryPort,
            ReservaEventPublisherPort reservaEventPublisherPort
    ) {
        this.disponibilidadRepositoryPort = disponibilidadRepositoryPort;
        this.reservaRepositoryPort = reservaRepositoryPort;
        this.reservaEventPublisherPort = reservaEventPublisherPort;

        // Registro civil semilla oficial (1 Documento = 1 Persona)
        this.directorioIdentidadCivil.put("CC1083019450", "Sebastián Abaonza");
        this.directorioIdentidadCivil.put("CC1082940182", "Valeria Mejía");
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

        // 0. Validación de integridad de identidad civil y anti-duplicidad por salida
        validarIntegridadPasajeros(comando.disponibilidadId(), comando.pasajeros());

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
        registrarPasajerosConfirmados(disponibilidad.id(), comando.pasajeros());

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

    private void validarIntegridadPasajeros(UUID disponibilidadId, List<PasajeroReservaComando> pasajeros) {
        if (pasajeros == null || pasajeros.isEmpty()) {
            return;
        }

        Set<String> documentosEnGrupo = new HashSet<>();
        for (PasajeroReservaComando pasajero : pasajeros) {
            String docNorm = normalizarDocumento(pasajero.documento());
            String nombreLimpio = pasajero.nombre() != null ? pasajero.nombre().trim() : "";

            // Regla 1: Unicidad de documento dentro de la misma reserva
            if (!documentosEnGrupo.add(docNorm)) {
                throw new IntegridadIdentidadPasajeroException(
                        422,
                        "DOCUMENTO_DUPLICADO_EN_GRUPO",
                        "DOCUMENTO DUPLICADO EN EL GRUPO: Cada expedicionario debe registrar un documento de identidad único."
                );
            }

            // Regla 2: Consistencia de Identidad Civil (1 Documento = 1 Persona)
            String titularRegistrado = directorioIdentidadCivil.get(docNorm);
            if (titularRegistrado != null && !normalizarNombre(titularRegistrado).equals(normalizarNombre(nombreLimpio))) {
                throw new IntegridadIdentidadPasajeroException(
                        422,
                        "IDENTIDAD_INCONSISTENTE",
                        String.format(
                                "El documento %s ya se encuentra registrado en el sistema bajo el titular %s. No se permite asociar otra identidad a la misma cédula.",
                                pasajero.documento(),
                                titularRegistrado
                        )
                );
            }

            // Regla 3: Bloqueo de doble reserva en la misma salida
            String claveSalida = disponibilidadId + "|" + docNorm;
            if (pasajerosConfirmadosPorSalida.contains(claveSalida)) {
                throw new IntegridadIdentidadPasajeroException(
                        409,
                        "PASAJERO_YA_REGISTRADO_EN_SALIDA",
                        String.format(
                                "RESERVA DUPLICADA EN SALIDA: El viajero con documento %s ya cuenta con un cupo confirmado en esta misma fecha y horario de expedición.",
                                pasajero.documento()
                        )
                );
            }
        }
    }

    private void registrarPasajerosConfirmados(UUID disponibilidadId, List<PasajeroReservaComando> pasajeros) {
        if (pasajeros == null || pasajeros.isEmpty()) {
            return;
        }
        for (PasajeroReservaComando pasajero : pasajeros) {
            String docNorm = normalizarDocumento(pasajero.documento());
            if (!docNorm.isBlank() && pasajero.nombre() != null && !pasajero.nombre().isBlank()) {
                directorioIdentidadCivil.putIfAbsent(docNorm, pasajero.nombre().trim());
                pasajerosConfirmadosPorSalida.add(disponibilidadId + "|" + docNorm);
            }
        }
    }

    private String normalizarDocumento(String doc) {
        if (doc == null) {
            return "";
        }
        String limpio = doc.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        String soloDigitos = limpio.replaceAll("^(CC|CE|TI|PA|PAS|NIT)", "");
        return soloDigitos.isBlank() ? limpio : "CC" + soloDigitos;
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        String sinAcentos = Normalizer.normalize(nombre.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
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
