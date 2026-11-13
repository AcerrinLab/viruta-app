package com.acerrinlab.viruta.materiales;

import java.util.List;

/** Interfaz publica del modulo materiales. */
public interface MaterialesApi {

    /** Calcula despiece, placas, herrajes y terminacion para las piezas dadas (RF-07 a RF-09). */
    ListaMateriales calcular(Material material, List<PiezaCorte> piezas);
}
