package com.acerrinlab.viruta.traccion.interno;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Lee el conteo de la wishlist desde el Apps Script de Google Sheets (doGet). Guarda el ultimo
 * valor unos minutos para no consultar la planilla en cada visita. Si no esta configurada o falla,
 * devuelve vacio y la portada usa la lista local.
 */
@Component
class FuenteWishlist {

    private static final Logger log = LoggerFactory.getLogger(FuenteWishlist.class);
    private static final Duration VIGENCIA = Duration.ofMinutes(5);

    private final String url;
    private final Clock reloj;
    private final RestClient cliente;
    private ConteoWishlist ultimo;
    private Instant leido = Instant.EPOCH;

    FuenteWishlist(@Value("${viruta.wishlist.sheets-url:}") String url, Clock reloj) {
        this.url = url == null ? "" : url.trim();
        this.reloj = reloj;
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(4));
        fabrica.setReadTimeout(Duration.ofSeconds(8));
        this.cliente = RestClient.builder().requestFactory(fabrica).build();
    }

    synchronized Optional<ConteoWishlist> conteo() {
        if (url.isEmpty()) {
            return Optional.empty();
        }
        Instant ahora = reloj.instant();
        if (ultimo != null && Duration.between(leido, ahora).compareTo(VIGENCIA) < 0) {
            return Optional.of(ultimo);
        }
        try {
            Map<?, ?> datos = cliente.get().uri(url).retrieve().body(Map.class);
            Optional<ConteoWishlist> nuevo = ConteoWishlist.desde(datos);
            nuevo.ifPresent(c -> {
                ultimo = c;
                leido = ahora;
            });
            return nuevo.or(() -> Optional.ofNullable(ultimo));
        } catch (RuntimeException e) {
            log.warn("No se pudo leer la wishlist de Google Sheets: {}", e.getMessage());
            return Optional.ofNullable(ultimo);
        }
    }
}
