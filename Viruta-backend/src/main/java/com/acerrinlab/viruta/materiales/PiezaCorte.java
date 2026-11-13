package com.acerrinlab.viruta.materiales;

/** Una linea del despiece. Medidas en milimetros enteros (RNF-01). */
public record PiezaCorte(String nombre, int largo, int ancho, int espesor, int cantidad, RolPieza rol) {
}
