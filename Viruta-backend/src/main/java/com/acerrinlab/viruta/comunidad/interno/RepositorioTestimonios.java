package com.acerrinlab.viruta.comunidad.interno;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioTestimonios extends JpaRepository<Testimonio, Long> {

    List<Testimonio> findByAprobadoTrueOrderByCreadoDesc();

    List<Testimonio> findAllByOrderByAprobadoAscCreadoDesc();

    Optional<Testimonio> findFirstByUsuarioIdOrderByCreadoDesc(Long usuarioId);
}
