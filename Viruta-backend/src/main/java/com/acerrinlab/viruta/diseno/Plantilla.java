package com.acerrinlab.viruta.diseno;

/** Plantillas parametricas del MVP con el rango permitido de cada medida, en milimetros (RF-01). */
public enum Plantilla {
    ESTANTE("Estante", 300, 2400, 300, 2400, 150, 600, 0, 6, "CLASICOS"),
    MESA("Mesa", 600, 2400, 400, 1100, 400, 1000, 0, 0, "CLASICOS"),
    BAJO_MESADA("Bajo mesada", 400, 2400, 600, 950, 400, 650, 0, 3, "CLASICOS"),
    /** Vitrina alta con puertas y estantes de vidrio. Primera pieza de la seccion Antiguos. */
    RELICARIO("El relicario", 450, 1000, 1200, 2000, 300, 500, 1, 5, "ANTIGUOS");

    public final String etiqueta;
    public final int anchoMin;
    public final int anchoMax;
    public final int altoMin;
    public final int altoMax;
    public final int profundidadMin;
    public final int profundidadMax;
    public final int estantesMin;
    public final int estantesMax;
    /** Seccion del catalogo: CLASICOS o ANTIGUOS (las piezas antiguas luego forman colecciones). */
    public final String coleccion;

    Plantilla(String etiqueta, int anchoMin, int anchoMax, int altoMin, int altoMax,
            int profundidadMin, int profundidadMax, int estantesMin, int estantesMax, String coleccion) {
        this.etiqueta = etiqueta;
        this.anchoMin = anchoMin;
        this.anchoMax = anchoMax;
        this.altoMin = altoMin;
        this.altoMax = altoMax;
        this.profundidadMin = profundidadMin;
        this.profundidadMax = profundidadMax;
        this.estantesMin = estantesMin;
        this.estantesMax = estantesMax;
        this.coleccion = coleccion;
    }
}
