package co.edu.unimagdalena.tyronawilds.oferta.infrastructure.adapter.in.web;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CrearActividadRequestDto(
        @Positive(message = "El código de servicio debe ser positivo")
        long codigoServicio,

        @NotBlank(message = "El nombre en español es obligatorio")
        String nombreEs,

        @NotBlank(message = "El nombre en inglés es obligatorio")
        String nombreEn,

        @NotBlank(message = "El slug es obligatorio")
        String slug,

        @NotBlank(message = "La categoría es obligatoria")
        String categoria,

        @NotBlank(message = "La ubicación es obligatoria")
        String ubicacion,

        @NotBlank(message = "Las coordenadas HUD son obligatorias")
        String coordenadasHud,

        @Min(value = 0, message = "La altitud no puede ser negativa")
        int altitudMsnm,

        @NotNull(message = "El precio en COP es obligatorio")
        @Positive(message = "El precio debe ser mayor a cero")
        BigDecimal precioCop,

        @Min(value = 1, message = "La capacidad máxima debe ser al menos 1")
        int capacidadMaxima,

        boolean esSostenible,

        @NotBlank(message = "La URL de imagen es obligatoria")
        String imagenUrl,

        @NotBlank(message = "La descripción en español es obligatoria")
        String descripcionEs,

        @NotBlank(message = "La descripción en inglés es obligatoria")
        String descripcionEn,

        @NotBlank(message = "Los tags de afinidad son obligatorios")
        String tagsAfinidad
) {
}
