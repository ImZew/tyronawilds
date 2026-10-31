package co.edu.unimagdalena.tyronawilds.identidad.domain.port.in;

import co.edu.unimagdalena.tyronawilds.contratos.seguridad.RolUsuario;
import co.edu.unimagdalena.tyronawilds.identidad.domain.model.ResultadoAutenticacion;

import java.util.UUID;

public interface RegistrarUsuarioUseCase {

    record ComandoRegistro(
            String nombre,
            String email,
            String password,
            RolUsuario rol,
            UUID prestadorId,
            boolean aceptaTratamientoDatos,
            String ipOrigen,
            String traceId
    ) {
    }

    ResultadoAutenticacion registrar(ComandoRegistro comando);
}
