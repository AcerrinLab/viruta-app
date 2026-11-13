package com.acerrinlab.viruta.usuarios;

import java.util.Optional;

/** Interfaz publica del modulo usuarios. */
public interface UsuariosApi {

    Optional<DatosUsuario> buscar(long id);

    long contar();
}
