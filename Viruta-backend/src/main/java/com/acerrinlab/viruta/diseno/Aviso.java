package com.acerrinlab.viruta.diseno;

/** Aviso de que el mueble no entra o de que las medidas del espacio no coinciden (RF-02). */
public record Aviso(String eje, int diferenciaMm, String mensaje) {
}
