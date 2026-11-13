package com.acerrinlab.viruta.api;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


import org.junit.jupiter.api.Test;

import com.jayway.jsonpath.JsonPath;

/** F3 completa: R02 a R16 de DOC-06. */
class PedidosApiTest extends PruebaApi {

    private String carpinteria;
    private String cliente;
    private long taller;
    private long proyecto;

    private long nuevoPedido() throws Exception {
        carpinteria = registrar("CARPINTERIA");
        taller = crearCarpinteria(carpinteria, "Taller " + System.nanoTime(), "[\"MELAMINA\",\"PINO\"]");
        cliente = registrar("CLIENTE");
        proyecto = crearProyecto(cliente);
        return numero(pedir(cliente, proyecto, taller, "clave-" + System.nanoTime()).andExpect(status().isCreated()), "$.id");
    }

    private void pagarSena(long pedido) throws Exception {
        publicar("/api/pagos/simulado/" + pedido + "/aprobar", cliente, null).andExpect(status().isOk());
    }

    @Test
    void r02_unPerfilSinZonaOSinWhatsappNoApareceEnElMapa() throws Exception {
        String token = registrar("CARPINTERIA");
        String nombre = "Taller incompleto " + System.nanoTime();
        reemplazar("/api/carpinteria/perfil", token,
                "{\"nombre\":\"" + nombre + "\",\"zona\":\"SAN_SALVADOR\",\"whatsapp\":\"\",\"materiales\":[\"MELAMINA\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visible").value(false));
        obtener("/api/carpinterias", null).andExpect(jsonPath("$[?(@.nombre=='" + nombre + "')]", hasSize(0)));

