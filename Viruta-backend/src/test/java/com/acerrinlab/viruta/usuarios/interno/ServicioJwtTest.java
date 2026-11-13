package com.acerrinlab.viruta.usuarios.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.Sesion;

/** RNF-08: tokens JWT firmados, con rol y vencimiento. */
class ServicioJwtTest {

    private static final String SECRETO = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres";
    private static final Instant AHORA = Instant.parse("2026-11-13T12:00:00Z");

    private static ServicioJwt servicio(Instant momento) {
        return new ServicioJwt(SECRETO, 24, Clock.fixed(momento, ZoneOffset.UTC));
    }

    @Test
    void unTokenValidoDevuelveElUsuarioYSuRol() {
        String token = servicio(AHORA).generar(42, Rol.CARPINTERIA);
        assertEquals(new Sesion(42, Rol.CARPINTERIA), servicio(AHORA).validar(token).orElseThrow());
    }

    @Test
    void unTokenVencidoSeRechaza() {
        String token = servicio(AHORA).generar(42, Rol.CLIENTE);
        assertTrue(servicio(AHORA.plus(Duration.ofHours(25))).validar(token).isEmpty());
    }

    @Test
    void unTokenAlteradoSeRechaza() {
        String token = servicio(AHORA).generar(42, Rol.CLIENTE);
        String[] partes = token.split("\\.");
        String cuerpoFalso = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"42\",\"rol\":\"ADMIN\",\"exp\":9999999999}".getBytes());
        assertTrue(servicio(AHORA).validar(partes[0] + "." + cuerpoFalso + "." + partes[2]).isEmpty());
    }

    @Test
    void unTokenFirmadoConOtroSecretoSeRechaza() {
        String token = new ServicioJwt("otro-secreto-distinto-con-mas-de-treinta-y-dos-caracteres", 24,
                Clock.fixed(AHORA, ZoneOffset.UTC)).generar(42, Rol.CLIENTE);
        assertTrue(servicio(AHORA).validar(token).isEmpty());
    }

    @Test
    void textosQueNoSonTokensSeRechazan() {
        assertTrue(servicio(AHORA).validar(null).isEmpty());
        assertTrue(servicio(AHORA).validar("").isEmpty());
        assertTrue(servicio(AHORA).validar("a.b").isEmpty());
        assertTrue(servicio(AHORA).validar("a.b.c").isEmpty());
    }

    @Test
    void unSecretoCortoNoSeAcepta() {
        assertThrows(IllegalStateException.class, () -> new ServicioJwt("corto", 24, Clock.systemUTC()));
    }
}
