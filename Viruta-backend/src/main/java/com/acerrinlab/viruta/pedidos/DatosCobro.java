package com.acerrinlab.viruta.pedidos;

/** Lo que el modulo pagos necesita para cobrar la sena de un pedido. Montos en pesos enteros. */
public record DatosCobro(long pedidoId, long carpinteriaId, String titulo, long total, long sena, EstadoPedido estado) {
}
