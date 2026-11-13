package com.acerrinlab.viruta.pagos.interno;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Sena confirmada por la pasarela, con la comision de Viruta. Montos en pesos enteros. */
@Entity
@Table(name = "pagos")
class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    /** Unico: un pedido tiene una sola sena, aunque el aviso de pago llegue repetido. */
    @Column(unique = true, nullable = false)
    Long pedidoId;
    Long carpinteriaId;
    long monto;
    long comision;
    String referencia;
    Instant creado;
}
