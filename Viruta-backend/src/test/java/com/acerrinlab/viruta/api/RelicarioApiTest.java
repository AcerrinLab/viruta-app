package com.acerrinlab.viruta.api;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

/** Un relicario se puede guardar como proyecto y pedirse a una carpinteria, igual que los clasicos. */
class RelicarioApiTest extends PruebaApi {

    private static final String RELICARIO = """
            {"nombre":"Relicario del comedor","plantilla":"RELICARIO","ancho":900,"alto":1700,"profundidad":400,
             "estantes":3,"material":"PINO","color":"NOGAL"}
            """;

    @Test
    void seGuardaYSePideUnRelicario() throws Exception {
        String cliente = registrar("CLIENTE");
        long proyecto = numero(publicar("/api/proyectos", cliente, RELICARIO).andExpect(status().isCreated()), "$.id");
        obtener("/api/proyectos/" + proyecto, cliente).andExpect(status().isOk())
                .andExpect(jsonPath("$.diseno.plantilla").value("RELICARIO"));

        long taller = crearCarpinteria(registrar("CARPINTERIA"), "Taller Antiguo " + System.nanoTime(), "[\"PINO\"]");
        pedir(cliente, proyecto, taller, "relicario-" + System.nanoTime()).andExpect(status().isCreated())
                .andExpect(jsonPath("$.diseno.plantilla").value("RELICARIO"));
    }
}
