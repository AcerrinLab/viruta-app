package com.acerrinlab.viruta.pagos.interno;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/** RNF-08: los avisos de Mercado Pago se aceptan solo con la firma correcta. */
class VerificadorFirmaTest {

    private static final String SECRETO = "secreto-webhook-de-pruebas";

    private static String cabecera(String dataId, String requestId, String ts, String secreto) {
        return "ts=" + ts + ",v1=" + VerificadorFirma.firmar(dataId, requestId, ts, secreto);
    }

    @Test
    void aceptaUnaFirmaCorrecta() {
        assertTrue(VerificadorFirma.valida(cabecera("123", "req-1", "1700000000", SECRETO), "req-1", "123", SECRETO));
    }

    @Test
    void rechazaSiCambiaElPago() {
        assertFalse(VerificadorFirma.valida(cabecera("123", "req-1", "1700000000", SECRETO), "req-1", "999", SECRETO));
    }

    @Test
    void rechazaSiSeFirmoConOtroSecreto() {
        assertFalse(VerificadorFirma.valida(cabecera("123", "req-1", "1700000000", "otro"), "req-1", "123", SECRETO));
    }

    @Test
    void rechazaCabecerasVaciasOMalFormadas() {
        assertFalse(VerificadorFirma.valida(null, "req-1", "123", SECRETO));
        assertFalse(VerificadorFirma.valida("cualquier-cosa", "req-1", "123", SECRETO));
        assertFalse(VerificadorFirma.valida("ts=1700000000", "req-1", "123", SECRETO));
        assertFalse(VerificadorFirma.valida(cabecera("123", "req-1", "1700000000", SECRETO), "req-1", null, SECRETO));
    }

    @Test
    void sinSecretoConfiguradoNoAceptaNada() {
        assertFalse(VerificadorFirma.valida(cabecera("123", "req-1", "1700000000", SECRETO), "req-1", "123", ""));
    }
}
