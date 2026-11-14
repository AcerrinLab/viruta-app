package com.acerrinlab.viruta.notificaciones.interno;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/** WhatsApp queda apagado hasta que se habilita y hay un webhook de n8n. */
class CanalN8nTest {

    @Test
    void sinHabilitarNoEstaDisponibleAunqueHayaWebhook() {
        assertFalse(new CanalN8n("https://n8n.ejemplo/webhook", false).disponible());
    }

    @Test
    void habilitadoSinWebhookTampoco() {
        assertFalse(new CanalN8n("", true).disponible());
    }

    @Test
    void habilitadoYConWebhookSiEstaDisponible() {
        assertTrue(new CanalN8n("https://n8n.ejemplo/webhook", true).disponible());
    }

    @Test
    void apagadoNoIntentaEnviarNada() {
        assertDoesNotThrow(() -> new CanalN8n("https://no-existe.invalid/webhook", false).enviar("3884000000", "hola"));
    }
}
