package com.acerrinlab.viruta.pedidos.interno;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.acerrinlab.viruta.pedidos.EstadoPedido;

interface RepositorioPedidos extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByClienteIdAndClaveEnvio(Long clienteId, String claveEnvio);

    List<Pedido> findByClienteIdOrderByCreadoDesc(Long clienteId);

    /** Bandeja de la carpinteria: primero los no leidos, despues los mas nuevos (RF-27). */
    List<Pedido> findByCarpinteriaIdOrderByLeidoAscCreadoDesc(Long carpinteriaId);

    List<Pedido> findByEstadoAndCreadoBefore(EstadoPedido estado, Instant limite);

    List<Pedido> findByEstadoAndPresupuestadoEnBefore(EstadoPedido estado, Instant limite);
}
