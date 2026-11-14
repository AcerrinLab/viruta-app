package com.acerrinlab.viruta.materiales.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.materiales.ListaMateriales;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.materiales.PiezaCorte;
import com.acerrinlab.viruta.materiales.RolPieza;

/** El vidrio no sale de la placa: se cuenta aparte en metros cuadrados. */
class VidrioTest {

    private final CalculadorMateriales calculador = new CalculadorMateriales();

    @Test
    void elVidrioNoSumaPlacasNiSuperficieDeMadera() {
        List<PiezaCorte> soloMadera = List.of(new PiezaCorte("Lateral", 1800, 382, 18, 2, RolPieza.VERTICAL));
        List<PiezaCorte> conVidrio = List.of(
                new PiezaCorte("Lateral", 1800, 382, 18, 2, RolPieza.VERTICAL),
                new PiezaCorte("Estante de vidrio", 754, 340, 6, 3, RolPieza.VIDRIO));
        ListaMateriales a = calculador.calcular(Material.PINO, soloMadera);
        ListaMateriales b = calculador.calcular(Material.PINO, conVidrio);
        assertEquals(a.placas(), b.placas());
        assertEquals(a.superficieM2(), b.superficieM2(), 1e-9);
    }

    @Test
    void elVidrioSeInformaEnMetrosCuadrados() {
        List<PiezaCorte> piezas = List.of(new PiezaCorte("Estante de vidrio", 1000, 500, 6, 2, RolPieza.VIDRIO));
        assertEquals(1.0, calculador.calcular(Material.MELAMINA, piezas).vidrioM2(), 1e-9);
    }

    @Test
    void sinVidrioElValorEsCero() {
        List<PiezaCorte> piezas = List.of(new PiezaCorte("Tapa", 764, 300, 18, 1, RolPieza.HORIZONTAL));
        assertEquals(0.0, calculador.calcular(Material.MELAMINA, piezas).vidrioM2(), 1e-9);
    }
}
