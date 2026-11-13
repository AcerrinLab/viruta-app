package com.acerrinlab.viruta.diseno;

import java.util.List;

import com.acerrinlab.viruta.materiales.ListaMateriales;

/** Todo lo que se deriva del proyecto: piezas para el 3D y la AR, avisos y lista de materiales. */
public record ResultadoDiseno(List<PiezaDiseno> piezas, List<Aviso> avisos, ListaMateriales materiales) {
}
