package com.acerrinlab.viruta.materiales.interno;

import com.acerrinlab.viruta.materiales.Material;

/** Pino: tablero alistonado de 2400 x 1200 mm, terminado con barniz. */
class EstrategiaPino implements EstrategiaMaterial {

    @Override
    public Material material() {
        return Material.PINO;
    }

    @Override
    public int placaLargo() {
        return 2400;
    }

    @Override
    public int placaAncho() {
        return 1200;
    }

    @Override
    public String terminacion() {
        return "Barniz";
    }

    @Override
    public double litros(double superficieCarasM2) {
        return EstrategiaMaterial.litrosDosManos(superficieCarasM2);
    }
}
