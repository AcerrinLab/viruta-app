package com.acerrinlab.viruta.pagos.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

/** RF-18: la comision se calcula con el porcentaje configurado. */
class CalculadorComisionTest {

    @Test
    void diezPorCientoDe263000Es26300() {
        assertEquals(26300, CalculadorComision.calcular(263000, 10));
    }

    @Test
    void funcionaEnLosExtremosDelRangoAcordado() {
        assertEquals(8000, CalculadorComision.calcular(100000, 8));
        assertEquals(12000, CalculadorComision.calcular(100000, 12));
    }

    @Test
    void redondeaAlPesoMasCercano() {
        assertEquals(1235, CalculadorComision.calcular(12345, 10));
    }

    @Test
    void rechazaValoresImposibles() {
        assertThrows(IllegalArgumentException.class, () -> CalculadorComision.calcular(-1, 10));
        assertThrows(IllegalArgumentException.class, () -> CalculadorComision.calcular(1000, 101));
        assertThrows(IllegalArgumentException.class, () -> CalculadorComision.calcular(1000, -1));
    }
}
