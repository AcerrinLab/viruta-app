package com.acerrinlab.viruta.diseno;

import java.util.Optional;

/** Interfaz publica del modulo diseno. */
public interface DisenoApi {

    /** Valida las medidas y calcula piezas, avisos y materiales. */
    ResultadoDiseno calcular(DatosDiseno diseno);

    /** Devuelve el proyecto guardado si pertenece al cliente indicado. */
    Optional<DatosDiseno> proyectoDe(long proyectoId, long clienteId);

    long contarProyectos();
}
