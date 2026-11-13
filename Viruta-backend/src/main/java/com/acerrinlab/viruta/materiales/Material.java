package com.acerrinlab.viruta.materiales;

/** Materiales del MVP (RF-03). El espesor esta en milimetros. */
public enum Material {
    PINO(18),
    MELAMINA(18),
    AGLOMERADO(18);

    private final int espesor;

    Material(int espesor) {
        this.espesor = espesor;
    }

    public int espesor() {
        return espesor;
    }
}
