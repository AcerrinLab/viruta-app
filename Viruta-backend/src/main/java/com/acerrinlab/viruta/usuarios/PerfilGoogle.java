package com.acerrinlab.viruta.usuarios;

/** Datos de la cuenta de Google ya verificados (firma, emisor, audiencia y vencimiento). */
public record PerfilGoogle(String id, String email, boolean emailVerificado, String nombre, String foto) {
}
