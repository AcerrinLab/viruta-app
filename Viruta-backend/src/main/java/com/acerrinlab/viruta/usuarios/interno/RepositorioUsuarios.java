package com.acerrinlab.viruta.usuarios.interno;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioUsuarios extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    long countByActivoTrue();
}
