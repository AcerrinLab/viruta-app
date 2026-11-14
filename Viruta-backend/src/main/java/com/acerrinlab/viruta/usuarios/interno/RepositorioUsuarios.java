package com.acerrinlab.viruta.usuarios.interno;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioUsuarios extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    long countByActivoTrue();

    Optional<Usuario> findByGoogleId(String googleId);

    long countByActivoTrueAndRol(com.acerrinlab.viruta.usuarios.Rol rol);

    long countByActivoTrueAndTelefonoVerificadoTrue();

    long countByActivoTrueAndGoogleIdIsNotNull();

    java.util.List<Usuario> findTop10ByActivoTrueOrderByCreadoDesc();

    java.util.List<Usuario> findByActivoTrueAndCreadoAfter(java.time.Instant desde);
}
