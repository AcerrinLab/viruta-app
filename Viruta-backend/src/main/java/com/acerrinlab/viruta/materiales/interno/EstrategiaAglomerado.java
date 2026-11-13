package com.acerrinlab.viruta.materiales.interno;

import com.acerrinlab.viruta.materiales.Material;

/** Aglomerado: placa de 2400 x 1800 mm, terminado con pintura. */
class EstrategiaAglomerado implements EstrategiaMaterial {

    @Override
    public Material material() {
        return Material.AGLOMERADO;
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
        return "Pintura";
    }

    @Override
    public double litros(double superficieCarasM2) {
        return EstrategiaMaterial.litrosDosManos(superficieCarasM2);
    }
}
