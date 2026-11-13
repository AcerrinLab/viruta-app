package com.acerrinlab.viruta.pedidos;

/** Interfaz publica del modulo pedidos. */
public interface PedidosApi {

    /** Datos de cobro de un pedido; falla si no existe. */
    DatosCobro datosDeCobro(long pedidoId);

    /** Igual que datosDeCobro, pero verifica que el pedido sea del cliente indicado. */
    DatosCobro datosDeCobroDe(long pedidoId, long clienteId);

    /** Pasa el pedido a Aceptado. Solo lo llama el modulo pagos cuando la pasarela confirma el pago. */
    void confirmarSena(long pedidoId);

    long contar();
}
