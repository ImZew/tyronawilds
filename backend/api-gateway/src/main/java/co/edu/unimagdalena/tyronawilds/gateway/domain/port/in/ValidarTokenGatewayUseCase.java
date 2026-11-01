package co.edu.unimagdalena.tyronawilds.gateway.domain.port.in;

import co.edu.unimagdalena.tyronawilds.gateway.domain.model.TokenClaims;

public interface ValidarTokenGatewayUseCase {

    boolean esRutaPublica(String metodoHttp, String path);

    TokenClaims validarYExtraerClaims(String authorizationHeader);
}
