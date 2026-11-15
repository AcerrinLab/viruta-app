package com.acerrinlab.viruta.api;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

/** Testimonios de la version de testing y el contador de la lista de espera. */
class ComunidadApiTest extends PruebaApi {

    private String admin() throws Exception {
        return JsonPath.read(cuerpo(publicar("/api/auth/ingreso", null,
                "{\"email\":\"maxi@viruta.test\",\"clave\":\"clave-maxi-1\"}").andExpect(status().isOk())), "$.token");
    }

    private List<String> publicados() throws Exception {
        return JsonPath.read(cuerpo(obtener("/api/testimonios", null).andExpect(status().isOk())), "$[*].texto");
    }

    @Test
    void elComentarioDeUnUsuarioNoSePublicaHastaQueUnAdminLoApruebe() throws Exception {
        String texto = "Pude ver el estante en mi living antes de encargarlo " + System.nanoTime();
        String usuario = registrar("CLIENTE");
        long id = numero(publicar("/api/testimonios", usuario, "{\"texto\":\"" + texto + "\"}").andExpect(status().isOk()), "$.id");
        assertFalse(publicados().contains(texto));
        obtener("/api/testimonios/mio", usuario).andExpect(status().isOk()).andExpect(jsonPath("$.aprobado").value(false));

        enviar(put("/api/admin/testimonios/" + id + "/aprobar"), admin(), null).andExpect(status().isOk());
        assertTrue(publicados().contains(texto));
    }

    @Test
    void elTestimonioMuestraLaFotoDeGoogleDeLaCuenta() throws Exception {
        String acceso = cuerpo(publicar("/api/auth/google", null, "{\"credencial\":\"google:foto-" + System.nanoTime() + ":"
                + emailUnico("foto") + ":Sofia Mamani\",\"rol\":\"CLIENTE\",\"consentimiento\":true}").andExpect(status().isOk()));
        publicar("/api/testimonios", JsonPath.read(acceso, "$.token"), "{\"texto\":\"Me encantó probar el relicario\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fotoUrl").value(org.hamcrest.Matchers.startsWith("https://lh3.googleusercontent.com/")));
    }

    @Test
    void losAdministradoresCarganOcultanYBorranTestimonios() throws Exception {
        String admin = admin();
        String texto = "Las medidas llegaron perfectas al taller " + System.nanoTime();
        long id = numero(publicar("/api/admin/testimonios", admin,
                "{\"nombre\":\"Diego Flores\",\"detalle\":\"Carpintería en Perico\",\"texto\":\"" + texto + "\"}")
                .andExpect(status().isCreated()), "$.id");
        assertTrue(publicados().contains(texto));
        enviar(put("/api/admin/testimonios/" + id + "/ocultar"), admin, null).andExpect(status().isOk());
        assertFalse(publicados().contains(texto));
        enviar(delete("/api/admin/testimonios/" + id), admin, null).andExpect(status().isNoContent());
    }

    @Test
    void sinCuentaNoSePuedeComentarYLosTextosCortosSeRechazan() throws Exception {
        publicar("/api/testimonios", null, "{\"texto\":\"Excelente experiencia con Viruta\"}").andExpect(status().isUnauthorized());
        publicar("/api/testimonios", registrar("CLIENTE"), "{\"texto\":\"bien\"}").andExpect(status().isBadRequest());
    }

    @Test
    void sinPlanillaConfiguradaElContadorUsaLaListaLocal() throws Exception {
        obtener("/api/lista-espera/contador", null).andExpect(status().isOk()).andExpect(jsonPath("$.fuente").value("local"));
    }
}
