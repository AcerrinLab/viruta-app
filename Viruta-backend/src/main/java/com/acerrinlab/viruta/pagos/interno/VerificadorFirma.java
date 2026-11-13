package com.acerrinlab.viruta.pagos.interno;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Verifica la firma de los avisos de Mercado Pago (RNF-08). La cabecera x-signature trae
 * "ts=...,v1=..." y v1 es el HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".
 */
public final class VerificadorFirma {

    private VerificadorFirma() {
    }

    public static boolean valida(String xSignature, String xRequestId, String dataId, String secreto) {
        if (xSignature == null || dataId == null || secreto == null || secreto.isBlank()) {
            return false;
        }
        String ts = null;
        String v1 = null;
        for (String parte : xSignature.split(",")) {
            String[] par = parte.trim().split("=", 2);
            if (par.length == 2) {
                if (par[0].trim().equals("ts")) {
                    ts = par[1].trim();
                } else if (par[0].trim().equals("v1")) {
                    v1 = par[1].trim();
                }
            }
        }
        if (ts == null || v1 == null) {
            return false;
        }
        String esperada = firmar(dataId, xRequestId == null ? "" : xRequestId, ts, secreto);
        return MessageDigest.isEqual(esperada.getBytes(StandardCharsets.UTF_8), v1.getBytes(StandardCharsets.UTF_8));
    }

    public static String firmar(String dataId, String xRequestId, String ts, String secreto) {
        String manifiesto = "id:" + dataId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(manifiesto.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
