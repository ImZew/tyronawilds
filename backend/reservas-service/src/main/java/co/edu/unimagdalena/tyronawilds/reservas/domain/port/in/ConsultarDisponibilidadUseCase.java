package co.edu.unimagdalena.tyronawilds.reservas.domain.port.in;

import co.edu.unimagdalena.tyronawilds.reservas.domain.model.Disponibilidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface ConsultarDisponibilidadUseCase {

    record ComandoCrearDisponibilidad(
            UUID actividadId,
            String nombreActividad,
            LocalDate fecha,
            LocalTime horaInicio,
            int capacidadTotal,
            int cuposDisponibles,
            BigDecimal precioUnitarioCop
    ) {
    }

    List<Disponibilidad> listarDisponibilidades(UUID actividadId, LocalDate fecha);

    Disponibilidad crearOActualizarDisponibilidad(ComandoCrearDisponibilidad comando);
}
