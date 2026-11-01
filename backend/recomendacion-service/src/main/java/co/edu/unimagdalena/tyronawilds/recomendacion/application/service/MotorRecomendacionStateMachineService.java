package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.exception.RecomendacionFallidaException;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.EstadoMaquinaRecomendacion;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ItemRecomendado;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.PerfilTurista;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ResultadoRecomendacion;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.in.GenerarRecomendacionUseCase;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.CatalogoOfertaClientPort;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.EstrategiaRankingPort;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.PerfilRecomendacionRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Orquestador de la Máquina de Estados Comprensiva de Recomendación (Punto 4.2 del Laboratorio 3):
 * Solicitada -> CargandoPerfil -> EnriqueciendoContexto (-> ContextoDegradado)
 * -> Ranqueando / ModoBasico -> GenerandoExplicacion -> FINAL_EXITO / FINAL_ERROR.
 */
@Service
public class MotorRecomendacionStateMachineService implements GenerarRecomendacionUseCase {

    private final PerfilPreferencias perfilPreferencias;
    private final ContextoExterno contextoExterno;
    private final CatalogoOfertaClientPort catalogoOfertaClientPort;
    private final ExplicadorRecomendacion explicadorRecomendacion;
    private final PerfilRecomendacionRepositoryPort repositoryPort;
    private final EstrategiaRankingPort estrategiaInyectada;
    private final RankingPersonalizadoVectorStrategy rankingPersonalizadoFallback;
    private final RankingBasicoPopularidadStrategy rankingBasicoFallback;
    private final AtomicReference<String> nivelIaEnCaliente;

    public MotorRecomendacionStateMachineService(
            PerfilPreferencias perfilPreferencias,
            ContextoExterno contextoExterno,
            CatalogoOfertaClientPort catalogoOfertaClientPort,
            ExplicadorRecomendacion explicadorRecomendacion,
            PerfilRecomendacionRepositoryPort repositoryPort,
            EstrategiaRankingPort estrategiaInyectada,
            @Value("${app.recomendacion.nivel:PERSONALIZADO}") String nivelConfigurado
    ) {
        this.perfilPreferencias = perfilPreferencias;
        this.contextoExterno = contextoExterno;
        this.catalogoOfertaClientPort = catalogoOfertaClientPort;
        this.explicadorRecomendacion = explicadorRecomendacion;
        this.repositoryPort = repositoryPort;
        this.estrategiaInyectada = estrategiaInyectada;
        this.rankingPersonalizadoFallback = new RankingPersonalizadoVectorStrategy();
        this.rankingBasicoFallback = new RankingBasicoPopularidadStrategy();
        this.nivelIaEnCaliente = new AtomicReference<>(
                nivelConfigurado != null ? nivelConfigurado.trim().toUpperCase() : estrategiaInyectada.nivelVariabilidad()
        );
    }

