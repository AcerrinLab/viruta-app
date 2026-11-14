package com.acerrinlab.viruta.usuarios.interno;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;

/** Telefonos, codigos de verificacion y la lista de administradores maestros. */
class VerificacionTest {

    @Test
    void normalizaTelefonosArgentinosSinImportarElFormato() {
        assertEquals(Optional.of("3884567890"), Telefonos.normalizar("388 456-7890"));
        assertEquals(Optional.of("3884567890"), Telefonos.normalizar("+54 9 388 456 7890"));
        assertEquals(Optional.of("3884567890"), Telefonos.normalizar("0388 15 4567890"));
        assertEquals(Optional.of("3884567890"), Telefonos.normalizar("5493884567890"));
    }

    @Test
    void rechazaTelefonosQueNoSonValidos() {
        assertTrue(Telefonos.normalizar("123").isEmpty());
        assertTrue(Telefonos.normalizar("hola").isEmpty());
        assertTrue(Telefonos.normalizar(null).isEmpty());
        assertTrue(Telefonos.normalizar("38845678901234").isEmpty());
    }

    @Test
    void ocultaElTelefonoDejandoLosUltimosDigitos() {
        assertEquals("•••• 7890", Telefonos.ocultar("3884567890"));
    }

    @Test
    void losCodigosTienenSeisDigitosYCambian() {
        Set<String> vistos = new HashSet<>();
        for (int i = 0; i < 50; i++) {
            String c = Codigos.nuevo();
            assertTrue(c.matches("\\d{6}"), c);
            vistos.add(c);
        }
        assertTrue(vistos.size() > 40, "los codigos no deberian repetirse tanto");
    }

    @Test
    void comparaCodigosSinFiltrarPorTiempo() {
        String hash = Codigos.huella("123456", "sal");
        assertTrue(Codigos.coincide("123456", "sal", hash));
        assertFalse(Codigos.coincide("654321", "sal", hash));
        assertFalse(Codigos.coincide("123456", "otra", hash));
    }

    @Test
    void leeLaListaDeAdministradoresMaestros() {
        List<ListaAdmins.Admin> admins = ListaAdmins.leer(
                "Maximo Acosta|maxi@viruta.ar|clave-maxi-1; José Manuel Fernández | JOSE@viruta.ar | clave-jose-1");
        assertEquals(2, admins.size());
        assertEquals("José Manuel Fernández", admins.get(1).nombre());
        assertEquals("jose@viruta.ar", admins.get(1).email());
        assertEquals("clave-jose-1", admins.get(1).clave());
    }

    @Test
    void laListaDeAdminsIgnoraEntradasIncompletasOClavesCortas() {
        assertTrue(ListaAdmins.leer("").isEmpty());
        assertTrue(ListaAdmins.leer(null).isEmpty());
        assertEquals(1, ListaAdmins.leer("Sin email||clave-larga-1;Ok|ok@viruta.ar|clave-larga-1;Corta|c@viruta.ar|123").size());
    }

    @Test
    void unAdminSinClavePuedeEntrarSoloConGoogle() {
        List<ListaAdmins.Admin> admins = ListaAdmins.leer("Maximo|maxi@viruta.ar");
        assertEquals(1, admins.size());
        assertEquals("", admins.get(0).clave());
    }
}
