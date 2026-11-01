package co.edu.unimagdalena.tyronawilds.reservas.domain.exception;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;

import java.util.List;

/**
 * Excepción de dominio para el escenario ER-02:
 * Conflicto de concurrencia / agotamiento de cupos que transporta la lista de
 * horarios alternativos disponibles para presentar al turista sin sobreasignación.
 */
public class ConflictoConcurrenciaCupoException extends RuntimeException {

    private final List<Disponibilidad> horariosAlternativos;

    public ConflictoConcurrenciaCupoException(String mensaje, List<Disponibilidad> horariosAlternativos) {
        super(mensaje);
        this.horariosAlternativos = horariosAlternativos != null ? horariosAlternativos : List.of();
    }

    public List<Disponibilidad> getHorariosAlternativos() {
        return horariosAlternativos;
    }
}
