package com.acerrinlab.viruta.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

/** Ingreso con Google, verificacion de telefono, registro de inicios de sesion y administradores maestros. */
class CuentasApiTest extends PruebaApi {

    private static final Pattern CODIGO = Pattern.compile("código de verificación es (\\d{6})");

    private String google(String credencial, String rol) throws Exception {
        String cuerpo = rol == null ? "{\"credencial\":\"" + credencial + "\"}"
                : "{\"credencial\":\"" + credencial + "\",\"rol\":\"" + rol + "\",\"consentimiento\":true}";
        return cuerpo(publicar("/api/auth/google", null, cuerpo).andExpect(status().isOk()));
    }

    private String ultimoCodigoPara(String telefono) {
        List<String> mensajes = CanalDePrueba.MENSAJES;
        for (int i = mensajes.size() - 1; i >= 0; i--) {
            if (mensajes.get(i).startsWith(telefono + " | ")) {
                Matcher m = CODIGO.matcher(mensajes.get(i));
                if (m.find()) {
                    return m.group(1);
                }
            }
        }
        throw new AssertionError("No llego el codigo a " + telefono);
    }

    @Test
    void elBotonDeGoogleApareceCuandoEstaConfigurado() throws Exception {
        obtener("/api/auth/opciones", null).andExpect(status().isOk()).andExpect(jsonPath("$.google").value(true));
    }

    @Test
    void conGoogleSeCreaLaCuentaConSuFoto() throws Exception {
        String email = emailUnico("google");
        String acceso = google("google:g-" + System.nanoTime() + ":" + email + ":Valentina Morales", "CLIENTE");
        assertEquals("CLIENTE", JsonPath.read(acceso, "$.rol"));
        assertEquals("Valentina Morales", JsonPath.read(acceso, "$.nombre"));
        assertTrue(((String) JsonPath.read(acceso, "$.fotoUrl")).startsWith("https://lh3.googleusercontent.com/"));
        String token = JsonPath.read(acceso, "$.token");
        obtener("/api/usuarios/yo", token).andExpect(status().isOk()).andExpect(jsonPath("$.conGoogle").value(true))
                .andExpect(jsonPath("$.conClave").value(false));
    }

    @Test
    void conGoogleSeVinculaUnaCuentaQueYaExistia() throws Exception {
        String email = emailUnico("vincular");
        publicar("/api/auth/registro", null, """
                {"nombre":"Lucas Quispe","email":"%s","clave":"clave-segura-1","rol":"CARPINTERIA","consentimiento":true}
                """.formatted(email)).andExpect(status().isCreated());
        String acceso = google("google:v-" + System.nanoTime() + ":" + email + ":Lucas Q", null);
        assertEquals("CARPINTERIA", JsonPath.read(acceso, "$.rol"));
        assertEquals("Lucas Quispe", JsonPath.read(acceso, "$.nombre"));
    }

    @Test
    void googleRechazaCredencialesFalsasYEmailsSinVerificar() throws Exception {
        publicar("/api/auth/google", null, "{\"credencial\":\"inventada\",\"rol\":\"CLIENTE\",\"consentimiento\":true}")
                .andExpect(status().isUnauthorized());
        publicar("/api/auth/google", null, "{\"credencial\":\"google-sin-verificar:x1:" + emailUnico("nv")
                + ":Nadie\",\"rol\":\"CLIENTE\",\"consentimiento\":true}").andExpect(status().isUnauthorized());
    }

    @Test
    void unaCuentaNuevaConGoogleTieneQueElegirRolYDarConsentimiento() throws Exception {
        publicar("/api/auth/google", null, "{\"credencial\":\"google:n-" + System.nanoTime() + ":" + emailUnico("sinrol")
                + ":Sin Rol\"}").andExpect(status().isBadRequest());
    }

    @Test
    void losAdministradoresMaestrosEntranConClaveOConGoogle() throws Exception {
        String maxi = JsonPath.read(cuerpo(publicar("/api/auth/ingreso", null,
                "{\"email\":\"maxi@viruta.test\",\"clave\":\"clave-maxi-1\"}").andExpect(status().isOk())), "$.token");
        obtener("/api/admin/usuarios", maxi).andExpect(status().isOk());
        String jose = google("google:jose-g:jose@viruta.test:Jose Manuel", null);
        assertEquals("ADMIN", JsonPath.read(jose, "$.rol"));
        obtener("/api/admin/pedidos", JsonPath.read(jose, "$.token")).andExpect(status().isOk());
    }

