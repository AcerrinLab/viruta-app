package com.acerrinlab.viruta.traccion.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;

/** El contador de la portada toma los numeros que devuelve la planilla de la wishlist. */
class ConteoWishlistTest {

    @Test
    void leeClientesYTalleresYCalculaElTotal() {
        Optional<ConteoWishlist> c = ConteoWishlist.desde(Map.of("clientes", 120, "talleres", 9));
        assertTrue(c.isPresent());
        assertEquals(120, c.get().clientes());
        assertEquals(9, c.get().talleres());
        assertEquals(129, c.get().total());
    }

    @Test
    void aceptaNumerosQueLleganComoTexto() {
        assertEquals(42, ConteoWishlist.desde(Map.of("clientes", "40", "talleres", "2")).orElseThrow().total());
    }

    @Test
    void siFaltanLosDatosNoInventaNumeros() {
        assertTrue(ConteoWishlist.desde(Map.of("estado", "ok")).isEmpty());
        assertTrue(ConteoWishlist.desde(null).isEmpty());
        assertTrue(ConteoWishlist.desde(Map.of("clientes", "muchos", "talleres", 3)).isEmpty());
    }

    @Test
    void nuncaDevuelveNegativos() {
        assertTrue(ConteoWishlist.desde(Map.of("clientes", -5, "talleres", 1)).isEmpty());
    }
}
