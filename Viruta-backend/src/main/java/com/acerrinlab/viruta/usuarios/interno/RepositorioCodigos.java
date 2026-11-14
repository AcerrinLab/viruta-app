package com.acerrinlab.viruta.usuarios.interno;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioCodigos extends JpaRepository<CodigoVerificacion, Long> {
}
