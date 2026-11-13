package com.acerrinlab.viruta.materiales.interno;

import com.acerrinlab.viruta.materiales.Material;

/** Patron Strategy: cada material define su placa estandar y su terminacion (RNF-07). */
interface EstrategiaMaterial {

    Material material();

    int placaLargo();

    int placaAncho();

    /** Nombre de la terminacion, o "No requiere". */
    String terminacion();

    /** Litros estimados para cubrir la superficie de caras indicada, en metros cuadrados. */
    double litros(double superficieCarasM2);

    /** Dos manos con un rendimiento de 10 m2 por litro, redondeado hacia arriba a cuartos de litro. */
    static double litrosDosManos(double superficieCarasM2) {
        double litros = superficieCarasM2 * 2 / 10.0;
        return Math.ceil(litros * 4 - 1e-9) / 4.0;
    }
}
