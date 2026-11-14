package com.acerrinlab.viruta.api;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;
import com.acerrinlab.viruta.usuarios.PerfilGoogle;
import com.acerrinlab.viruta.usuarios.VerificadorGoogle;

/** Dobles de prueba: WhatsApp guarda los mensajes y Google acepta credenciales con formato conocido. */
@TestConfiguration
class CanalDePrueba {

    static final List<String> MENSAJES = new CopyOnWriteArrayList<>();

    @Bean
    @Primary
    CanalWhatsapp canalWhatsappDePrueba() {
        return (telefono, mensaje) -> MENSAJES.add(telefono + " | " + mensaje);
    }

    /**
     * "google:{id}:{email}:{nombre}" es una credencial valida con email verificado;
     * "google-sin-verificar:{id}:{email}:{nombre}" tiene el email sin verificar; cualquier otra es falsa.
     */
    @Bean
    @Primary
    VerificadorGoogle verificadorGoogleDePrueba() {
        return new VerificadorGoogle() {
            @Override
            public boolean disponible() {
                return true;
            }

            @Override
            public Optional<PerfilGoogle> verificar(String credencial) {
                if (credencial == null) {
                    return Optional.empty();
                }
                String[] p = credencial.split(":");
                if (p.length != 4 || !(p[0].equals("google") || p[0].equals("google-sin-verificar"))) {
                    return Optional.empty();
                }
                return Optional.of(new PerfilGoogle(p[1], p[2], p[0].equals("google"), p[3],
                        "https://lh3.googleusercontent.com/a/" + p[1]));
            }
        };
    }
}
