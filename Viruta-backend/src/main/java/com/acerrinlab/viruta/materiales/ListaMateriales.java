package com.acerrinlab.viruta.materiales;

import java.util.List;

/**
 * Lo que hay que comprar (F2). Todas las cantidades son estimadas (RNF-10).
 * "placas" siempre redondea hacia arriba; "placasExactas" conserva la fraccion.
 */
public record ListaMateriales(
        List<PiezaCorte> despiece,
        int placas,
        double placasExactas,
        int placaLargo,
        int placaAncho,
        double superficieM2,
        int tornillos,
        int bisagras,
        String terminacion,
        double litros) {
}
