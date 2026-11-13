package com.acerrinlab.viruta.diseno.interno;

import com.acerrinlab.viruta.diseno.DatosDiseno;

record VistaProyecto(long id, DatosDiseno diseno, int revision, String actualizado) {

    static VistaProyecto de(Proyecto p) {
        return new VistaProyecto(p.id, p.aDatos(), p.revision, String.valueOf(p.actualizado));
    }
}
