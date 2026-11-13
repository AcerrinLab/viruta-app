package com.acerrinlab.viruta.pagos.interno;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.acerrinlab.viruta.compartido.ErrorNegocio;

/** Adapter de Mercado Pago (Checkout Pro). Con tiempo maximo de espera en cada llamada (RNF-11). */
class PasarelaMercadoPago implements PasarelaPago {

    private static final Logger log = LoggerFactory.getLogger(PasarelaMercadoPago.class);

    private final RestClient cliente;
    private final String frontend;
    private final String backend;

    PasarelaMercadoPago(String token, String frontend, String backend) {
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Falta MP_ACCESS_TOKEN para usar PAGOS_MODO=mercadopago.");
        }
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(10));
        this.cliente = RestClient.builder()
                .baseUrl("https://api.mercadopago.com")
                .requestFactory(fabrica)
                .defaultHeader("Authorization", "Bearer " + token)
                .build();
        this.frontend = frontend;
        this.backend = backend;
    }

    @Override
    public String crearCobro(long pedidoId, String titulo, long monto) {
        Map<String, Object> cuerpo = Map.of(
                "items", List.of(Map.of("title", titulo, "quantity", 1, "unit_price", monto, "currency_id", "ARS")),
                "external_reference", String.valueOf(pedidoId),
                "back_urls", Map.of(
                        "success", frontend + "/mis-pedidos",
                        "pending", frontend + "/mis-pedidos",
                        "failure", frontend + "/mis-pedidos"),
                "auto_return", "approved",
                "notification_url", backend + "/api/pagos/webhook");
        try {
            Map<?, ?> respuesta = cliente.post().uri("/checkout/preferences")
                    .contentType(MediaType.APPLICATION_JSON).body(cuerpo).retrieve().body(Map.class);
            Object enlace = respuesta == null ? null : respuesta.get("init_point");
            if (enlace == null) {
                throw new IllegalStateException("Mercado Pago no devolvio el enlace de pago.");
            }
            return enlace.toString();
        } catch (RuntimeException e) {
            log.warn("No se pudo crear el cobro en Mercado Pago: {}", e.getMessage());
            throw new ErrorNegocio(503, "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos.");
        }
    }

    @Override
    public Optional<PagoExterno> consultar(String pagoId) {
        try {
            Map<?, ?> pago = cliente.get().uri("/v1/payments/{id}", pagoId).retrieve().body(Map.class);
            if (pago == null || pago.get("external_reference") == null) {
                return Optional.empty();
            }
            boolean aprobado = "approved".equals(pago.get("status"));
            long pedidoId = Long.parseLong(pago.get("external_reference").toString());
            return Optional.of(new PagoExterno(aprobado, pedidoId, pagoId));
        } catch (RuntimeException e) {
            log.warn("No se pudo consultar el pago {} en Mercado Pago: {}", pagoId, e.getMessage());
            return Optional.empty();
        }
    }
}
