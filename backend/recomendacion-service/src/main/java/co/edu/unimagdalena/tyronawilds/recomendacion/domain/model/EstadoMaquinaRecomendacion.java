package co.edu.unimagdalena.tyronawilds.recomendacion.domain.model;

/**
 * Estados oficiales de la Máquina de Estados Comprensiva (Punto 4.2 del Laboratorio 3).
 */
public enum EstadoMaquinaRecomendacion {
    Solicitada,
    CargandoPerfil,
    EnriqueciendoContexto,
    ContextoDegradado,
    Ranqueando,
    ModoBasico,
    GenerandoExplicacion,
    FINAL_EXITO,
    FINAL_ERROR
}
