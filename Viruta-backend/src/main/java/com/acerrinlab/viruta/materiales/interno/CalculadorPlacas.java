package com.acerrinlab.viruta.materiales.interno;

import java.util.List;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.materiales.PiezaCorte;

/**
 * Calculo simple de placas (RF-08): cuantas piezas iguales entran por placa y que fraccion
 * de placa usa cada grupo. No optimiza cortes ni descuenta el espesor de la sierra.
 */
public final class CalculadorPlacas {

    private CalculadorPlacas() {
    }

    /** Piezas de largo x ancho que entran en una placa, probando las dos orientaciones. */
    public static int piezasPorPlaca(int placaLargo, int placaAncho, int largo, int ancho) {
        int derecho = (placaLargo / largo) * (placaAncho / ancho);
        int girado = (placaLargo / ancho) * (placaAncho / largo);
        return Math.max(derecho, girado);
    }

    /** Fraccion de placas necesaria, sin redondear. */
    public static double placasExactas(List<PiezaCorte> piezas, int placaLargo, int placaAncho) {
        double total = 0;
        for (PiezaCorte pieza : piezas) {
            int porPlaca = piezasPorPlaca(placaLargo, placaAncho, pieza.largo(), pieza.ancho());
            if (porPlaca == 0) {
                throw ErrorNegocio.invalido("La pieza " + pieza.nombre() + " no entra en una placa de "
                        + placaLargo + " x " + placaAncho + " mm.");
            }
            total += (double) pieza.cantidad() / porPlaca;
        }
        return total;
    }

    /** Cantidad de placas a comprar: siempre redondea hacia arriba. */
    public static int placas(List<PiezaCorte> piezas, int placaLargo, int placaAncho) {
        if (piezas.isEmpty()) {
            return 0;
        }
        return (int) Math.max(1, Math.ceil(placasExactas(piezas, placaLargo, placaAncho) - 1e-9));
    }
}
