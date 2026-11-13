package com.acerrinlab.viruta.usuarios.interno;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/** RNF-08: limite de peticiones en el inicio de sesion. */
class LimitadorIntentosTest {

    /** Reloj que se puede adelantar a mano. */
    private static class RelojManual extends Clock {
        Instant ahora = Instant.parse("2026-11-13T12:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zona) {
            return this;
        }

        @Override
        public Instant instant() {
            return ahora;
        }
    }

    @Test
    void permiteHastaElMaximoYDespuesBloquea() {
        LimitadorIntentos limitador = new LimitadorIntentos(5, Duration.ofMinutes(1), new RelojManual());
        for (int i = 0; i < 5; i++) {
            assertTrue(limitador.permitir("clave"));
        }
        assertFalse(limitador.permitir("clave"));
    }

    @Test
    void cadaClaveTieneSuPropioLimite() {
        LimitadorIntentos limitador = new LimitadorIntentos(1, Duration.ofMinutes(1), new RelojManual());
        assertTrue(limitador.permitir("a"));
        assertTrue(limitador.permitir("b"));
        assertFalse(limitador.permitir("a"));
    }

    @Test
    void vuelveAPermitirCuandoPasaLaVentana() {
        RelojManual reloj = new RelojManual();
        LimitadorIntentos limitador = new LimitadorIntentos(1, Duration.ofMinutes(1), reloj);
        assertTrue(limitador.permitir("clave"));
        assertFalse(limitador.permitir("clave"));
        reloj.ahora = reloj.ahora.plus(Duration.ofSeconds(61));
        assertTrue(limitador.permitir("clave"));
    }

    @Test
    void unIngresoCorrectoReiniciaElContador() {
        LimitadorIntentos limitador = new LimitadorIntentos(1, Duration.ofMinutes(1), new RelojManual());
        assertTrue(limitador.permitir("clave"));
        limitador.reiniciar("clave");
        assertTrue(limitador.permitir("clave"));
    }
}
