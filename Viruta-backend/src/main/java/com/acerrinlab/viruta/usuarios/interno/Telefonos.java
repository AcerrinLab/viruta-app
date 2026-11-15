package com.acerrinlab.viruta.usuarios.interno;

import java.util.Optional;

/** Telefonos de Argentina: se guardan con codigo de area y numero, 10 digitos, sin 0 ni 15. */
final class Telefonos {

    private Telefonos() {
    }

    static Optional<String> normalizar(String texto) {
        if (texto == null) {
            return Optional.empty();
        }
        String d = texto.replaceAll("\\D", "");
        if (d.startsWith("549") && d.length() == 13) {
            d = d.substring(3);
        } else if (d.startsWith("54") && d.length() == 12) {
            d = d.substring(2);
        }
        if (d.startsWith("0")) {
            d = d.substring(1);
        }
        // "388 15 4567890": el 15 va despues del codigo de area (2 a 4 digitos).
        if (d.length() == 12) {
            for (int area = 2; area <= 4; area++) {
                if (d.startsWith("15", area)) {
                    d = d.substring(0, area) + d.substring(area + 2);
                    break;
                }
            }
        }
        return d.length() == 10 ? Optional.of(d) : Optional.empty();
    }

    static String ocultar(String telefono) {
        if (telefono == null || telefono.length() < 4) {
            return "";
        }
        return "•••• " + telefono.substring(telefono.length() - 4);
    }
}
