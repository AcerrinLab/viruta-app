package com.acerrinlab.viruta.diseno;

import java.util.List;
import java.util.Optional;

/** Interfaz publica del modulo diseno. */
public interface DisenoApi {

    /** Valida las medidas y calcula piezas, avisos y materiales. */
    ResultadoDiseno calcular(DatosDiseno diseno);

    /**
     * Solo las piezas, sin avisos ni lista de materiales: alcanza para dibujar la miniatura en las
     * listas. Si el diseno guardado ya no es valido devuelve una lista vacia en vez de fallar.
     */
    List<PiezaDiseno> piezas(DatosDiseno diseno);

    /** Devuelve el proyecto guardado si pertenece al cliente indicado. */
    Optional<DatosDiseno> proyectoDe(long proyectoId, long clienteId);

    long contarProyectos();
}
