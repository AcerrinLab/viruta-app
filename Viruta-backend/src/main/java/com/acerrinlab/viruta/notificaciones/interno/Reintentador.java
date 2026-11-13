package com.acerrinlab.viruta.notificaciones.interno;

import java.util.function.LongConsumer;

/** Ejecuta una accion con reintentos y espera creciente entre intentos (RNF-11). */
public class Reintentador {

    private final int intentos;
    private final long esperaInicialMs;
    private final LongConsumer dormir;

    public Reintentador(int intentos, long esperaInicialMs, LongConsumer dormir) {
        this.intentos = intentos;
        this.esperaInicialMs = esperaInicialMs;
        this.dormir = dormir;
    }

    /** Devuelve true si la accion salio bien en alguno de los intentos. Nunca propaga el error. */
    public boolean ejecutar(Runnable accion) {
        long espera = esperaInicialMs;
        for (int i = 1; i <= intentos; i++) {
            try {
                accion.run();
                return true;
            } catch (RuntimeException e) {
                if (i < intentos) {
                    dormir.accept(espera);
                    espera *= 2;
                }
            }
        }
        return false;
    }
}
