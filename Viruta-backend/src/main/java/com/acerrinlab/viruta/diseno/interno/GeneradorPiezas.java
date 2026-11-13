package com.acerrinlab.viruta.diseno.interno;

import java.util.ArrayList;
import java.util.List;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.PiezaDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.materiales.RolPieza;

/** Calcula las piezas de cada plantilla a partir de sus medidas y del espesor del material. */
public final class GeneradorPiezas {

    private GeneradorPiezas() {
    }

    public static List<PiezaDiseno> generar(Plantilla plantilla, int ancho, int alto, int profundidad,
            int estantes, int espesor) {
        if (plantilla == null) {
            throw ErrorNegocio.invalido("Falta elegir la plantilla.");
        }
        validar("ancho", ancho, plantilla.anchoMin, plantilla.anchoMax);
        validar("alto", alto, plantilla.altoMin, plantilla.altoMax);
        validar("profundidad", profundidad, plantilla.profundidadMin, plantilla.profundidadMax);
        if (estantes < plantilla.estantesMin || estantes > plantilla.estantesMax) {
            throw ErrorNegocio.invalido("La cantidad de estantes debe estar entre " + plantilla.estantesMin
                    + " y " + plantilla.estantesMax + ".");
        }
        return switch (plantilla) {
            case ESTANTE -> estante(ancho, alto, profundidad, estantes, espesor);
            case MESA -> mesa(ancho, alto, profundidad, espesor);
            case BAJO_MESADA -> bajoMesada(ancho, alto, profundidad, estantes, espesor);
        };
    }

    private static void validar(String nombre, int valor, int min, int max) {
        if (valor < min || valor > max) {
            throw ErrorNegocio.invalido("El " + nombre + " debe estar entre " + (min / 10) + " y " + (max / 10) + " cm.");
        }
    }

    /** Dos laterales de altura completa; tapa, base y estantes entre los laterales. */
    private static List<PiezaDiseno> estante(int ancho, int alto, int prof, int estantes, int e) {
        List<PiezaDiseno> piezas = new ArrayList<>();
        int interior = ancho - 2 * e;
        piezas.add(vertical("Lateral", alto, prof, e, 0, 0, 0));
        piezas.add(vertical("Lateral", alto, prof, e, ancho - e, 0, 0));
        piezas.add(horizontal("Tapa", interior, prof, e, e, 0, alto - e));
        piezas.add(horizontal("Base", interior, prof, e, e, 0, 0));
        agregarEstantes(piezas, estantes, interior, prof, e, e, 0, e, alto - e);
        return piezas;
    }

    /** Cubierta apoyada sobre dos laterales en los extremos. */
    private static List<PiezaDiseno> mesa(int ancho, int alto, int prof, int e) {
        List<PiezaDiseno> piezas = new ArrayList<>();
        piezas.add(horizontal("Cubierta", ancho, prof, e, 0, 0, alto - e));
        piezas.add(vertical("Lateral", alto - e, prof, e, 0, 0, 0));
        piezas.add(vertical("Lateral", alto - e, prof, e, ancho - e, 0, 0));
        return piezas;
    }

    /** Cuerpo sin tapa (arriba va la mesada), con travesanos, estantes y puertas al frente. */
    private static List<PiezaDiseno> bajoMesada(int ancho, int alto, int prof, int estantes, int e) {
        List<PiezaDiseno> piezas = new ArrayList<>();
        int interior = ancho - 2 * e;
        int cuerpo = prof - e;
        piezas.add(vertical("Lateral", alto, cuerpo, e, 0, e, 0));
        piezas.add(vertical("Lateral", alto, cuerpo, e, ancho - e, e, 0));
        piezas.add(horizontal("Base", interior, cuerpo, e, e, e, 0));
        int travesano = 100;
        piezas.add(new PiezaDiseno("Travesaño", RolPieza.REFUERZO, interior, travesano, e,
                e, e, alto - e, interior, travesano, e));
        piezas.add(new PiezaDiseno("Travesaño", RolPieza.REFUERZO, interior, travesano, e,
                e, prof - travesano, alto - e, interior, travesano, e));
        agregarEstantes(piezas, estantes, interior, cuerpo, e, e, e, e, alto - e);

        int puertas = ancho <= 600 ? 1 : 2;
        int luz = 3;
        int anchoPuerta = (ancho - luz * (puertas + 1)) / puertas;
        int altoPuerta = alto - 2 * luz;
        for (int i = 0; i < puertas; i++) {
            int x = luz + i * (anchoPuerta + luz);
            piezas.add(new PiezaDiseno("Puerta", RolPieza.PUERTA, altoPuerta, anchoPuerta, e,
                    x, 0, luz, anchoPuerta, e, altoPuerta));
        }
        return piezas;
    }

    /** Reparte los estantes a la misma distancia entre el piso y el techo interiores. */
    private static void agregarEstantes(List<PiezaDiseno> piezas, int cantidad, int largo, int prof, int e,
            int x, int y, int pisoZ, int techoZ) {
        if (cantidad <= 0) {
            return;
        }
        int hueco = (techoZ - pisoZ - cantidad * e) / (cantidad + 1);
        for (int i = 0; i < cantidad; i++) {
            int z = pisoZ + (i + 1) * hueco + i * e;
            piezas.add(horizontal("Estante", largo, prof, e, x, y, z));
        }
    }

    private static PiezaDiseno vertical(String nombre, int alto, int prof, int e, int x, int y, int z) {
        return new PiezaDiseno(nombre, RolPieza.VERTICAL, alto, prof, e, x, y, z, e, prof, alto);
    }

    private static PiezaDiseno horizontal(String nombre, int largo, int prof, int e, int x, int y, int z) {
        return new PiezaDiseno(nombre, RolPieza.HORIZONTAL, largo, prof, e, x, y, z, largo, prof, e);
    }
}
