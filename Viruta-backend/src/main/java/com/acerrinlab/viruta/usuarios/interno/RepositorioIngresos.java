package com.acerrinlab.viruta.usuarios.interno;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface RepositorioIngresos extends JpaRepository<Ingreso, Long> {

    List<Ingreso> findTop10ByUsuarioIdOrderByInstanteDesc(Long usuarioId);

    List<Ingreso> findTop20ByOrderByInstanteDesc();

    boolean existsByUsuarioIdAndIpAndAgenteAndExitosoTrue(Long usuarioId, String ip, String agente);

    long countByExitosoFalse();
}
