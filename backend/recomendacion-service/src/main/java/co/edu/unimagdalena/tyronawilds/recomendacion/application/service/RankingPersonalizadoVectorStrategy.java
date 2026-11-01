package co.edu.unimagdalena.tyronawilds.recomendacion.application.service;

import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.CandidatoOferta;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.ContextoTerritorialResumen;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.model.PerfilTurista;
import co.edu.unimagdalena.tyronawilds.recomendacion.domain.port.out.EstrategiaRankingPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Variante PERSONALIZADO (Ficha 5.2 NIVEL_RECOMENDACION_IA):
 * Calcula similitud semántica / embeddings y penaliza destinos con ocupación > 80%
 * promoviendo alternativas sostenibles para desconcentrar el Parque Tayrona (RF-10, RF-12).
 */
@Component
@Primary
@ConditionalOnProperty(name = "app.recomendacion.nivel", havingValue = "PERSONALIZADO", matchIfMissing = true)
public class RankingPersonalizadoVectorStrategy implements EstrategiaRankingPort {

    @Override
    public String nivelVariabilidad() {
        return "PERSONALIZADO";
    }

    @Override
    public List<CandidatoPuntuado> ranquear(
            List<CandidatoOferta> candidatos,
            PerfilTurista perfil,
            ContextoTerritorialResumen contexto
    ) {
        Set<String> interesesSet = (perfil.intereses() == null)
                ? Set.of()
                : Arrays.stream(perfil.intereses().toLowerCase().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toSet());

        return candidatos.stream()
                .map(c -> new CandidatoPuntuado(c, calcularPuntajeVectorialYSostenibilidad(c, interesesSet, perfil, contexto)))
                .sorted(Comparator.comparingDouble(CandidatoPuntuado::puntajeAfinidad).reversed())
                .toList();
    }

    private double calcularPuntajeVectorialYSostenibilidad(
            CandidatoOferta c,
            Set<String> intereses,
            PerfilTurista perfil,
            ContextoTerritorialResumen contexto
    ) {
        double score = 55.0;

        if (c.tagsAfinidad() != null && !intereses.isEmpty()) {
            String[] tags = c.tagsAfinidad().toLowerCase().split(",");
            int coincidencias = 0;
            for (String tag : tags) {
                if (intereses.contains(tag.trim())) {
                    coincidencias++;
                }
            }
            score += Math.min(30.0, coincidencias * 9.5);
        }

        if (perfil.prefiereSostenible() && c.esSostenible()) {
            score += 12.0;
        }

        // Penalización por saturación de capacidad de carga (> 80% ocupación - RF-10)
        if (c.nivelOcupacionActual() >= 80) {
            score -= 22.0;
        } else if (c.nivelOcupacionActual() <= 45) {
            score += 14.0;
        }

        if (contexto != null && contexto.ocupacionTayronaPorcentaje() >= 80
                && c.ubicacion().toLowerCase().contains("minca")) {
            score += 10.0;
        }

        double normalizado = Math.max(10.0, Math.min(99.5, score));
        return Math.round(normalizado * 10.0) / 10.0;
    }
}
