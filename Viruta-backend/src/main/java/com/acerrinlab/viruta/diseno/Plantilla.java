package com.acerrinlab.viruta.diseno;

/** Plantillas parametricas del MVP con el rango permitido de cada medida, en milimetros (RF-01). */
public enum Plantilla {
    ESTANTE("Estante", 300, 2400, 300, 2400, 150, 600, 0, 6),
    MESA("Mesa", 600, 2400, 400, 1100, 400, 1000, 0, 0),
    BAJO_MESADA("Bajo mesada", 400, 2400, 600, 950, 400, 650, 0, 3);

    public final String etiqueta;
    public final int anchoMin;
    public final int anchoMax;
    public final int altoMin;
    public final int altoMax;
    public final int profundidadMin;
    public final int profundidadMax;
    public final int estantesMin;
    public final int estantesMax;

    Plantilla(String etiqueta, int anchoMin, int anchoMax, int altoMin, int altoMax,
            int profundidadMin, int profundidadMax, int estantesMin, int estantesMax) {
        this.etiqueta = etiqueta;
        this.anchoMin = anchoMin;
        this.anchoMax = anchoMax;
        this.altoMin = altoMin;
        this.altoMax = altoMax;
        this.profundidadMin = profundidadMin;
        this.profundidadMax = profundidadMax;
        this.estantesMin = estantesMin;
        this.estantesMax = estantesMax;
    }
}
