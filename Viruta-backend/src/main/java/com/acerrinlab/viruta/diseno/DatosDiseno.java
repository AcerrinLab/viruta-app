package com.acerrinlab.viruta.diseno;

import com.acerrinlab.viruta.materiales.Material;

/**
 * El proyecto: unica fuente de datos del mueble. Medidas en milimetros enteros.
 * Las medidas del espacio son opcionales (null si el cliente todavia no las cargo).
 */
public record DatosDiseno(
        String nombre,
        Plantilla plantilla,
        int ancho,
        int alto,
        int profundidad,
        int estantes,
        Material material,
        ColorMueble color,
        Integer espacioAncho,
        Integer espacioAlto,
        Integer espacioProfAdelante,
        Integer espacioProfAtras) {

    public boolean tieneEspacio() {
        return espacioAncho != null && espacioAlto != null && espacioProfAdelante != null && espacioProfAtras != null;
    }
}
