package com.acerrinlab.viruta.diseno.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.ColorMueble;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.diseno.ResultadoDiseno;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.materiales.interno.CalculadorMateriales;

/** El proyecto es la unica fuente de datos: de el salen piezas, avisos y materiales. */
class CalculadorDisenoTest {

    private final CalculadorDiseno calculador = new CalculadorDiseno(new CalculadorMateriales());

    private static DatosDiseno estante(int ancho, Integer espacioAncho) {
        return new DatosDiseno("Estante", Plantilla.ESTANTE, ancho, 900, 300, 1, Material.MELAMINA, ColorMueble.NATURAL,
                espacioAncho, espacioAncho == null ? null : 1000, espacioAncho == null ? null : 320,
                espacioAncho == null ? null : 290);
    }

    @Test
    void laSumaDelDespieceCoincideConLasPiezasDelModelo() {
        ResultadoDiseno r = calculador.calcular(estante(800, null));
        int enDespiece = r.materiales().despiece().stream().mapToInt(p -> p.cantidad()).sum();
        assertEquals(r.piezas().size(), enDespiece);
        assertEquals(1, r.materiales().placas());
    }

    @Test
    void sinMedidasDelEspacioNoHayAvisos() {
        assertTrue(calculador.calcular(estante(800, null)).avisos().isEmpty());
    }

    @Test
    void conMedidasDelEspacioAvisaSiNoEntra() {
        assertEquals(3, calculador.calcular(estante(800, 780)).avisos().size());
    }

    @Test
    void cambiarUnaMedidaActualizaElDespiece() {
        ResultadoDiseno r = calculador.calcular(estante(1000, null));
        assertTrue(r.materiales().despiece().stream().anyMatch(p -> p.nombre().equals("Estante") && p.largo() == 964));
    }

    @Test
    void sinMaterialSeRechaza() {
        DatosDiseno sinMaterial = new DatosDiseno("Estante", Plantilla.ESTANTE, 800, 900, 300, 1, null,
                ColorMueble.NATURAL, null, null, null, null);
        assertThrows(ErrorNegocio.class, () -> calculador.calcular(sinMaterial));
    }
}
