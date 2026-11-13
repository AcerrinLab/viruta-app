package com.acerrinlab.viruta.api;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

/** Base de las pruebas de la API: levanta la aplicacion completa con una base H2 en memoria. */
@SpringBootTest
@ActiveProfiles("test")
@Import(CanalDePrueba.class)
abstract class PruebaApi {

    private static final AtomicInteger SECUENCIA = new AtomicInteger();

    /** Caso A de DOC-06 en melamina. */
    static final String ESTANTE = """
            {"nombre":"Estante del living","plantilla":"ESTANTE","ancho":800,"alto":900,"profundidad":300,
             "estantes":1,"material":"MELAMINA","color":"NATURAL",
             "espacioAncho":900,"espacioAlto":1000,"espacioProfAdelante":320,"espacioProfAtras":320}
            """;

    @Autowired
    WebApplicationContext contexto;

    MockMvc mvc;

    @BeforeEach
    void prepararMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
    }

    static String emailUnico(String prefijo) {
        return prefijo + SECUENCIA.incrementAndGet() + "-" + System.nanoTime() + "@viruta.test";
    }

    ResultActions enviar(MockHttpServletRequestBuilder peticion, String token, String cuerpo) throws Exception {
        if (token != null) {
            peticion.header("Authorization", "Bearer " + token);
        }
        if (cuerpo != null) {
            peticion.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
        }
        return mvc.perform(peticion);
    }

    ResultActions obtener(String url, String token) throws Exception {
        return enviar(get(url), token, null);
    }

    ResultActions publicar(String url, String token, String cuerpo) throws Exception {
        return enviar(post(url), token, cuerpo);
    }

    ResultActions reemplazar(String url, String token, String cuerpo) throws Exception {
        return enviar(put(url), token, cuerpo);
    }

    static String cuerpo(ResultActions resultado) throws Exception {
        return resultado.andReturn().getResponse().getContentAsString();
    }

    static long numero(ResultActions resultado, String ruta) throws Exception {
        return ((Number) JsonPath.read(cuerpo(resultado), ruta)).longValue();
    }

    /** Registra un usuario nuevo y devuelve su token. */
    String registrar(String rol) throws Exception {
        String json = """
                {"nombre":"Persona de prueba","email":"%s","clave":"clave-segura-1","rol":"%s","consentimiento":true}
                """.formatted(emailUnico(rol.toLowerCase()), rol);
        return JsonPath.read(cuerpo(publicar("/api/auth/registro", null, json).andExpect(status().isCreated())), "$.token");
    }

    /** Crea una carpinteria con perfil completo y devuelve su id publico. */
    long crearCarpinteria(String token, String nombre, String materiales) throws Exception {
        String json = """
                {"nombre":"%s","zona":"SAN_SALVADOR","whatsapp":"388 555-0101","direccion":"Av. Siempre Viva 742",
                 "materiales":%s}
                """.formatted(nombre, materiales);
        reemplazar("/api/carpinteria/perfil", token, json).andExpect(status().isOk());
        String lista = cuerpo(obtener("/api/carpinterias", null));
        return ((Number) JsonPath.<java.util.List<Object>>read(lista, "$[?(@.nombre=='" + nombre + "')].id").get(0)).longValue();
    }

    long crearProyecto(String token) throws Exception {
        return numero(publicar("/api/proyectos", token, ESTANTE).andExpect(status().isCreated()), "$.id");
    }

    ResultActions pedir(String token, long proyecto, long carpinteria, String clave) throws Exception {
        String json = """
                {"proyectoId":%d,"carpinteriaId":%d,"claveEnvio":"%s","telefono":"3885550202","consentimiento":true}
                """.formatted(proyecto, carpinteria, clave);
        return publicar("/api/pedidos", token, json);
    }

    ResultActions presupuestar(String tokenCarpinteria, long pedido) throws Exception {
        return publicar("/api/carpinteria/pedidos/" + pedido + "/presupuesto", tokenCarpinteria,
                "{\"materiales\":118000,\"manoDeObra\":145000,\"clienteCompraMaterial\":false,\"plazoDias\":12}");
    }

    ResultActions marcar(String tokenCarpinteria, long pedido, String estado) throws Exception {
        return publicar("/api/carpinteria/pedidos/" + pedido + "/estado", tokenCarpinteria, "{\"estado\":\"" + estado + "\"}");
    }
}
