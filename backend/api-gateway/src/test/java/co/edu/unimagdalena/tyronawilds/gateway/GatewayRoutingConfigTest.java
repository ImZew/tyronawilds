package co.edu.unimagdalena.tyronawilds.gateway;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayRoutingConfigTest {

    @Autowired
    private RouteDefinitionLocator routeDefinitionLocator;

    @Test
    @DisplayName("Debe cargar las 7 rutas de microservicios configuradas en Spring Cloud Gateway")
    void debeCargarLasSieteRutasDelLaboratorio3() {
        Flux<RouteDefinition> routes = routeDefinitionLocator.getRouteDefinitions();

        StepVerifier.create(routes.map(RouteDefinition::getId).collectList())
                .assertNext(routeIds -> assertThat(routeIds).containsAll(List.of(
                        "identidad-service",
                        "oferta-service",
                        "reservas-service",
                        "recomendacion-service",
                        "integracion-service",
                        "indicadores-service",
                        "auditoria-service"
                )))
                .verifyComplete();
    }
}
