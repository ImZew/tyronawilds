package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ItemRecomendado;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.PerfilTurista;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.EstrategiaRankingPort;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Submódulo ExplicadorRecomendacion del Diagrama de Componentes UML 1.2:
 * Garantiza transparencia algorítmica explicando por qué se sugiere cada actividad
 * según preferencias, clima, porcentaje de ocupación y sostenibilidad (Restricción Ética ERS).
 */
@Component
public class ExplicadorRecomendacion {

    public List<ItemRecomendado> construirItemsConExplicacion(
            List<EstrategiaRankingPort.CandidatoPuntuado> puntuados,
            PerfilTurista perfil,
            ContextoTerritorialResumen contexto,
            String nivelIaAplicado
    ) {
        return puntuados.stream()
                .map(cp -> {
                    CandidatoOferta c = cp.candidato();
                    String explicacionEs = generarTextoExplicativoEs(c, cp.puntajeAfinidad(), contexto, nivelIaAplicado);
                    String explicacionEn = generarTextoExplicativoEn(c, cp.puntajeAfinidad(), contexto, nivelIaAplicado);
                    return new ItemRecomendado(
                            c.id(),
                            c.codigoServicio(),
                            c.nombreEs(),
                            c.nombreEn(),
                            c.slug(),
                            c.categoria(),
                            c.ubicacion(),
                            c.coordenadasHud(),
                            c.altitudMsnm(),
                            c.precioCop(),
                            c.nivelOcupacionActual(),
                            c.esSostenible(),
                            c.imagenUrl(),
                            cp.puntajeAfinidad(),
                            explicacionEs,
                            explicacionEn
                    );
                })
                .toList();
    }

    private String generarTextoExplicativoEs(
            CandidatoOferta c,
            double score,
            ContextoTerritorialResumen ctx,
            String nivelIa
    ) {
        String notaAforo = c.nivelOcupacionActual() >= 80
                ? String.format("Ocupación crítica (%d%%); se penalizó en el ranking frente a rutas de desconcentración.", c.nivelOcupacionActual())
                : String.format("Ocupación saludable (%d%%), favoreciendo la conservación del ecosistema (RF-10).", c.nivelOcupacionActual());

        String notaContexto = ctx.degradado()
                ? String.format("Clima estimado %.1f°C (servido desde caché resiliente ER-01).", ctx.temperaturaCelsius())
                : String.format("Clima actual %.1f°C (%s).", ctx.temperaturaCelsius(), ctx.condicionClimatica());

        return String.format(
                "[%s | Afinidad %.1f%%] Sugerido en %s (%d msnm). %s %s",
                nivelIa,
                score,
                c.ubicacion(),
                c.altitudMsnm(),
                notaAforo,
                notaContexto
        );
    }

    private String generarTextoExplicativoEn(
            CandidatoOferta c,
            double score,
            ContextoTerritorialResumen ctx,
            String nivelIa
    ) {
        String occupancyNote = c.nivelOcupacionActual() >= 80
                ? String.format("High occupancy (%d%%); deprioritized in favor of low-impact trails.", c.nivelOcupacionActual())
                : String.format("Optimal carrying capacity (%d%% occupancy), supporting ecosystem balance (RF-10).", c.nivelOcupacionActual());

        String weatherNote = ctx.degradado()
                ? String.format("Estimated %.1f°C (served from resilient Redis cache ER-01).", ctx.temperaturaCelsius())
                : String.format("Live weather %.1f°C (%s).", ctx.temperaturaCelsius(), ctx.condicionClimatica());

        return String.format(
                "[%s | Match %.1f%%] Recommended at %s (%d masl). %s %s",
                nivelIa,
                score,
                c.ubicacion(),
                c.altitudMsnm(),
                occupancyNote,
                weatherNote
        );
    }
}
