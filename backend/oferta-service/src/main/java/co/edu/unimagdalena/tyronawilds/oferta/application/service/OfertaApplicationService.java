package co.edu.unimagdalena.tyronawilds.oferta.application.service;

import co.edu.unimagdalena.tyronawilds.contratos.eventos.EventoAccesoDenegado;
import co.edu.unimagdalena.tyronawilds.contratos.security.InputSanitizer;
import co.edu.unimagdalena.tyronawilds.oferta.domain.exception.AccesoRecursoProhibidoException;
import co.edu.unimagdalena.tyronawilds.oferta.domain.exception.RecursoNoEncontradoException;
import co.edu.unimagdalena.tyronawilds.oferta.domain.model.ActividadTuristica;
import co.edu.unimagdalena.tyronawilds.oferta.domain.model.Prestador;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.BuscarSimilaresUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.ConsultarCatalogoUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.in.GestionarServicioTuristicoUseCase;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.ActividadRepositoryPort;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.CatalogoCachePort;
import co.edu.unimagdalena.tyronawilds.oferta.domain.port.out.SeguridadEventPublisherPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OfertaApplicationService implements
        ConsultarCatalogoUseCase,
        BuscarSimilaresUseCase,
        GestionarServicioTuristicoUseCase {

    private final ActividadRepositoryPort repositoryPort;
    private final CatalogoCachePort cachePort;
    private final SeguridadEventPublisherPort seguridadEventPublisherPort;

    public OfertaApplicationService(
            ActividadRepositoryPort repositoryPort,
            CatalogoCachePort cachePort,
            SeguridadEventPublisherPort seguridadEventPublisherPort
    ) {
        this.repositoryPort = repositoryPort;
        this.cachePort = cachePort;
        this.seguridadEventPublisherPort = seguridadEventPublisherPort;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActividadTuristica> listarActividades(String categoria, Boolean soloSostenibles) {
        List<ActividadTuristica> base = cachePort.obtenerCatalogoCacheado()
                .orElseGet(() -> {
                    List<ActividadTuristica> desdeBd = repositoryPort.buscarTodas();
                    cachePort.guardarCatalogoEnCache(desdeBd);
                    return desdeBd;
                });

        return base.stream()
                .filter(a -> categoria == null || categoria.isBlank() || a.categoria().equalsIgnoreCase(categoria.trim()))
                .filter(a -> soloSostenibles == null || !soloSostenibles || a.esSostenible())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ActividadTuristica obtenerPorId(UUID id) {
        return repositoryPort.buscarPorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la actividad turística con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public ActividadTuristica obtenerPorCodigoServicio(long codigoServicio) {
        return repositoryPort.buscarPorCodigoServicio(codigoServicio)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el servicio turístico con código: " + codigoServicio));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActividadTuristica> buscarSimilaresPorTags(String tags, boolean priorizarBajaOcupacion) {
        List<ActividadTuristica> todas = listarActividades(null, null);
        Set<String> tagsBuscados = (tags == null || tags.isBlank())
                ? Set.of()
                : Arrays.stream(tags.toLowerCase().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toSet());

        Comparator<ActividadTuristica> comparador = Comparator
                .comparingInt((ActividadTuristica a) -> contarCoincidenciasTags(a.tagsAfinidad(), tagsBuscados))
                .reversed();

        if (priorizarBajaOcupacion) {
            comparador = comparador
                    .thenComparing(ActividadTuristica::esSostenible, Comparator.reverseOrder())
                    .thenComparingInt(ActividadTuristica::nivelOcupacionActual);
        }

        return todas.stream()
                .sorted(comparador)
                .toList();
    }

    @Override
    @Transactional
    public ActividadTuristica crearActividad(ComandoCrearActividad comando, ContextoSeguridadActor actor) {
        validarRolOperadorOAdmin(actor, "oferta-service:/api/v1/actividades", "CREAR_ACTIVIDAD");

        Prestador prestador = resolverPrestadorDelActor(actor)
                .orElseThrow(() -> new AccesoRecursoProhibidoException("No se pudo asociar un prestador válido al actor actual."));

        ActividadTuristica nueva = new ActividadTuristica(
                UUID.randomUUID(),
                comando.codigoServicio(),
                prestador.id(),
                prestador.codigoPublico(),
                InputSanitizer.sanitize(comando.nombreEs()),
                InputSanitizer.sanitize(comando.nombreEn()),
                InputSanitizer.sanitize(comando.slug()),
                InputSanitizer.sanitize(comando.categoria()),
                InputSanitizer.sanitize(comando.ubicacion()),
                InputSanitizer.sanitize(comando.coordenadasHud()),
                comando.altitudMsnm(),
                comando.precioCop(),
                comando.capacidadMaxima(),
                20,
                comando.esSostenible(),
                InputSanitizer.sanitize(comando.imagenUrl()),
                InputSanitizer.sanitize(comando.descripcionEs()),
                InputSanitizer.sanitize(comando.descripcionEn()),
                InputSanitizer.sanitize(comando.tagsAfinidad()),
                Instant.now()
        );

        ActividadTuristica guardada = repositoryPort.guardar(nueva);
        cachePort.invalidarCacheCatalogo();
        return guardada;
    }

    @Override
    @Transactional
    public ActividadTuristica actualizarPorId(
            UUID actividadId,
            ComandoActualizarActividad comando,
            ContextoSeguridadActor actor
    ) {
        String recursoAuditado = "oferta-service:/api/v1/actividades/" + actividadId;
        validarRolOperadorOAdmin(actor, recursoAuditado, "ACTUALIZAR_ACTIVIDAD");

        ActividadTuristica existente = obtenerPorId(actividadId);
        verificarPropiedadDelRecurso(existente, null, actor, recursoAuditado);

        return aplicarActualizacion(existente, comando);
    }

    @Override
    @Transactional
    public ActividadTuristica actualizarServicioDePrestador(
            String prestadorPathId,
            String servicioPathId,
            ComandoActualizarActividad comando,
            ContextoSeguridadActor actor
    ) {
        String recursoAuditado = "oferta-service:/api/v1/prestadores/" + prestadorPathId + "/servicios/" + servicioPathId;
        validarRolOperadorOAdmin(actor, recursoAuditado, "MODIFICAR_SERVICIO_TURISTICO");

        ActividadTuristica existente = resolverServicioPorIdentificadorFlexible(servicioPathId);
        verificarPropiedadDelRecurso(existente, prestadorPathId, actor, recursoAuditado);

        return aplicarActualizacion(existente, comando);
    }

    private ActividadTuristica aplicarActualizacion(ActividadTuristica existente, ComandoActualizarActividad comando) {
        ActividadTuristica actualizada = new ActividadTuristica(
                existente.id(),
                existente.codigoServicio(),
                existente.prestadorId(),
                existente.codigoPrestador(),
                comando.nombreEs() != null && !comando.nombreEs().isBlank() ? InputSanitizer.sanitize(comando.nombreEs()) : existente.nombreEs(),
                comando.nombreEn() != null && !comando.nombreEn().isBlank() ? InputSanitizer.sanitize(comando.nombreEn()) : existente.nombreEn(),
                existente.slug(),
                existente.categoria(),
                existente.ubicacion(),
                existente.coordenadasHud(),
                existente.altitudMsnm(),
                comando.precioCop() != null ? comando.precioCop() : existente.precioCop(),
                comando.capacidadMaxima() != null ? comando.capacidadMaxima() : existente.capacidadMaxima(),
                comando.nivelOcupacionActual() != null ? comando.nivelOcupacionActual() : existente.nivelOcupacionActual(),
                comando.esSostenible() != null ? comando.esSostenible() : existente.esSostenible(),
                existente.imagenUrl(),
                comando.descripcionEs() != null && !comando.descripcionEs().isBlank() ? InputSanitizer.sanitize(comando.descripcionEs()) : existente.descripcionEs(),
                comando.descripcionEn() != null && !comando.descripcionEn().isBlank() ? InputSanitizer.sanitize(comando.descripcionEn()) : existente.descripcionEn(),
                comando.tagsAfinidad() != null && !comando.tagsAfinidad().isBlank() ? InputSanitizer.sanitize(comando.tagsAfinidad()) : existente.tagsAfinidad(),
                Instant.now()
        );

        ActividadTuristica guardada = repositoryPort.guardar(actualizada);
        cachePort.invalidarCacheCatalogo();
        return guardada;
    }

    private void validarRolOperadorOAdmin(ContextoSeguridadActor actor, String recurso, String accion) {
        String rol = actor.rol() != null ? actor.rol().trim().toUpperCase() : "";
        boolean rolPermitido = "PRESTADOR".equals(rol)
                || "PEQUENO_OPERADOR".equals(rol)
                || "ADMIN".equals(rol);

        if (!rolPermitido) {
            String motivo = "Rol '" + (rol.isEmpty() ? "SIN_ROL" : rol) + "' no tiene permisos para gestionar servicios turísticos.";
            publicarEventoDenegado(actor, recurso, accion, motivo);
            throw new AccesoRecursoProhibidoException(motivo);
        }
    }

    private void verificarPropiedadDelRecurso(
            ActividadTuristica recurso,
            String prestadorPathId,
            ContextoSeguridadActor actor,
            String recursoAuditado
    ) {
        if ("ADMIN".equalsIgnoreCase(actor.rol())) {
            return;
        }

        String actorPrestadorHeader = actor.prestadorIdHeader() != null ? actor.prestadorIdHeader().trim() : "";

        boolean coincideConRecurso = coincideIdentificadorPrestador(actorPrestadorHeader, recurso.prestadorId(), recurso.codigoPrestador());
        boolean coincideConPath = (prestadorPathId == null || prestadorPathId.isBlank())
                || coincideIdentificadorPrestador(actorPrestadorHeader, recurso.prestadorId(), recurso.codigoPrestador())
                && coincidePathConRecurso(prestadorPathId, recurso.prestadorId(), recurso.codigoPrestador());

        if (!coincideConRecurso || !coincideConPath) {
            String motivo = String.format(
                    "Violación de propiedad (RF-03 / Secuencia 4.1): prestador autenticado (%s) != dueño del servicio %d (prestadorId=%s / codigo=%d).",
                    actorPrestadorHeader.isEmpty() ? "AUSENTE" : actorPrestadorHeader,
                    recurso.codigoServicio(),
                    recurso.prestadorId(),
                    recurso.codigoPrestador()
            );
            publicarEventoDenegado(actor, recursoAuditado, "MODIFICAR_OFERTA_AJENA", motivo);
            throw new AccesoRecursoProhibidoException(motivo);
        }
    }

    private boolean coincideIdentificadorPrestador(String headerValor, UUID recursoPrestadorUuid, long recursoCodigoPrestador) {
        if (headerValor == null || headerValor.isBlank()) {
            return false;
        }
        if (recursoPrestadorUuid.toString().equalsIgnoreCase(headerValor)) {
            return true;
        }
        if (String.valueOf(recursoCodigoPrestador).equals(headerValor)) {
            return true;
        }
        // También permitimos sufijo numérico del UUID semilla (ej. 00000000-0000-0000-0000-000000000077 <-> 77)
        try {
            long codigoParseado = Long.parseLong(headerValor);
            return codigoParseado == recursoCodigoPrestador;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private boolean coincidePathConRecurso(String pathPrestadorId, UUID recursoPrestadorUuid, long recursoCodigoPrestador) {
        return coincideIdentificadorPrestador(pathPrestadorId.trim(), recursoPrestadorUuid, recursoCodigoPrestador);
    }

    private ActividadTuristica resolverServicioPorIdentificadorFlexible(String servicioPathId) {
        String limpio = servicioPathId.trim();
        try {
            UUID uuid = UUID.fromString(limpio);
            return obtenerPorId(uuid);
        } catch (IllegalArgumentException ignored) {
            try {
                long codigoServicio = Long.parseLong(limpio);
                return obtenerPorCodigoServicio(codigoServicio);
            } catch (NumberFormatException ex) {
                throw new RecursoNoEncontradoException("Identificador de servicio inválido: " + servicioPathId);
            }
        }
    }

    private java.util.Optional<Prestador> resolverPrestadorDelActor(ContextoSeguridadActor actor) {
        String header = actor.prestadorIdHeader();
        if (header == null || header.isBlank()) {
            return repositoryPort.buscarPrestadorPorCodigoPublico(77L);
        }
        try {
            UUID uuid = UUID.fromString(header.trim());
            return repositoryPort.buscarPrestadorPorId(uuid);
        } catch (IllegalArgumentException ignored) {
            try {
                long codigo = Long.parseLong(header.trim());
                return repositoryPort.buscarPrestadorPorCodigoPublico(codigo);
            } catch (NumberFormatException e) {
                return java.util.Optional.empty();
            }
        }
    }

    private void publicarEventoDenegado(ContextoSeguridadActor actor, String recurso, String accion, String motivo) {
        UUID usuarioUuid = null;
        if (actor.usuarioId() != null && !actor.usuarioId().isBlank()) {
            try {
                usuarioUuid = UUID.fromString(actor.usuarioId().trim());
            } catch (IllegalArgumentException ignored) {
                usuarioUuid = UUID.nameUUIDFromBytes(actor.usuarioId().getBytes());
            }
        }

        EventoAccesoDenegado evento = new EventoAccesoDenegado(
                UUID.randomUUID(),
                usuarioUuid,
                actor.rol() != null ? actor.rol() : "SIN_ROL",
                recurso,
                accion,
                motivo,
                actor.ipOrigen() != null ? actor.ipOrigen() : "0.0.0.0",
                actor.traceId() != null ? actor.traceId() : UUID.randomUUID().toString(),
                Instant.now()
        );
        seguridadEventPublisherPort.publicarAccesoDenegado(evento);
    }

    private int contarCoincidenciasTags(String tagsActividad, Set<String> tagsBuscados) {
        if (tagsActividad == null || tagsBuscados.isEmpty()) {
            return 0;
        }
        int hits = 0;
        for (String tag : tagsActividad.toLowerCase().split(",")) {
            if (tagsBuscados.contains(tag.trim())) {
                hits++;
            }
        }
        return hits;
    }
}
