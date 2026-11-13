package com.acerrinlab.viruta.compartido.eventos;

/** Evento de dominio: la pasarela confirmo el pago de la sena (RF-18). */
public record SenaPagada(long pedidoId, long carpinteriaId) {
}
