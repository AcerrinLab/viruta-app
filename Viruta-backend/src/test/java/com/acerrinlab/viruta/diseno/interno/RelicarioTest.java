package com.acerrinlab.viruta.diseno.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.PiezaDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.materiales.RolPieza;

/** El relicario: vitrina alta con puertas y estantes de vidrio, primera pieza de la seccion Antiguos. */
class RelicarioTest {

    private static List<PiezaDiseno> relicario(int ancho, int alto, int prof, int estantes) {
        return GeneradorPiezas.generar(Plantilla.RELICARIO, ancho, alto, prof, estantes, 18);
    }

    private static long contar(List<PiezaDiseno> piezas, String nombre) {
        return piezas.stream().filter(p -> p.nombre().equals(nombre)).count();
    }

    @Test
    void perteneceALaColeccionAntiguos() {
        assertEquals("ANTIGUOS", Plantilla.RELICARIO.coleccion);
        assertEquals("CLASICOS", Plantilla.ESTANTE.coleccion);
    }

    @Test
    void tieneCuerpoCompletoConZocaloYFondo() {
        List<PiezaDiseno> piezas = relicario(800, 1800, 400, 3);
        assertEquals(2, contar(piezas, "Lateral"));
        assertEquals(1, contar(piezas, "Techo"));
        assertEquals(1, contar(piezas, "Base"));
        assertEquals(1, contar(piezas, "Zócalo"));
        assertEquals(1, contar(piezas, "Fondo"));
    }

    @Test
    void losEstantesSonDeVidrioYRespetanLaCantidadPedida() {
        List<PiezaDiseno> piezas = relicario(800, 1800, 400, 3);
        List<PiezaDiseno> estantes = piezas.stream().filter(p -> p.nombre().equals("Estante de vidrio")).toList();
        assertEquals(3, estantes.size());
        assertTrue(estantes.stream().allMatch(p -> p.rol() == RolPieza.VIDRIO));
    }

    @Test
    void llevaUnaPuertaVidriadaHasta60cmYDosSiEsMasAncho() {
        assertEquals(1, contar(relicario(600, 1600, 350, 2), "Vidrio de puerta"));
        assertEquals(2, contar(relicario(800, 1600, 350, 2), "Vidrio de puerta"));
    }

    @Test
    void cadaPuertaSumaDosBisagras() {
        long bisagras = relicario(800, 1600, 350, 2).stream().mapToLong(p -> p.rol().bisagras()).sum();
        assertEquals(4, bisagras);
    }

    @Test
    void rechazaMedidasFueraDeRango() {
        assertThrows(ErrorNegocio.class, () -> relicario(300, 1800, 400, 3));
        assertThrows(ErrorNegocio.class, () -> relicario(800, 900, 400, 3));
        assertThrows(ErrorNegocio.class, () -> relicario(800, 1800, 700, 3));
        assertThrows(ErrorNegocio.class, () -> relicario(800, 1800, 400, 0));
    }

    @Test
    void ningunaPiezaSeSaleDeLasMedidasGenerales() {
        int[][] casos = { { 450, 1200, 300, 1 }, { 800, 1800, 400, 3 }, { 1000, 2000, 500, 5 } };
        for (int[] c : casos) {
            for (PiezaDiseno p : relicario(c[0], c[1], c[2], c[3])) {
                assertTrue(p.x() >= 0 && p.x() + p.dx() <= c[0], p.nombre() + " ancho");
                assertTrue(p.y() >= 0 && p.y() + p.dy() <= c[2], p.nombre() + " profundidad");
                assertTrue(p.z() >= 0 && p.z() + p.dz() <= c[1], p.nombre() + " alto");
                assertTrue(p.largo() >= p.ancho(), p.nombre() + " largo mayor o igual al ancho");
            }
        }
    }
}
