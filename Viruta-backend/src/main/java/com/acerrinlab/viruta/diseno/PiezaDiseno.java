package com.acerrinlab.viruta.diseno;

import com.acerrinlab.viruta.materiales.RolPieza;

/**
 * Pieza del mueble con sus medidas de corte y su posicion en el modelo.
 * Origen en la esquina frontal izquierda inferior: X hacia la derecha, Y hacia el fondo, Z hacia arriba.
 * (x, y, z) es la esquina de la pieza y (dx, dy, dz) su tamano en cada eje. Todo en milimetros.
 */
public record PiezaDiseno(String nombre, RolPieza rol, int largo, int ancho, int espesor,
        int x, int y, int z, int dx, int dy, int dz) {
}
