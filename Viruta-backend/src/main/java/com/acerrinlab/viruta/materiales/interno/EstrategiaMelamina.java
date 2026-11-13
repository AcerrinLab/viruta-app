package com.acerrinlab.viruta.materiales.interno;

import com.acerrinlab.viruta.materiales.Material;

/** Melamina: placa de 2400 x 1800 mm. Ya viene terminada. */
class EstrategiaMelamina implements EstrategiaMaterial {

    @Override
    public Material material() {
        return Material.MELAMINA;
    }

    @Override
    public int placaLargo() {
        return 2400;
    }

    @Override
    public int placaAncho() {
        return 1800;
    }

    @Override
    public String terminacion() {
        return "No requiere";
    }

    @Override
    public double litros(double superficieCarasM2) {
        return 0;
    }
}
