package com.acerrinlab.viruta.carpinterias;

import java.util.Set;

import com.acerrinlab.viruta.materiales.Material;

/** Datos completos de una carpinteria, para uso entre modulos. Incluye datos privados. */
public record DatosCarpinteria(long id, long usuarioId, String nombre, Zona zona, String whatsapp,
        String direccion, Set<Material> materiales) {
}
