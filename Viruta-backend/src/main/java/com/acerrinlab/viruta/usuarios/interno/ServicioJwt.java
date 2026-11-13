package com.acerrinlab.viruta.usuarios.interno;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.Sesion;

/** Emite y valida tokens JWT firmados con HS256 (RNF-08). Sin dependencias externas. */
public class ServicioJwt {

    private static final Pattern CUERPO = Pattern.compile("^\\{\"sub\":\"(\\d+)\",\"rol\":\"([A-Z_]+)\",\"exp\":(\\d+)\\}$");
    private static final String CABECERA = codificar("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] secreto;
    private final long segundosDeVida;
    private final Clock reloj;

    public ServicioJwt(String secreto, long horasDeVida, Clock reloj) {
        if (secreto == null || secreto.length() < 32) {
            throw new IllegalStateException("JWT_SECRETO debe tener al menos 32 caracteres.");
        }
        this.secreto = secreto.getBytes(StandardCharsets.UTF_8);
        this.segundosDeVida = horasDeVida * 3600;
        this.reloj = reloj;
    }

    public String generar(long usuarioId, Rol rol) {
        long vence = reloj.instant().getEpochSecond() + segundosDeVida;
        String cuerpo = "{\"sub\":\"" + usuarioId + "\",\"rol\":\"" + rol.name() + "\",\"exp\":" + vence + "}";
        String contenido = CABECERA + "." + codificar(cuerpo.getBytes(StandardCharsets.UTF_8));
        return contenido + "." + firmar(contenido);
    }

    public Optional<Sesion> validar(String token) {
        if (token == null) {
            return Optional.empty();
        }
        String[] partes = token.split("\\.");
        if (partes.length != 3) {
            return Optional.empty();
        }
        String esperada = firmar(partes[0] + "." + partes[1]);
        if (!MessageDigest.isEqual(esperada.getBytes(StandardCharsets.UTF_8), partes[2].getBytes(StandardCharsets.UTF_8))) {
            return Optional.empty();
        }
        try {
            String cuerpo = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
            Matcher m = CUERPO.matcher(cuerpo);
            if (!m.matches() || Long.parseLong(m.group(3)) <= reloj.instant().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.of(new Sesion(Long.parseLong(m.group(1)), Rol.valueOf(m.group(2))));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String firmar(String contenido) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto, "HmacSHA256"));
            return codificar(mac.doFinal(contenido.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String codificar(byte[] datos) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(datos);
    }
}
