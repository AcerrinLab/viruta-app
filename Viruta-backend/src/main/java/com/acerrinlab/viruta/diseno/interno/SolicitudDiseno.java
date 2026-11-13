package com.acerrinlab.viruta.diseno.interno;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.ColorMueble;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.materiales.Material;

/** Cuerpo de las peticiones de diseno. Los campos llegan como objetos para poder validar los que faltan. */
record SolicitudDiseno(
        String nombre,
        Plantilla plantilla,
        Integer ancho,
        Integer alto,
        Integer profundidad,
        Integer estantes,
        Material material,
        ColorMueble color,
        Integer espacioAncho,
        Integer espacioAlto,
        Integer espacioProfAdelante,
        Integer espacioProfAtras) {

    DatosDiseno aDatos() {
        if (plantilla == null || ancho == null || alto == null || profundidad == null || material == null) {
            throw ErrorNegocio.invalido("Faltan datos del mueble: plantilla, medidas o material.");
        }
        String titulo = (nombre == null || nombre.isBlank()) ? plantilla.etiqueta : nombre.trim();
        if (titulo.length() > 80) {
            titulo = titulo.substring(0, 80);
        }
        return new DatosDiseno(titulo, plantilla, ancho, alto, profundidad,
                estantes == null ? 0 : estantes, material, color == null ? ColorMueble.NATURAL : color,
                espacioAncho, espacioAlto, espacioProfAdelante, espacioProfAtras);
    }
}
