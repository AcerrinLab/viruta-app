package com.acerrinlab.viruta.pagos.interno;

/** Comision de Viruta sobre el trabajo concretado, a cargo de la carpinteria. */
public final class CalculadorComision {

    private CalculadorComision() {
    }

    /** Comision en pesos enteros: total del presupuesto por el porcentaje configurado (8 a 12). */
    public static long calcular(long totalPresupuesto, int porcentaje) {
        if (totalPresupuesto < 0) {
            throw new IllegalArgumentException("El total no puede ser negativo.");
        }
        if (porcentaje < 0 || porcentaje > 100) {
            throw new IllegalArgumentException("El porcentaje de comision debe estar entre 0 y 100.");
        }
        return Math.round(totalPresupuesto * porcentaje / 100.0);
    }
}
