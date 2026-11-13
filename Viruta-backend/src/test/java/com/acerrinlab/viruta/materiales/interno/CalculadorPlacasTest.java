package com.acerrinlab.viruta.materiales.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.materiales.PiezaCorte;
import com.acerrinlab.viruta.materiales.RolPieza;

/** RF-08. Casos C1 y C2 de DOC-06 (testimonio 2) y placa del caso A. */
class CalculadorPlacasTest {

    private static PiezaCorte pieza(int largo, int ancho, int cantidad) {
        return new PiezaCorte("Pieza", largo, ancho, 18, cantidad, RolPieza.HORIZONTAL);
    }

    @Test
    void entranSeisPiezasDe1800x400EnUnaPlacaDe2400x1800() {
        assertEquals(6, CalculadorPlacas.piezasPorPlaca(2400, 1800, 1800, 400));
    }

    @Test
    void casoC1_cincoPiezasUsanUnaPlaca() {
        assertEquals(1, CalculadorPlacas.placas(List.of(pieza(1800, 400, 5)), 2400, 1800));
    }

    @Test
    void casoC2_ochoPiezasUsanDosPlacasPorqueSiempreRedondeaHaciaArriba() {
        List<PiezaCorte> piezas = List.of(pieza(1800, 400, 8));
        assertEquals(2, CalculadorPlacas.placas(piezas, 2400, 1800));
        assertEquals(8 / 6.0, CalculadorPlacas.placasExactas(piezas, 2400, 1800), 1e-9);
    }

    @Test
    void seisPiezasExactasNoPidenUnaPlacaDeMas() {
        assertEquals(1, CalculadorPlacas.placas(List.of(pieza(1800, 400, 6)), 2400, 1800));
    }

    @Test
    void casoA_elEstanteEntraEnUnaPlaca() {
        List<PiezaCorte> piezas = List.of(pieza(900, 300, 2), pieza(764, 300, 3));
        assertEquals(1, CalculadorPlacas.placas(piezas, 2400, 1800));
    }

    @Test
    void sinPiezasNoHacenFaltaPlacas() {
        assertEquals(0, CalculadorPlacas.placas(List.of(), 2400, 1800));
    }

    @Test
    void unaPiezaMasGrandeQueLaPlacaSeRechaza() {
        assertThrows(ErrorNegocio.class, () -> CalculadorPlacas.placas(List.of(pieza(2500, 400, 1)), 2400, 1800));
    }
}