        reemplazar("/api/carpinteria/perfil", token,
                "{\"nombre\":\"" + nombre + "\",\"zona\":\"SAN_SALVADOR\",\"whatsapp\":\"3885550101\",\"materiales\":[\"MELAMINA\"]}")
                .andExpect(jsonPath("$.visible").value(true));
        obtener("/api/carpinterias", null).andExpect(jsonPath("$[?(@.nombre=='" + nombre + "')]", hasSize(1)));
    }

    @Test
    void r03_elMapaMuestraSoloCarpinteriasQueTrabajanElMaterialElegido() throws Exception {
        String soloPino = "Solo pino " + System.nanoTime();
        String melamina = "Con melamina " + System.nanoTime();
        crearCarpinteria(registrar("CARPINTERIA"), soloPino, "[\"PINO\"]");
        crearCarpinteria(registrar("CARPINTERIA"), melamina, "[\"MELAMINA\"]");
        obtener("/api/carpinterias?material=MELAMINA", null)
                .andExpect(jsonPath("$[?(@.nombre=='" + melamina + "')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.nombre=='" + soloPino + "')]", hasSize(0)));
    }

    @Test
    void elMapaNoMuestraElWhatsappNiLaDireccion() throws Exception {
        String nombre = "Taller privado " + System.nanoTime();
        crearCarpinteria(registrar("CARPINTERIA"), nombre, "[\"MELAMINA\"]");
        String lista = cuerpo(obtener("/api/carpinterias", null));
        assertTrue(!lista.contains("3885550101") && !lista.contains("Siempre Viva"));
    }

    @Test
    void r04_elPedidoNaceEnPendienteYLaCarpinteriaVeTodosLosDatos() throws Exception {
        long pedido = nuevoPedido();
        obtener("/api/carpinteria/pedidos/" + pedido, carpinteria)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.diseno.ancho").value(800))
                .andExpect(jsonPath("$.diseno.espacioAncho").value(900))
                .andExpect(jsonPath("$.diseno.material").value("MELAMINA"))
                .andExpect(jsonPath("$.diseno.color").value("NATURAL"))
                .andExpect(jsonPath("$.calculo.piezas", hasSize(5)))
                .andExpect(jsonPath("$.calculo.materiales.despiece", hasSize(4)))
                .andExpect(jsonPath("$.calculo.materiales.placas").value(1))
                .andExpect(jsonPath("$.cliente.telefono").value("3885550202"));
    }

    @Test
    void noSePuedePedirAUnaCarpinteriaQueNoTrabajaEseMaterial() throws Exception {
        long soloPino = crearCarpinteria(registrar("CARPINTERIA"), "Pino " + System.nanoTime(), "[\"PINO\"]");
        String otro = registrar("CLIENTE");
        pedir(otro, crearProyecto(otro), soloPino, "clave-material").andExpect(status().isBadRequest());
    }

    @Test
    void r05_editarElProyectoDespuesDeEnviarNoCambiaElPedido() throws Exception {
        long pedido = nuevoPedido();
        String cambiado = ESTANTE.replace("\"ancho\":800", "\"ancho\":1000");
        reemplazar("/api/proyectos/" + proyecto, cliente, cambiado).andExpect(status().isOk());
        obtener("/api/pedidos/" + pedido, cliente)
                .andExpect(jsonPath("$.diseno.ancho").value(800))
                .andExpect(jsonPath("$.calculo.materiales.despiece[?(@.nombre=='Estante')].largo").value(764));
    }

    @Test
    void r06_reintentarConLaMismaClaveDevuelveElMismoPedido() throws Exception {
        carpinteria = registrar("CARPINTERIA");
        taller = crearCarpinteria(carpinteria, "Taller R06 " + System.nanoTime(), "[\"MELAMINA\"]");
        cliente = registrar("CLIENTE");
        proyecto = crearProyecto(cliente);
        long primero = numero(pedir(cliente, proyecto, taller, "misma-clave").andExpect(status().isCreated()), "$.id");
        long segundo = numero(pedir(cliente, proyecto, taller, "misma-clave").andExpect(status().isOk()), "$.id");
        assertEquals(primero, segundo);
        obtener("/api/carpinteria/pedidos", carpinteria).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void r07_laCarpinteriaRecibeElAvisoPorWhatsappConElEnlaceAlPedido() throws Exception {
        long pedido = nuevoPedido();
        String enlace = "/panel?pedido=" + pedido;
        long limite = System.currentTimeMillis() + 5000;
        while (CanalDePrueba.MENSAJES.stream().noneMatch(m -> m.contains(enlace)) && System.currentTimeMillis() < limite) {
            Thread.sleep(50);
        }
        assertTrue(CanalDePrueba.MENSAJES.stream().anyMatch(m -> m.startsWith("3885550101") && m.contains(enlace)));
    }

    @Test
    void r09_elPresupuestoSeparaMaterialesYManoDeObra() throws Exception {
        long pedido = nuevoPedido();
        presupuestar(carpinteria, pedido)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PRESUPUESTADO"));
        obtener("/api/pedidos/" + pedido, cliente)
                .andExpect(jsonPath("$.presupuesto.materiales").value(118000))
                .andExpect(jsonPath("$.presupuesto.manoDeObra").value(145000))
                .andExpect(jsonPath("$.presupuesto.total").value(263000))
                .andExpect(jsonPath("$.presupuesto.sena").value(131500));
    }

    @Test
    void siElClienteCompraElMaterialElTotalEsSoloLaManoDeObra() throws Exception {
        long pedido = nuevoPedido();
        publicar("/api/carpinteria/pedidos/" + pedido + "/presupuesto", carpinteria,
                "{\"materiales\":118000,\"manoDeObra\":145000,\"clienteCompraMaterial\":true}")
                .andExpect(jsonPath("$.presupuesto.total").value(145000))
                .andExpect(jsonPath("$.presupuesto.sena").value(72500));
    }

    @Test
    void r10_elPedidoPasaAAceptadoSoloCuandoSeConfirmaElPago() throws Exception {
        long pedido = nuevoPedido();
        presupuestar(carpinteria, pedido);
        publicar("/api/pagos/pedidos/" + pedido + "/iniciar", cliente, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.urlPago").exists());
        obtener("/api/pedidos/" + pedido, cliente).andExpect(jsonPath("$.estado").value("PRESUPUESTADO"));

        pagarSena(pedido);
        obtener("/api/pedidos/" + pedido, cliente).andExpect(jsonPath("$.estado").value("ACEPTADO"));
    }

    @Test
    void noSePuedePagarUnPedidoSinPresupuesto() throws Exception {
        long pedido = nuevoPedido();
        publicar("/api/pagos/pedidos/" + pedido + "/iniciar", cliente, null).andExpect(status().isConflict());
        publicar("/api/pagos/simulado/" + pedido + "/aprobar", cliente, null).andExpect(status().isConflict());
    }

    @Test
    void r11_unAvisoDePagoConFirmaInvalidaSeRechazaYElPedidoNoCambia() throws Exception {
        long pedido = nuevoPedido();
        presupuestar(carpinteria, pedido);
        mvc.perform(post("/api/pagos/webhook?data.id=123")
                .header("x-signature", "ts=1700000000,v1=firma-falsa")
                .header("x-request-id", "req-1"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/pagos/webhook?data.id=123")).andExpect(status().isUnauthorized());
        obtener("/api/pedidos/" + pedido, cliente).andExpect(jsonPath("$.estado").value("PRESUPUESTADO"));
    }

    @Test
    void laDireccionDelTallerSeVeRecienAlPagarLaSena() throws Exception {
        long pedido = nuevoPedido();
        presupuestar(carpinteria, pedido);
        obtener("/api/pedidos/" + pedido, cliente)
                .andExpect(jsonPath("$.carpinteria.direccion").value(nullValue()))
                .andExpect(jsonPath("$.carpinteria.whatsapp").value(nullValue()));
        pagarSena(pedido);
        obtener("/api/pedidos/" + pedido, cliente)
                .andExpect(jsonPath("$.carpinteria.direccion").value("Av. Siempre Viva 742"))
                .andExpect(jsonPath("$.carpinteria.whatsapp").value("3885550101"));
    }

    @Test
    void r12_losEstadosDeFabricacionSoloAvanzanEnOrden() throws Exception {
        long pedido = nuevoPedido();
        marcar(carpinteria, pedido, "MEDIDAS_VERIFICADAS").andExpect(status().isConflict());
        presupuestar(carpinteria, pedido);
        pagarSena(pedido);

        marcar(carpinteria, pedido, "EN_FABRICACION").andExpect(status().isConflict());
        marcar(carpinteria, pedido, "ENTREGADO").andExpect(status().isConflict());
        marcar(carpinteria, pedido, "ACEPTADO").andExpect(status().isBadRequest());

        marcar(carpinteria, pedido, "MEDIDAS_VERIFICADAS").andExpect(status().isOk());
        marcar(carpinteria, pedido, "EN_FABRICACION").andExpect(status().isOk());
        marcar(carpinteria, pedido, "ENTREGADO").andExpect(jsonPath("$.estado").value("ENTREGADO"));
        obtener("/api/pedidos/" + pedido, cliente).andExpect(jsonPath("$.estado").value("ENTREGADO"));
    }

    @Test
    void r12_otraCarpinteriaNoPuedeCambiarElEstado() throws Exception {
        long pedido = nuevoPedido();
        presupuestar(carpinteria, pedido);
        pagarSena(pedido);
        String otra = registrar("CARPINTERIA");
        crearCarpinteria(otra, "Otro taller " + System.nanoTime(), "[\"MELAMINA\"]");
        marcar(otra, pedido, "MEDIDAS_VERIFICADAS").andExpect(status().isForbidden());
        presupuestar(otra, pedido).andExpect(status().isForbidden());
    }

    @Test
    void elClientePuedeRechazarUnPresupuesto() throws Exception {
        long pedido = nuevoPedido();
        publicar("/api/pedidos/" + pedido + "/rechazar", cliente, null).andExpect(status().isConflict());
        presupuestar(carpinteria, pedido);
        publicar("/api/pedidos/" + pedido + "/rechazar", cliente, null)
                .andExpect(jsonPath("$.estado").value("RECHAZADO"));
    }

    @Test
    void r13_enLaBandejaLosPedidosNuevosVanPrimeroYSinLeer() throws Exception {
        long primero = nuevoPedido();
        obtener("/api/carpinteria/pedidos/" + primero, carpinteria).andExpect(jsonPath("$.leido").value(true));
        long segundo = numero(pedir(cliente, proyecto, taller, "segunda-clave").andExpect(status().isCreated()), "$.id");

        String bandeja = cuerpo(obtener("/api/carpinteria/pedidos", carpinteria));
        assertEquals(segundo, ((Number) JsonPath.read(bandeja, "$[0].id")).longValue());
        assertEquals(false, JsonPath.<Boolean>read(bandeja, "$[0].leido"));
        assertEquals(primero, ((Number) JsonPath.read(bandeja, "$[1].id")).longValue());

        obtener("/api/carpinteria/pedidos?estados=PRESUPUESTADO", carpinteria).andExpect(jsonPath("$", hasSize(0)));
        obtener("/api/carpinteria/pedidos?estados=PENDIENTE", carpinteria).andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void r16_elResumenCoincideConLosPagosConfirmadosYLaComision() throws Exception {
        long pedido = nuevoPedido();
        obtener("/api/carpinteria/resumen", carpinteria).andExpect(jsonPath("$.trabajos").value(0));
        presupuestar(carpinteria, pedido);
        pagarSena(pedido);
        pagarSena(pedido);
        obtener("/api/carpinteria/resumen", carpinteria)
                .andExpect(jsonPath("$.trabajos").value(1))
                .andExpect(jsonPath("$.senasCobradas").value(131500))
                .andExpect(jsonPath("$.comision").value(26300));
    }
}
