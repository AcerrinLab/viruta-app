package com.acerrinlab.viruta.pedidos;

import static com.acerrinlab.viruta.pedidos.EstadoPedido.ACEPTADO;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.CANCELADO;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.ENTREGADO;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.EN_FABRICACION;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.MEDIDAS_VERIFICADAS;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.PENDIENTE;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.PRESUPUESTADO;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.RECHAZADO;
import static com.acerrinlab.viruta.pedidos.EstadoPedido.VENCIDO;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/** Maquina de estados de DOC-02A (RF-19). */
class EstadoPedidoTest {

    @Test
    void elRecorridoNormalAvanzaEnOrden() {
        assertTrue(PENDIENTE.puedePasarA(PRESUPUESTADO));
        assertTrue(PRESUPUESTADO.puedePasarA(ACEPTADO));
        assertTrue(ACEPTADO.puedePasarA(MEDIDAS_VERIFICADAS));
        assertTrue(MEDIDAS_VERIFICADAS.puedePasarA(EN_FABRICACION));
        assertTrue(EN_FABRICACION.puedePasarA(ENTREGADO));
    }

    @Test
    void noSePuedenSaltarPasos() {
        assertFalse(PENDIENTE.puedePasarA(ACEPTADO));
        assertFalse(ACEPTADO.puedePasarA(EN_FABRICACION));
        assertFalse(ACEPTADO.puedePasarA(ENTREGADO));
        assertFalse(MEDIDAS_VERIFICADAS.puedePasarA(ENTREGADO));
        assertFalse(EN_FABRICACION.puedePasarA(MEDIDAS_VERIFICADAS));
    }

    @Test
    void soloPendienteYPresupuestadoPuedenVencer() {
        assertTrue(PENDIENTE.puedePasarA(VENCIDO));
        assertTrue(PRESUPUESTADO.puedePasarA(VENCIDO));
        assertFalse(ACEPTADO.puedePasarA(VENCIDO));
    }

    @Test
    void soloUnPresupuestoSePuedeRechazar() {
        assertTrue(PRESUPUESTADO.puedePasarA(RECHAZADO));
        assertFalse(PENDIENTE.puedePasarA(RECHAZADO));
        assertFalse(ACEPTADO.puedePasarA(RECHAZADO));
    }

    @Test
    void seCancelaDesdeCualquierEstadoAnteriorAEntregado() {
        for (EstadoPedido e : new EstadoPedido[] { PENDIENTE, PRESUPUESTADO, ACEPTADO, MEDIDAS_VERIFICADAS, EN_FABRICACION }) {
            assertTrue(e.puedePasarA(CANCELADO), e.name());
        }
        assertFalse(ENTREGADO.puedePasarA(CANCELADO));
    }

    @Test
    void losEstadosFinalesNoCambian() {
        for (EstadoPedido fin : new EstadoPedido[] { ENTREGADO, RECHAZADO, VENCIDO, CANCELADO }) {
            for (EstadoPedido otro : EstadoPedido.values()) {
                assertFalse(fin.puedePasarA(otro), fin + " -> " + otro);
            }
        }
    }

    @Test
    void laCarpinteriaSoloMarcaLosEstadosDeFabricacion() {
        assertTrue(MEDIDAS_VERIFICADAS.esDeFabricacion());
        assertTrue(EN_FABRICACION.esDeFabricacion());
        assertTrue(ENTREGADO.esDeFabricacion());
        assertFalse(ACEPTADO.esDeFabricacion());
        assertFalse(PRESUPUESTADO.esDeFabricacion());
    }

    @Test
    void losDatosPrivadosDelTallerSeVenRecienConLaSenaPagada() {
        assertFalse(PENDIENTE.senaPagada());
        assertFalse(PRESUPUESTADO.senaPagada());
        assertTrue(ACEPTADO.senaPagada());
        assertTrue(ENTREGADO.senaPagada());
    }
}
