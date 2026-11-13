package com.acerrinlab.viruta.carpinterias.interno;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioCarpinterias extends JpaRepository<Carpinteria, Long> {

    Optional<Carpinteria> findByUsuarioId(Long usuarioId);
}
