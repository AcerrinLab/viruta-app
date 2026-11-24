package com.acerrinlab.viruta.pedidos.interno;

import java.util.List;

import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.PiezaDiseno;
import com.acerrinlab.viruta.diseno.ResultadoDiseno;
import com.acerrinlab.viruta.pedidos.EstadoPedido;

/**
 * Lo que ven el cliente y la carpinteria de un pedido. En las listas viaja solo {@code piezas} (para la
 * miniatura); en el detalle viaja {@code calculo} completo, que ya incluye las piezas.
 */
record VistaPedido(
        long id,
        EstadoPedido estado,
        String creado,
        boolean leido,
        DatosDiseno diseno,
        ResultadoDiseno calculo,
        Presupuesto presupuesto,
        Taller carpinteria,
        Cliente cliente,
        List<PiezaDiseno> piezas) {

    record Presupuesto(long materiales, long manoDeObra, boolean clienteCompraMaterial, Integer plazoDias,
            long total, long sena) {
    }

    /** WhatsApp y direccion llegan en null hasta que el cliente paga la sena (RNF-09). */
    record Taller(long id, String nombre, String zona, String whatsapp, String direccion) {
    }

    record Cliente(String nombre, String telefono) {
    }
}
