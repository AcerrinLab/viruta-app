package com.acerrinlab.viruta.traccion.interno;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioInscriptos extends JpaRepository<Inscripto, Long> {

    boolean existsByEmailAndTipo(String email, String tipo);

    long countByTipo(String tipo);
}
