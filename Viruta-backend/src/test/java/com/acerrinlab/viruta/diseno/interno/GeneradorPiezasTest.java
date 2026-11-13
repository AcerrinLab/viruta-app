package com.acerrinlab.viruta.diseno.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.PiezaDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;

/** RF-01 y RF-07. Casos A, B y D de DOC-06, calculados a mano. */
class GeneradorPiezasTest {

    private static long contar(List<PiezaDiseno> piezas, String nombre, int largo, int ancho) {
        return piezas.stream().filter(p -> p.nombre().equals(nombre) && p.largo() == largo && p.ancho() == ancho).count();
    }

    @Test
    void casoA_estanteDe800x900x300TieneCincoPiezas() {
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(Plantilla.ESTANTE, 800, 900, 300, 1, 18);
        assertEquals(5, piezas.size());
        assertEquals(2, contar(piezas, "Lateral", 900, 300));
        assertEquals(1, contar(piezas, "Tapa", 764, 300));
        assertEquals(1, contar(piezas, "Base", 764, 300));
        assertEquals(1, contar(piezas, "Estante", 764, 300));
    }

    @Test
    void casoA_elEstanteQuedaCentradoA441mmDelPiso() {
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(Plantilla.ESTANTE, 800, 900, 300, 1, 18);
        PiezaDiseno estante = piezas.stream().filter(p -> p.nombre().equals("Estante")).findFirst().orElseThrow();
        assertEquals(441, estante.z());
    }

    @Test
    void casoA_alEnsancharA1000SoloCambianLasPiezasInteriores() {
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(Plantilla.ESTANTE, 1000, 900, 300, 1, 18);
        assertEquals(5, piezas.size());
        assertEquals(2, contar(piezas, "Lateral", 900, 300));
        assertEquals(1, contar(piezas, "Tapa", 964, 300));
        assertEquals(1, contar(piezas, "Base", 964, 300));
        assertEquals(1, contar(piezas, "Estante", 964, 300));
    }

    @Test
    void casoB_mesaDe1200x750x600TieneCubiertaYDosLaterales() {
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(Plantilla.MESA, 1200, 750, 600, 0, 18);
        assertEquals(3, piezas.size());
        assertEquals(1, contar(piezas, "Cubierta", 1200, 600));
        assertEquals(2, contar(piezas, "Lateral", 732, 600));
    }

    @Test
    void casoB_alSubirA800SoloCambianLosLaterales() {
        List<PiezaDiseno> piezas = GeneradorPiezas.generar(Plantilla.MESA, 1200, 800, 600, 0, 18);
        assertEquals(1, contar(piezas, "Cubierta", 1200, 600));
        assertEquals(2, contar(piezas, "Lateral", 782, 600));
    }

    @Test
    void casoD_lasMedidasEnCeroNegativasOFueraDeRangoSeRechazan() {
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.ESTANTE, 0, 900, 300, 1, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.ESTANTE, -800, 900, 300, 1, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.ESTANTE, 2401, 900, 300, 1, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.ESTANTE, 800, 900, 601, 1, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.ESTANTE, 800, 900, 300, 7, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(Plantilla.MESA, 1200, 750, 600, 1, 18));
        assertThrows(ErrorNegocio.class, () -> GeneradorPiezas.generar(null, 800, 900, 300, 1, 18));
    }

    @Test
    void casoD_elMensajeMuestraElRangoPermitidoEnCentimetros() {
        ErrorNegocio error = assertThrows(ErrorNegocio.class,
                () -> GeneradorPiezas.generar(Plantilla.ESTANTE, 2500, 900, 300, 1, 18));
        assertEquals(400, error.estado());
        assertTrue(error.getMessage().contains("30 y 240 cm"));
    }

    @Test
    void elBajoMesadaLlevaUnaPuertaHasta60cmYDosSiEsMasAncho() {
        assertEquals(1, GeneradorPiezas.generar(Plantilla.BAJO_MESADA, 600, 850, 550, 1, 18).stream()
                .filter(p -> p.nombre().equals("Puerta")).count());
        assertEquals(2, GeneradorPiezas.generar(Plantilla.BAJO_MESADA, 800, 850, 550, 1, 18).stream()
                .filter(p -> p.nombre().equals("Puerta")).count());
    }

    @Test
    void ningunaPiezaSeSaleDeLasMedidasGeneralesDelMueble() {
        int[][] casos = { { 800, 900, 300, 2 }, { 1200, 750, 600, 0 }, { 900, 850, 550, 2 } };
        Plantilla[] plantillas = { Plantilla.ESTANTE, Plantilla.MESA, Plantilla.BAJO_MESADA };
        for (int i = 0; i < casos.length; i++) {
            int[] c = casos[i];
            for (PiezaDiseno p : GeneradorPiezas.generar(plantillas[i], c[0], c[1], c[2], c[3], 18)) {
                assertTrue(p.x() >= 0 && p.x() + p.dx() <= c[0], plantillas[i] + " " + p.nombre() + " ancho");
                assertTrue(p.y() >= 0 && p.y() + p.dy() <= c[2], plantillas[i] + " " + p.nombre() + " profundidad");
                assertTrue(p.z() >= 0 && p.z() + p.dz() <= c[1], plantillas[i] + " " + p.nombre() + " alto");
            }
        }
    }
}
