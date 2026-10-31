package co.edu.unimagdalena.tyronawilds.identidad.domain.port.in;

import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;

public interface AutenticarUsuarioUseCase {

    record ComandoLoginLocal(
            String email,
            String password,
            String ipOrigen,
            String traceId
    ) {
    }

    record ComandoLoginGoogle(
            String googleIdToken,
            String email,
            String nombre,
            String ipOrigen,
            String traceId
    ) {
    }

    ResultadoAutenticacion autenticarLocal(ComandoLoginLocal comando);

    ResultadoAutenticacion autenticarGoogle(ComandoLoginGoogle comando);
}
