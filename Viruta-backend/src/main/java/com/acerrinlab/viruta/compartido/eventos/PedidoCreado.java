package com.acerrinlab.viruta.compartido.eventos;

/** Evento de dominio: un cliente pidio presupuesto (RF-15). */
public record PedidoCreado(long pedidoId, long carpinteriaId) {
}
