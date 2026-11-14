package com.acerrinlab.viruta.usuarios;

/** Datos publicos de un usuario para los otros modulos. fotoUrl puede ser null. */
public record DatosUsuario(long id, String nombre, String email, Rol rol, String fotoUrl) {
}
