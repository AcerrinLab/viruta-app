package com.acerrinlab.viruta.api;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

/** RF-12 y RNF-08: R01 y R17 de DOC-06. */
class SeguridadApiTest extends PruebaApi {

    @Test
    void sinTokenNoSeEntraALasPantallasPrivadas() throws Exception {
        obtener("/api/proyectos", null).andExpect(status().isUnauthorized());
        obtener("/api/carpinteria/pedidos", null).andExpect(status().isUnauthorized());
        obtener("/api/metricas", null).andExpect(status().isUnauthorized());
    }

    @Test
    void conUnTokenInventadoTampoco() throws Exception {
        obtener("/api/proyectos", "esto.no-es.un-token").andExpect(status().isUnauthorized());
    }

    @Test
    void r01_unClienteNoPuedeEntrarALaBandejaDeUnaCarpinteria() throws Exception {
        String cliente = registrar("CLIENTE");
        obtener("/api/carpinteria/pedidos", cliente).andExpect(status().isForbidden());
        obtener("/api/carpinteria/resumen", cliente).andExpect(status().isForbidden());
    }

    @Test
    void unaCarpinteriaNoPuedeEntrarALasPantallasDelCliente() throws Exception {
        String carpinteria = registrar("CARPINTERIA");
        obtener("/api/proyectos", carpinteria).andExpect(status().isForbidden());
        obtener("/api/pedidos", carpinteria).andExpect(status().isForbidden());
    }

    @Test
    void soloElAdministradorVeLasMetricas() throws Exception {
        obtener("/api/metricas", registrar("CLIENTE")).andExpect(status().isForbidden());
    }

    @Test
    void elRegistroExigeConsentimientoEmailValidoYClaveLarga() throws Exception {
        publicar("/api/auth/registro", null,
                "{\"nombre\":\"Ana\",\"email\":\"" + emailUnico("a") + "\",\"clave\":\"clave-segura-1\",\"rol\":\"CLIENTE\",\"consentimiento\":false}")
                .andExpect(status().isBadRequest());
        publicar("/api/auth/registro", null,
                "{\"nombre\":\"Ana\",\"email\":\"sin-arroba\",\"clave\":\"clave-segura-1\",\"rol\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isBadRequest());
        publicar("/api/auth/registro", null,
                "{\"nombre\":\"Ana\",\"email\":\"" + emailUnico("a") + "\",\"clave\":\"corta\",\"rol\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void nadieSePuedeRegistrarComoAdministrador() throws Exception {
        publicar("/api/auth/registro", null,
                "{\"nombre\":\"Ana\",\"email\":\"" + emailUnico("a") + "\",\"clave\":\"clave-segura-1\",\"rol\":\"ADMIN\",\"consentimiento\":true}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void noSePuedeRegistrarDosVecesElMismoEmail() throws Exception {
        String email = emailUnico("repetido");
        String json = "{\"nombre\":\"Ana\",\"email\":\"" + email + "\",\"clave\":\"clave-segura-1\",\"rol\":\"CLIENTE\",\"consentimiento\":true}";
        publicar("/api/auth/registro", null, json).andExpect(status().isCreated());
        publicar("/api/auth/registro", null, json).andExpect(status().isConflict());
    }

    @Test
    void elIngresoFuncionaConLaClaveCorrectaYFallaConOtra() throws Exception {
        String email = emailUnico("ingreso");
        publicar("/api/auth/registro", null,
                "{\"nombre\":\"Ana\",\"email\":\"" + email + "\",\"clave\":\"clave-segura-1\",\"rol\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isCreated());
        publicar("/api/auth/ingreso", null, "{\"email\":\"" + email + "\",\"clave\":\"clave-segura-1\"}")
                .andExpect(status().isOk());
        publicar("/api/auth/ingreso", null, "{\"email\":\"" + email + "\",\"clave\":\"otra-clave-99\"}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void elIngresoSeBloqueaDespuesDeCincoIntentosSeguidos() throws Exception {
        String json = "{\"email\":\"" + emailUnico("fuerza") + "\",\"clave\":\"no-es-la-clave\"}";
        for (int i = 0; i < 5; i++) {
            publicar("/api/auth/ingreso", null, json).andExpect(status().isUnauthorized());
        }
        publicar("/api/auth/ingreso", null, json).andExpect(status().isTooManyRequests());
    }

    @Test
    void r17_conocerElNumeroDeUnPedidoAjenoNoAlcanzaParaVerlo() throws Exception {
        String carpinteria = registrar("CARPINTERIA");
        long taller = crearCarpinteria(carpinteria, "Taller R17 " + System.nanoTime(), "[\"MELAMINA\"]");
        String duena = registrar("CLIENTE");
        long pedido = numero(pedir(duena, crearProyecto(duena), taller, "clave-r17").andExpect(status().isCreated()), "$.id");

        obtener("/api/pedidos/" + pedido, registrar("CLIENTE")).andExpect(status().isForbidden());

        String otraCarpinteria = registrar("CARPINTERIA");
        crearCarpinteria(otraCarpinteria, "Otro taller R17 " + System.nanoTime(), "[\"MELAMINA\"]");
        obtener("/api/carpinteria/pedidos/" + pedido, otraCarpinteria).andExpect(status().isForbidden());
    }
}
