package com.acerrinlab.viruta.traccion.interno;

import java.util.Map;
import java.util.Optional;

/** Inscriptos de la wishlist segun la planilla de Google Sheets. */
record ConteoWishlist(long clientes, long talleres) {

    long total() {
        return clientes + talleres;
    }

    /** Lee la respuesta del Apps Script ({"clientes": n, "talleres": n}). Si algo no cierra, no hay conteo. */
    static Optional<ConteoWishlist> desde(Map<?, ?> datos) {
        if (datos == null) {
            return Optional.empty();
        }
        Long clientes = numero(datos.get("clientes"));
        Long talleres = numero(datos.get("talleres"));
        if (clientes == null || talleres == null || clientes < 0 || talleres < 0) {
            return Optional.empty();
        }
        return Optional.of(new ConteoWishlist(clientes, talleres));
    }

    private static Long numero(Object valor) {
        if (valor instanceof Number n) {
            return n.longValue();
        }
        if (valor instanceof String s) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
