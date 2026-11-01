package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.PerfilTurista;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.EstrategiaRankingPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * Variante BASICO (Ficha 5.2 NIVEL_RECOMENDACION_IA):
 * Ordena por popularidad general y sostenibilidad sin utilizar historial ni embeddings.
 */
@Component
@ConditionalOnProperty(name = "app.recomendacion.nivel", havingValue = "BASICO")
public class RankingBasicoPopularidadStrategy implements EstrategiaRankingPort {

    @Override
    public String nivelVariabilidad() {
        return "BASICO";
    }

    @Override
    public List<CandidatoPuntuado> ranquear(
            List<CandidatoOferta> candidatos,
            PerfilTurista perfil,
            ContextoTerritorialResumen contexto
    ) {
        return candidatos.stream()
                .map(c -> {
                    double scoreBase = (c.esSostenible() ? 75.0 : 60.0) + (100 - c.nivelOcupacionActual()) * 0.15;
                    return new CandidatoPuntuado(c, Math.round(scoreBase * 10.0) / 10.0);
                })
                .sorted(Comparator.comparingDouble(CandidatoPuntuado::puntajeAfinidad).reversed())
                .toList();
    }
}
