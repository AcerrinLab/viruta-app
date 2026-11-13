package com.acerrinlab.viruta.notificaciones.interno;

import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;

/** Adapter de n8n: le manda el aviso a un flujo que lo reenvia por WhatsApp (RF-16). */
@Component
class CanalN8n implements CanalWhatsapp {

    private static final Logger log = LoggerFactory.getLogger(CanalN8n.class);

    private final String webhook;
    private final RestClient cliente;

    CanalN8n(@Value("${viruta.n8n.webhook:}") String webhook) {
        this.webhook = webhook;
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(10));
        this.cliente = RestClient.builder().requestFactory(fabrica).build();
    }

    @Override
    public void enviar(String telefono, String mensaje) {
        if (webhook.isBlank()) {
            log.info("Aviso de WhatsApp sin enviar (N8N_WEBHOOK_URL no configurado): {}", mensaje);
            return;
        }
        cliente.post().uri(webhook).contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("telefono", telefono, "mensaje", mensaje))
                .retrieve().toBodilessEntity();
    }
}