    @Override
    @Transactional
    public ResultadoRecomendacion generarRecomendacion(ComandoGenerarRecomendacion comando) {
        List<String> trazaEstados = new ArrayList<>();
        String correlacionId = (comando.correlacionId() != null && !comando.correlacionId().isBlank())
                ? comando.correlacionId()
                : UUID.randomUUID().toString();

        // 1. Estado inicial: Solicitada
        trazaEstados.add(EstadoMaquinaRecomendacion.Solicitada.name());

        try {
            // 2. Estado: CargandoPerfil
            trazaEstados.add(EstadoMaquinaRecomendacion.CargandoPerfil.name());
            PerfilTurista perfil = perfilPreferencias.cargarOCrearPerfil(
                    comando.usuarioId(),
                    comando.interesesAdicionales(),
                    comando.priorizarSostenible(),
                    comando.presupuestoMaximoCop()
            );

            // 3. Estado: EnriqueciendoContexto (invocación a integracion-service)
            trazaEstados.add(EstadoMaquinaRecomendacion.EnriqueciendoContexto.name());
            ContextoTerritorialResumen contexto = contextoExterno.enriquecerContexto(comando.forzarContextoDegradado());

            if (contexto.degradado()) {
                // Transición por fallo / timeout externo hacia ContextoDegradado (ER-01)
                trazaEstados.add(EstadoMaquinaRecomendacion.ContextoDegradado.name());
            }

            // 4. Consulta de candidatos a oferta-service y selección de estrategia según NIVEL_RECOMENDACION_IA (Ficha 5.2)
            List<CandidatoOferta> candidatos = catalogoOfertaClientPort.consultarCandidatosCatalogo(perfil.intereses());
            if (candidatos == null || candidatos.isEmpty()) {
                trazaEstados.add(EstadoMaquinaRecomendacion.FINAL_ERROR.name());
                throw new RecomendacionFallidaException("El catálogo de ofertas no devolvió actividades disponibles.");
            }

            EstrategiaRankingPort estrategiaActiva = resolverEstrategiaActiva();
            String nivelIaAplicado = estrategiaActiva.nivelVariabilidad();

            if ("BASICO".equalsIgnoreCase(nivelIaAplicado)) {
                trazaEstados.add(EstadoMaquinaRecomendacion.ModoBasico.name());
            } else {
                trazaEstados.add(EstadoMaquinaRecomendacion.Ranqueando.name());
            }

            List<EstrategiaRankingPort.CandidatoPuntuado> puntuados =
                    estrategiaActiva.ranquear(candidatos, perfil, contexto);

            // 5. Estado: GenerandoExplicacion
            trazaEstados.add(EstadoMaquinaRecomendacion.GenerandoExplicacion.name());
            List<ItemRecomendado> itemsExplicados = explicadorRecomendacion.construirItemsConExplicacion(
                    puntuados,
                    perfil,
                    contexto,
                    nivelIaAplicado
            );

            // 6. Estado final exitoso: FINAL_EXITO
            trazaEstados.add(EstadoMaquinaRecomendacion.FINAL_EXITO.name());

            ResultadoRecomendacion resultado = new ResultadoRecomendacion(
                    UUID.randomUUID(),
                    correlacionId,
                    perfil.usuarioId(),
                    nivelIaAplicado,
                    EstadoMaquinaRecomendacion.FINAL_EXITO.name(),
                    contexto.degradado(),
                    List.copyOf(trazaEstados),
                    contexto,
                    itemsExplicados,
                    Instant.now()
            );

            repositoryPort.guardarHistorialRecomendacion(resultado);
            return resultado;
        } catch (RecomendacionFallidaException ex) {
            throw ex;
        } catch (Exception ex) {
            trazaEstados.add(EstadoMaquinaRecomendacion.FINAL_ERROR.name());
            throw new RecomendacionFallidaException("Error en máquina de estados de recomendación: " + ex.getMessage());
        }
    }

    @Override
    public String obtenerNivelIaActivo() {
        return nivelIaEnCaliente.get();
    }

    @Override
    public String cambiarNivelIaEnCaliente(String nuevoNivel) {
        if (nuevoNivel == null || nuevoNivel.isBlank()) {
            return nivelIaEnCaliente.get();
        }
        String normalizado = nuevoNivel.trim().toUpperCase();
        if (!"BASICO".equals(normalizado) && !"PERSONALIZADO".equals(normalizado)) {
            throw new IllegalArgumentException("El nivel de recomendación IA debe ser 'BASICO' o 'PERSONALIZADO'.");
        }
        nivelIaEnCaliente.set(normalizado);
        return normalizado;
    }

    private EstrategiaRankingPort resolverEstrategiaActiva() {
        String nivel = nivelIaEnCaliente.get();
        if (estrategiaInyectada.nivelVariabilidad().equalsIgnoreCase(nivel)) {
            return estrategiaInyectada;
        }
        return "BASICO".equalsIgnoreCase(nivel) ? rankingBasicoFallback : rankingPersonalizadoFallback;
    }
}
