package com.acerrinlab.viruta.diseno.interno;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioProyectos extends JpaRepository<Proyecto, Long> {

    List<Proyecto> findByClienteIdOrderByActualizadoDesc(Long clienteId);

    Optional<Proyecto> findByIdAndClienteId(Long id, Long clienteId);
}
