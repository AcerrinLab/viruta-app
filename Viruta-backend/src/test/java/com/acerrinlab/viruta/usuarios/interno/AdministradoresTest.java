package com.acerrinlab.viruta.usuarios.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;
import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.VerificadorGoogle;

/**
 * Al ascender a administrador una cuenta que ya existia, la clave que eligio quien la registro no se
 * conserva: nadie verifico que fuera el dueno del email.
 */
class AdministradoresTest {

    private final PasswordEncoder codificador = new BCryptPasswordEncoder(4);
    private final RepositorioUsuarios usuarios = mock(RepositorioUsuarios.class);

    private Usuario cuentaPrevia(String email) {
        Usuario u = new Usuario();
        u.id = 7L;
        u.email = email;
        u.nombre = "Registrada antes";
        u.rol = Rol.CLIENTE;
        u.activo = true;
        u.clave = codificador.encode("clave-del-intruso");
        when(usuarios.findByEmail(email)).thenReturn(Optional.of(u));
        when(usuarios.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));
        return u;
    }

    private ServicioUsuarios servicio(String admins) {
        Clock reloj = Clock.fixed(Instant.parse("2026-11-15T12:00:00Z"), ZoneOffset.UTC);
        return new ServicioUsuarios(usuarios, mock(RepositorioIngresos.class), mock(RepositorioCodigos.class), codificador,
                new ServicioJwt("secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres", 24, reloj), reloj,
                mock(VerificadorGoogle.class), mock(CanalWhatsapp.class), "", "", admins);
    }

    @Test
    void conClaveConfiguradaSeReemplazaLaQueHabiaPuestoOtraPersona() {
        Usuario u = cuentaPrevia("ana@viruta.test");
        servicio("Ana|ana@viruta.test|clave-de-ana-1").run();
        assertEquals(Rol.ADMIN, u.rol);
        assertTrue(codificador.matches("clave-de-ana-1", u.clave));
        assertFalse(codificador.matches("clave-del-intruso", u.clave));
    }

    @Test
    void sinClaveConfiguradaQuedaSoloConGoogle() {
        Usuario u = cuentaPrevia("beto@viruta.test");
        servicio("Beto|beto@viruta.test").run();
        assertEquals(Rol.ADMIN, u.rol);
        assertEquals("", u.clave);
    }

    @Test
    void siCambianLaClaveConfiguradaElAdminExistenteLaToma() {
        Usuario u = cuentaPrevia("admin@viruta.test");
        u.rol = Rol.ADMIN;
        u.clave = codificador.encode("clave-vieja-123");
        servicio("Admin|admin@viruta.test|clave-nueva-456").run();
        assertTrue(codificador.matches("clave-nueva-456", u.clave));
        assertFalse(codificador.matches("clave-vieja-123", u.clave));
    }

    @Test
    void unAdminSinClaveConfiguradaConservaLaSuya() {
        Usuario u = cuentaPrevia("google@viruta.test");
        u.rol = Rol.ADMIN;
        u.clave = codificador.encode("clave-propia-789");
        servicio("Solo Google|google@viruta.test").run();
        assertTrue(codificador.matches("clave-propia-789", u.clave));
    }
}
