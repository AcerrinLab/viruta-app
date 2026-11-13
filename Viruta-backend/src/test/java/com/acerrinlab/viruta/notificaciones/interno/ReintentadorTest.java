package com.acerrinlab.viruta.notificaciones.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

/** RF-16 y RNF-11: si el aviso falla, se reintenta. */
class ReintentadorTest {

    @Test
    void siSaleBienALaPrimeraNoReintentaNiEspera() {
        List<Long> esperas = new ArrayList<>();
        int[] llamadas = { 0 };
        assertTrue(new Reintentador(3, 100, esperas::add).ejecutar(() -> llamadas[0]++));
        assertEquals(1, llamadas[0]);
        assertTrue(esperas.isEmpty());
    }

    @Test
    void reintentaHastaQueSaleBien() {
        List<Long> esperas = new ArrayList<>();
        int[] llamadas = { 0 };
        boolean enviado = new Reintentador(3, 100, esperas::add).ejecutar(() -> {
            if (++llamadas[0] < 3) {
                throw new IllegalStateException("n8n no responde");
            }
        });
        assertTrue(enviado);
        assertEquals(3, llamadas[0]);
        assertEquals(List.of(100L, 200L), esperas);
    }

    @Test
    void siFallanTodosLosIntentosDevuelveFalseSinPropagarElError() {
        int[] llamadas = { 0 };
        boolean enviado = new Reintentador(3, 100, ms -> { }).ejecutar(() -> {
            llamadas[0]++;
            throw new IllegalStateException("n8n no responde");
        });
        assertFalse(enviado);
        assertEquals(3, llamadas[0]);
    }
}
