package com.acerrinlab.viruta.compartido;

/** Error de negocio con el codigo HTTP que le corresponde. */
public class ErrorNegocio extends RuntimeException {
    private final int estado;

    public ErrorNegocio(int estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public int estado() {
        return estado;
    }

    public static ErrorNegocio invalido(String mensaje) {
        return new ErrorNegocio(400, mensaje);
    }

    public static ErrorNegocio noAutenticado(String mensaje) {
        return new ErrorNegocio(401, mensaje);
    }

    public static ErrorNegocio prohibido(String mensaje) {
        return new ErrorNegocio(403, mensaje);
    }

    public static ErrorNegocio noEncontrado(String mensaje) {
        return new ErrorNegocio(404, mensaje);
    }

    public static ErrorNegocio conflicto(String mensaje) {
        return new ErrorNegocio(409, mensaje);
    }
}
