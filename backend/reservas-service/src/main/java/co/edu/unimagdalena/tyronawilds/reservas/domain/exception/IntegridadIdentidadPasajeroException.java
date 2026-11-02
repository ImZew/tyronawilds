package co.edu.unimagdalena.tyronawilds.reservas.domain.exception;

public class IntegridadIdentidadPasajeroException extends RuntimeException {

    private final int httpStatus;
    private final String codigoError;

    public IntegridadIdentidadPasajeroException(int httpStatus, String codigoError, String message) {
        super(message);
        this.httpStatus = httpStatus;
        this.codigoError = codigoError;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public String getCodigoError() {
        return codigoError;
    }
}
