package com.acerrinlab.viruta.usuarios;

/** Usuario autenticado de la peticion actual. */
public record Sesion(long id, Rol rol) {
}
