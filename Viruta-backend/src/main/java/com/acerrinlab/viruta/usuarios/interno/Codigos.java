package com.acerrinlab.viruta.usuarios.interno;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

/** Codigos de verificacion de 6 digitos. Solo se guarda su huella, nunca el codigo. */
final class Codigos {

    private static final SecureRandom AZAR = new SecureRandom();

    private Codigos() {
    }

    static String nuevo() {
        return String.format("%06d", AZAR.nextInt(1_000_000));
    }

    static String sal() {
        byte[] b = new byte[16];
        AZAR.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }

    static String huella(String codigo, String sal) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest((sal + ":" + codigo).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Comparacion en tiempo constante, para no dar pistas por la demora de la respuesta. */
    static boolean coincide(String codigo, String sal, String huellaGuardada) {
        if (codigo == null || huellaGuardada == null) {
            return false;
        }
        return MessageDigest.isEqual(huella(codigo.trim(), sal).getBytes(StandardCharsets.UTF_8),
                huellaGuardada.getBytes(StandardCharsets.UTF_8));
    }
}
