package com.acerrinlab.viruta.api;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;

/** Canal de WhatsApp de prueba: guarda los mensajes en lugar de enviarlos. */
@TestConfiguration
class CanalDePrueba {

    static final List<String> MENSAJES = new CopyOnWriteArrayList<>();

    @Bean
    @Primary
    CanalWhatsapp canalWhatsappDePrueba() {
        return (telefono, mensaje) -> MENSAJES.add(telefono + " | " + mensaje);
    }
}
