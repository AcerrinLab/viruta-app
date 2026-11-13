package com.acerrinlab.viruta.materiales.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.materiales.ListaMateriales;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.materiales.PiezaCorte;
import com.acerrinlab.viruta.materiales.RolPieza;

/** RF-07 a RF-09 sobre el caso A de DOC-06 (estante de 800 x 900 x 300 mm). */
class CalculadorMaterialesTest {

    private final CalculadorMateriales calculador = new CalculadorMateriales();

    private static List<PiezaCorte> estanteCasoA() {
        return List.of(
                new PiezaCorte("Lateral", 900, 300, 18, 1, RolPieza.VERTICAL),
                new PiezaCorte("Lateral", 900, 300, 18, 1, RolPieza.VERTICAL),
                new PiezaCorte("Tapa", 764, 300, 18, 1, RolPieza.HORIZONTAL),
                new PiezaCorte("Base", 764, 300, 18, 1, RolPieza.HORIZONTAL),
                new PiezaCorte("Estante", 764, 300, 18, 1, RolPieza.HORIZONTAL));
    }

    @Test
    void elDespieceAgrupaLasPiezasIgualesYConservaLaCantidadTotal() {
        ListaMateriales lista = calculador.calcular(Material.MELAMINA, estanteCasoA());
        assertEquals(4, lista.despiece().size());
        assertEquals(2, lista.despiece().get(0).cantidad());
        assertEquals(5, lista.despiece().stream().mapToInt(PiezaCorte::cantidad).sum());
    }

    @Test
    void laSuperficieDelCasoACoincideConElCalculoManual() {
        ListaMateriales lista = calculador.calcular(Material.MELAMINA, estanteCasoA());
        assertEquals(1.2276, lista.superficieM2(), 1e-9);
    }

    @Test
    void melaminaUsaUnaPlacaDe2400x1800YNoRequiereTerminacion() {
        ListaMateriales lista = calculador.calcular(Material.MELAMINA, estanteCasoA());
        assertEquals(1, lista.placas());
        assertEquals(2400, lista.placaLargo());
        assertEquals(1800, lista.placaAncho());
        assertEquals("No requiere", lista.terminacion());
        assertEquals(0.0, lista.litros(), 1e-9);
    }

    @Test
    void cadaPiezaHorizontalLlevaOchoTornillos() {
        ListaMateriales lista = calculador.calcular(Material.MELAMINA, estanteCasoA());
        assertEquals(24, lista.tornillos());
        assertEquals(0, lista.bisagras());
    }

    @Test
    void cadaPuertaLlevaDosBisagras() {
        List<PiezaCorte> piezas = List.of(new PiezaCorte("Puerta", 700, 395, 18, 2, RolPieza.PUERTA));
        assertEquals(4, calculador.calcular(Material.MELAMINA, piezas).bisagras());
    }

    @Test
    void pinoSeTerminaConBarnizRedondeadoACuartosDeLitro() {
        ListaMateriales lista = calculador.calcular(Material.PINO, estanteCasoA());
        assertEquals("Barniz", lista.terminacion());
        assertEquals(0.5, lista.litros(), 1e-9);
        assertEquals(1200, lista.placaAncho());
    }

    @Test
    void aglomeradoSeTerminaConPintura() {
        ListaMateriales lista = calculador.calcular(Material.AGLOMERADO, estanteCasoA());
        assertEquals("Pintura", lista.terminacion());
        assertEquals(0.5, lista.litros(), 1e-9);
    }

    @Test
    void sinMaterialSeRechaza() {
        assertThrows(ErrorNegocio.class, () -> calculador.calcular(null, estanteCasoA()));
    }

    @Test
    void unaPiezaConMedidaCeroSeRechaza() {
        List<PiezaCorte> piezas = List.of(new PiezaCorte("Tapa", 0, 300, 18, 1, RolPieza.HORIZONTAL));
        assertThrows(ErrorNegocio.class, () -> calculador.calcular(Material.MELAMINA, piezas));
    }
}
