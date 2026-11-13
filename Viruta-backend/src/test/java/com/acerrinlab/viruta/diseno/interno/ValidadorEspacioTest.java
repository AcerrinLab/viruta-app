package com.acerrinlab.viruta.diseno.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.Aviso;

/** RF-02. Caso E de DOC-06: estante de 800 x 900 x 300 en un espacio de 780 x 1000 x 320/290. */
class ValidadorEspacioTest {

    private static Aviso delEje(List<Aviso> avisos, String eje) {
        return avisos.stream().filter(a -> a.eje().equals(eje)).findFirst().orElse(null);
    }

    @Test
    void casoE_avisaLaDiferenciaDeAnchoEnCentimetros() {
        List<Aviso> avisos = ValidadorEspacio.validar(800, 900, 300, 780, 1000, 320, 290);
        Aviso ancho = delEje(avisos, "ancho");
        assertEquals(20, ancho.diferenciaMm());
        assertTrue(ancho.mensaje().contains("2 cm"));
    }

    @Test
    void casoE_siLaProfundidadDifiereUsaLaMenorYAvisa() {
        List<Aviso> avisos = ValidadorEspacio.validar(800, 900, 300, 780, 1000, 320, 290);
        assertTrue(delEje(avisos, "espacio").mensaje().contains("29 cm"));
        Aviso profundidad = delEje(avisos, "profundidad");
        assertEquals(10, profundidad.diferenciaMm());
        assertTrue(profundidad.mensaje().contains("1 cm"));
    }

    @Test
    void casoE_elAltoEntraYNoGeneraAviso() {
        List<Aviso> avisos = ValidadorEspacio.validar(800, 900, 300, 780, 1000, 320, 290);
        assertEquals(null, delEje(avisos, "alto"));
        assertEquals(3, avisos.size());
    }

    @Test
    void siElMuebleEntraNoHayAvisos() {
        assertTrue(ValidadorEspacio.validar(800, 900, 300, 800, 900, 300, 300).isEmpty());
    }

    @Test
    void lasDiferenciasConMilimetrosSeMuestranConUnDecimal() {
        assertEquals("2,5", ValidadorEspacio.cm(25));
        assertEquals("12", ValidadorEspacio.cm(120));
    }

    @Test
    void lasMedidasDelEspacioEnCeroSeRechazan() {
        assertThrows(ErrorNegocio.class, () -> ValidadorEspacio.validar(800, 900, 300, 0, 1000, 320, 290));
    }
}
