package com.acerrinlab.viruta.notificaciones.interno;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.acerrinlab.viruta.usuarios.Sesion;

/** Avisos dentro de la app por Server-Sent Events: el panel se actualiza sin recargar (RF-29). */
@RestController
class CanalTiempoReal {

    private final Map<Long, List<SseEmitter>> conexiones = new ConcurrentHashMap<>();

    @GetMapping(path = "/api/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    SseEmitter conectar(@AuthenticationPrincipal Sesion sesion) {
        SseEmitter emisor = new SseEmitter(30 * 60 * 1000L);
        List<SseEmitter> lista = conexiones.computeIfAbsent(sesion.id(), k -> new CopyOnWriteArrayList<>());
        lista.add(emisor);
        Runnable quitar = () -> lista.remove(emisor);
        emisor.onCompletion(quitar);
        emisor.onTimeout(quitar);
        emisor.onError(e -> quitar.run());
        try {
            emisor.send(SseEmitter.event().name("conectado").data("ok"));
        } catch (IOException e) {
            quitar.run();
        }
        return emisor;
    }

    void avisar(long usuarioId, String evento, long pedidoId) {
        List<SseEmitter> lista = conexiones.get(usuarioId);
        if (lista == null) {
            return;
        }
        for (SseEmitter emisor : lista) {
            try {
                emisor.send(SseEmitter.event().name(evento).data(String.valueOf(pedidoId)));
            } catch (IOException | IllegalStateException e) {
                lista.remove(emisor);
            }
        }
    }
}
