package co.edu.unimagdalena.tyronawilds.identidad.domain.port.in;

import java.util.List;

public interface ConsultarProveedoresAuthUseCase {

    List<String> obtenerProveedoresActivos();

    boolean estaHabilitado(String codigoProveedor);
}
