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

/**
 * Adapter de n8n: le manda el aviso a un flujo que lo reenvia por WhatsApp (RF-16).
 * Queda apagado hasta que WHATSAPP_HABILITADO=true y haya N8N_WEBHOOK_URL (falta la API de Meta).
 */
@Component
class CanalN8n implements CanalWhatsapp {

    private static final Logger log = LoggerFactory.getLogger(CanalN8n.class);

    private final String webhook;
    private final boolean habilitado;
    private final RestClient cliente;

    CanalN8n(@Value("${viruta.n8n.webhook:}") String webhook,
            @Value("${viruta.whatsapp.habilitado:false}") boolean habilitado) {
        this.webhook = webhook == null ? "" : webhook.trim();
        this.habilitado = habilitado;
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(10));
        this.cliente = RestClient.builder().requestFactory(fabrica).build();
    }

    @Override
    public boolean disponible() {
        return habilitado && !webhook.isBlank();
    }

    @Override
    public void enviar(String telefono, String mensaje) {
        if (!disponible()) {
            log.info("Aviso de WhatsApp sin enviar (WhatsApp deshabilitado o sin N8N_WEBHOOK_URL): {}", mensaje);
            return;
        }
        cliente.post().uri(webhook).contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("telefono", telefono, "mensaje", mensaje))
                .retrieve().toBodilessEntity();
    }
}
