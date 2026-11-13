package com.acerrinlab.viruta.notificaciones.interno;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.acerrinlab.viruta.carpinterias.CarpinteriasApi;
import com.acerrinlab.viruta.carpinterias.DatosCarpinteria;
import com.acerrinlab.viruta.compartido.eventos.PedidoCreado;
import com.acerrinlab.viruta.compartido.eventos.SenaPagada;
import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;

import jakarta.annotation.PreDestroy;

/**
 * Escucha los eventos de dominio y avisa a la carpinteria por WhatsApp y dentro de la app.
 * El aviso sale despues de confirmada la transaccion y en segundo plano: si WhatsApp falla,
 * se reintenta y el pedido igual queda en la bandeja del panel (RF-16).
 */
@Component
class OyentePedidos {

    private static final Logger log = LoggerFactory.getLogger(OyentePedidos.class);

    private final CarpinteriasApi carpinterias;
    private final CanalWhatsapp whatsapp;
    private final CanalTiempoReal tiempoReal;
    private final String frontend;
    private final ExecutorService hilos = Executors.newSingleThreadExecutor();
    private final Reintentador reintentador = new Reintentador(3, 2000, OyentePedidos::dormir);

    OyentePedidos(CarpinteriasApi carpinterias, CanalWhatsapp whatsapp, CanalTiempoReal tiempoReal,
            @Value("${viruta.frontend.url}") String frontend) {
        this.carpinterias = carpinterias;
        this.whatsapp = whatsapp;
        this.tiempoReal = tiempoReal;
        this.frontend = frontend;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    void alCrearPedido(PedidoCreado evento) {
        avisar(evento.carpinteriaId(), evento.pedidoId(), "pedido-nuevo",
                "Viruta: tenés un pedido nuevo. Miralo acá: ");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    void alPagarSena(SenaPagada evento) {
        avisar(evento.carpinteriaId(), evento.pedidoId(), "sena-pagada",
                "Viruta: el cliente pagó la seña. Miralo acá: ");
    }

    private void avisar(long carpinteriaId, long pedidoId, String nombreEvento, String texto) {
        DatosCarpinteria taller = carpinterias.porId(carpinteriaId).orElse(null);
        if (taller == null) {
            return;
        }
        tiempoReal.avisar(taller.usuarioId(), nombreEvento, pedidoId);
        String mensaje = texto + frontend + "/panel?pedido=" + pedidoId;
        hilos.submit(() -> {
            boolean enviado = reintentador.ejecutar(() -> whatsapp.enviar(taller.whatsapp(), mensaje));
            if (!enviado) {
                log.warn("No se pudo enviar el aviso de WhatsApp del pedido {}. Queda en el panel.", pedidoId);
            }
        });
    }

    private static void dormir(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @PreDestroy
    void cerrar() {
        hilos.shutdownNow();
    }
}
