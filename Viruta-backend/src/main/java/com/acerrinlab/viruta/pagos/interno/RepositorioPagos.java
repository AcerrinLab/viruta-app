package com.acerrinlab.viruta.pagos.interno;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioPagos extends JpaRepository<Pago, Long> {

    Optional<Pago> findByPedidoId(Long pedidoId);

    List<Pago> findByCarpinteriaId(Long carpinteriaId);
}