    @Test
    void soloLosAdministradoresVenElPanel() throws Exception {
        String cliente = registrar("CLIENTE");
        obtener("/api/admin/usuarios", cliente).andExpect(status().isForbidden());
        obtener("/api/admin/pedidos", cliente).andExpect(status().isForbidden());
        obtener("/api/admin/testimonios", cliente).andExpect(status().isForbidden());
        obtener("/api/admin/usuarios", null).andExpect(status().isUnauthorized());
    }

    @Test
    void elTelefonoSeVerificaConElCodigoQueLlegaPorWhatsapp() throws Exception {
        String token = registrar("CLIENTE");
        publicar("/api/usuarios/yo/telefono", token, "{\"telefono\":\"+54 9 388 411-2233\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.telefono").value("•••• 2233"));
        String codigo = ultimoCodigoPara("3884112233");
        publicar("/api/usuarios/yo/telefono/confirmar", token, "{\"codigo\":\"" + codigo + "\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.telefonoVerificado").value(true))
                .andExpect(jsonPath("$.telefono").value("3884112233"));
    }

    @Test
    void unCodigoEquivocadoNoVerificaYAlQuintoIntentoSeAnula() throws Exception {
        String token = registrar("CLIENTE");
        publicar("/api/usuarios/yo/telefono", token, "{\"telefono\":\"388 422-3344\"}").andExpect(status().isOk());
        String correcto = ultimoCodigoPara("3884223344");
        String malo = correcto.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < 5; i++) {
            publicar("/api/usuarios/yo/telefono/confirmar", token, "{\"codigo\":\"" + malo + "\"}")
                    .andExpect(status().isBadRequest());
        }
        publicar("/api/usuarios/yo/telefono/confirmar", token, "{\"codigo\":\"" + correcto + "\"}")
                .andExpect(status().isTooManyRequests());
        obtener("/api/usuarios/yo", token).andExpect(jsonPath("$.telefonoVerificado").value(false));
    }

    @Test
    void noSePuedePedirOtroCodigoEnseguida() throws Exception {
        String token = registrar("CLIENTE");
        publicar("/api/usuarios/yo/telefono", token, "{\"telefono\":\"388 433-4455\"}").andExpect(status().isOk());
        publicar("/api/usuarios/yo/telefono", token, "{\"telefono\":\"388 433-4455\"}").andExpect(status().isTooManyRequests());
    }

    @Test
    void unTelefonoInvalidoSeRechaza() throws Exception {
        publicar("/api/usuarios/yo/telefono", registrar("CLIENTE"), "{\"telefono\":\"123\"}").andExpect(status().isBadRequest());
    }

    @Test
    void cadaInicioDeSesionQuedaRegistradoYSeAvisaSiEsDeUnDispositivoNuevo() throws Exception {
        String email = emailUnico("ingresos");
        String token = JsonPath.read(cuerpo(publicar("/api/auth/registro", null, """
                {"nombre":"Ana Cruz","email":"%s","clave":"clave-segura-1","rol":"CLIENTE","consentimiento":true}
                """.formatted(email)).andExpect(status().isCreated())), "$.token");
        // Verifica el telefono para recibir avisos.
        publicar("/api/usuarios/yo/telefono", token, "{\"telefono\":\"388 455-6677\"}").andExpect(status().isOk());
        publicar("/api/usuarios/yo/telefono/confirmar", token, "{\"codigo\":\"" + ultimoCodigoPara("3884556677") + "\"}")
                .andExpect(status().isOk());

        String ingreso = "{\"email\":\"" + email + "\",\"clave\":\"clave-segura-1\"}";
        mvc.perform(post("/api/auth/ingreso").contentType("application/json").content(ingreso)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0) Chrome/130")).andExpect(status().isOk());
        int antes = CanalDePrueba.MENSAJES.size();
        mvc.perform(post("/api/auth/ingreso").contentType("application/json").content(ingreso)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) Chrome/130")).andExpect(status().isOk());
        assertTrue(CanalDePrueba.MENSAJES.subList(antes, CanalDePrueba.MENSAJES.size()).stream()
                .anyMatch(m -> m.startsWith("3884556677 | ") && m.contains("dispositivo nuevo") && m.contains("Android")));

        publicar("/api/auth/ingreso", null, "{\"email\":\"" + email + "\",\"clave\":\"incorrecta\"}")
                .andExpect(status().isUnauthorized());
        String lista = cuerpo(obtener("/api/usuarios/yo/ingresos", token).andExpect(status().isOk()));
        List<Boolean> exitos = JsonPath.read(lista, "$[*].exitoso");
        assertTrue(exitos.size() >= 3);
        assertFalse(exitos.get(0), "el ultimo intento fue fallido");
    }
}
