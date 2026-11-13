package com.acerrinlab.viruta.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

/** RF-20 y RF-21: N12 y N13 de DOC-06. Los numeros salen de la base de datos. */
class TraccionApiTest extends PruebaApi {

    private long total() throws Exception {
        return numero(obtener("/api/lista-espera/contador", null).andExpect(status().isOk()), "$.total");
    }

    @Test
    void n12_cadaInscripcionSubeElContadorEnUno() throws Exception {
        long antes = total();
        String email = emailUnico("espera");
        publicar("/api/lista-espera", null, "{\"email\":\"" + email + "\",\"tipo\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isOk());
        assertEquals(antes + 1, total());
    }

    @Test
    void inscribirseDosVecesNoInflaElContador() throws Exception {
        String json = "{\"email\":\"" + emailUnico("doble") + "\",\"tipo\":\"CARPINTERIA\",\"consentimiento\":true}";
        publicar("/api/lista-espera", null, json).andExpect(status().isOk());
        long despues = total();
        publicar("/api/lista-espera", null, json).andExpect(status().isOk());
        assertEquals(despues, total());
    }

    @Test
    void laInscripcionExigeEmailValidoYConsentimiento() throws Exception {
        publicar("/api/lista-espera", null, "{\"email\":\"no-es-email\",\"tipo\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isBadRequest());
        publicar("/api/lista-espera", null,
                "{\"email\":\"" + emailUnico("sin") + "\",\"tipo\":\"CLIENTE\",\"consentimiento\":false}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void n13_elAdministradorVeLasMetricasReales() throws Exception {
        String admin = JsonPath.read(cuerpo(publicar("/api/auth/ingreso", null,
                "{\"email\":\"admin@viruta.test\",\"clave\":\"admin12345\"}").andExpect(status().isOk())), "$.token");
        long proyectosAntes = numero(obtener("/api/metricas", admin).andExpect(status().isOk()), "$.proyectos");
        crearProyecto(registrar("CLIENTE"));
        String metricas = cuerpo(obtener("/api/metricas", admin));
        assertEquals(proyectosAntes + 1, ((Number) JsonPath.read(metricas, "$.proyectos")).longValue());
        assertTrue(((Number) JsonPath.read(metricas, "$.usuarios")).longValue() >= 2);
    }
}
