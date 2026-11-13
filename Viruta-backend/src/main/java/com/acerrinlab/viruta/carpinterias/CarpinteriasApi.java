package com.acerrinlab.viruta.carpinterias;

import java.util.Optional;

/** Interfaz publica del modulo carpinterias. */
public interface CarpinteriasApi {

    Optional<DatosCarpinteria> porId(long id);

    Optional<DatosCarpinteria> porUsuario(long usuarioId);
}
