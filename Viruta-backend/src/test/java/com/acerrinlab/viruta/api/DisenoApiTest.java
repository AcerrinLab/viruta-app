package com.acerrinlab.viruta.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

/** F1 y F2 por la API: N02, N03, N07, N09, N10 y N11 de DOC-06. */
class DisenoApiTest extends PruebaApi {

    @Test
    void calcularEsPublicoYDevuelvePiezasYMateriales() throws Exception {
        publicar("/api/disenos/calcular", null, ESTANTE)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.piezas", hasSize(5)))
                .andExpect(jsonPath("$.avisos", hasSize(0)))
                .andExpect(jsonPath("$.materiales.placas").value(1))
                .andExpect(jsonPath("$.materiales.tornillos").value(24))
                .andExpect(jsonPath("$.materiales.terminacion").value("No requiere"))
                .andExpect(jsonPath("$.materiales.despiece[?(@.nombre=='Estante')].largo").value(764));
    }

    @Test
    void casoE_avisaSiElMuebleNoEntraEnElEspacio() throws Exception {
        String json = """
                {"plantilla":"ESTANTE","ancho":800,"alto":900,"profundidad":300,"estantes":1,"material":"MELAMINA",
                 "espacioAncho":780,"espacioAlto":1000,"espacioProfAdelante":320,"espacioProfAtras":290}
                """;
        publicar("/api/disenos/calcular", null, json)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avisos", hasSize(3)))
                .andExpect(jsonPath("$.avisos[?(@.eje=='ancho')].diferenciaMm").value(20));
    }

    @Test
    void casoD_unaMedidaFueraDeRangoSeRechazaConElRango() throws Exception {
        String json = "{\"plantilla\":\"ESTANTE\",\"ancho\":0,\"alto\":900,\"profundidad\":300,\"material\":\"MELAMINA\"}";
        publicar("/api/disenos/calcular", null, json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("30 y 240 cm")));
    }

    @Test
    void lasPlantillasSePublicanConSusRangos() throws Exception {
        obtener("/api/plantillas", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].id").value("ESTANTE"))
                .andExpect(jsonPath("$[0].ancho[1]").value(2400));
    }

    @Test
    void unProyectoGuardadoSeReabreConLasMismasMedidasMaterialYColor() throws Exception {
        String cliente = registrar("CLIENTE");
        long id = crearProyecto(cliente);
        obtener("/api/proyectos/" + id, cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.diseno.ancho").value(800))
                .andExpect(jsonPath("$.diseno.material").value("MELAMINA"))
                .andExpect(jsonPath("$.diseno.color").value("NATURAL"))
                .andExpect(jsonPath("$.revision").value(1));
        obtener("/api/proyectos", cliente).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void guardarUnDisenoInvalidoNoPierdeElUltimoValido() throws Exception {
        String cliente = registrar("CLIENTE");
        long id = crearProyecto(cliente);
        String invalido = "{\"plantilla\":\"ESTANTE\",\"ancho\":5000,\"alto\":900,\"profundidad\":300,\"material\":\"MELAMINA\"}";
        reemplazar("/api/proyectos/" + id, cliente, invalido).andExpect(status().isBadRequest());
        obtener("/api/proyectos/" + id, cliente).andExpect(jsonPath("$.diseno.ancho").value(800));
    }

    @Test
    void unClienteNoVeLosProyectosDeOtro() throws Exception {
        long id = crearProyecto(registrar("CLIENTE"));
        obtener("/api/proyectos/" + id, registrar("CLIENTE")).andExpect(status().isNotFound());
    }
}
