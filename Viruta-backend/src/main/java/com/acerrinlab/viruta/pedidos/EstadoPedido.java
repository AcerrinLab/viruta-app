package com.acerrinlab.viruta.pedidos;

/**
 * Maquina de estados del pedido (patron State, RNF-07). Cada estado sabe a cuales puede pasar.
 *
 * Pendiente -> Presupuestado -> Aceptado -> Medidas verificadas -> En fabricacion -> Entregado
 * Pendiente o Presupuestado -> Vencido; Presupuestado -> Rechazado; antes de Entregado -> Cancelado.
 */
public enum EstadoPedido {
    PENDIENTE, PRESUPUESTADO, ACEPTADO, MEDIDAS_VERIFICADAS, EN_FABRICACION, ENTREGADO, RECHAZADO, VENCIDO, CANCELADO;

    public boolean puedePasarA(EstadoPedido nuevo) {
        return switch (this) {
            case PENDIENTE -> nuevo == PRESUPUESTADO || nuevo == VENCIDO || nuevo == CANCELADO;
            case PRESUPUESTADO -> nuevo == ACEPTADO || nuevo == RECHAZADO || nuevo == VENCIDO || nuevo == CANCELADO;
            case ACEPTADO -> nuevo == MEDIDAS_VERIFICADAS || nuevo == CANCELADO;
            case MEDIDAS_VERIFICADAS -> nuevo == EN_FABRICACION || nuevo == CANCELADO;
            case EN_FABRICACION -> nuevo == ENTREGADO || nuevo == CANCELADO;
            case ENTREGADO, RECHAZADO, VENCIDO, CANCELADO -> false;
        };
    }

    /** Estados que marca la carpinteria despues de cobrada la sena (RF-19). */
    public boolean esDeFabricacion() {
        return this == MEDIDAS_VERIFICADAS || this == EN_FABRICACION || this == ENTREGADO;
    }

    /** Desde Aceptado en adelante el cliente ya puede ver la direccion del taller (RNF-09). */
    public boolean senaPagada() {
        return this == ACEPTADO || esDeFabricacion();
    }
}
