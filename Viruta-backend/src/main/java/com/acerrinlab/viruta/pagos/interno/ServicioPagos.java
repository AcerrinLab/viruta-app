package com.acerrinlab.viruta.pagos.interno;

import java.time.Clock;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.carpinterias.CarpinteriasApi;
import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.pagos.PagosApi;
import com.acerrinlab.viruta.pedidos.DatosCobro;
import com.acerrinlab.viruta.pedidos.EstadoPedido;
import com.acerrinlab.viruta.pedidos.PedidosApi;

@Service
class ServicioPagos implements PagosApi {

    private final RepositorioPagos pagos;
    private final PedidosApi pedidos;
    private final CarpinteriasApi carpinterias;
    private final PasarelaPago pasarela;
    private final Clock reloj;
    private final int porcentajeComision;
    private final boolean simulado;
    private final String secretoWebhook;

    ServicioPagos(RepositorioPagos pagos, PedidosApi pedidos, CarpinteriasApi carpinterias, Clock reloj,
            @Value("${viruta.pagos.modo:simulado}") String modo,
            @Value("${viruta.mercadopago.token:}") String token,
            @Value("${viruta.mercadopago.secreto-webhook:}") String secretoWebhook,
            @Value("${viruta.frontend.url}") String frontend,
            @Value("${viruta.backend.url}") String backend,
            @Value("${viruta.comision.porcentaje:10}") int porcentajeComision) {
        this.pagos = pagos;
        this.pedidos = pedidos;
        this.carpinterias = carpinterias;
        this.reloj = reloj;
        this.porcentajeComision = porcentajeComision;
        this.secretoWebhook = secretoWebhook;
        this.simulado = !"mercadopago".equalsIgnoreCase(modo);
        this.pasarela = simulado ? new PasarelaSimulada(frontend) : new PasarelaMercadoPago(token, frontend, backend);
    }

    record Resumen(long trabajos, long senasCobradas, long comision) {
    }

    /** El cliente acepta el presupuesto: se crea el cobro de la sena y se devuelve el enlace de pago. */
    String iniciar(long pedidoId, long clienteId) {
        DatosCobro datos = pedidos.datosDeCobroDe(pedidoId, clienteId);
        if (datos.estado() != EstadoPedido.PRESUPUESTADO) {
            throw ErrorNegocio.conflicto("Este pedido no tiene un presupuesto para aceptar.");
        }
        return pasarela.crearCobro(pedidoId, datos.titulo(), datos.sena());
    }

    /** Solo en modo simulado: aprueba el pago sin pasar por un proveedor real. */
    @Transactional
    void aprobarSimulado(long pedidoId, long clienteId) {
        if (!simulado) {
            throw ErrorNegocio.noEncontrado("El pago simulado no está habilitado.");
        }
        pedidos.datosDeCobroDe(pedidoId, clienteId);
        registrar(pedidoId, "simulado-" + pedidoId);
    }

    /**
     * Aviso de Mercado Pago. Se verifica la firma, se consulta el pago en el proveedor y
     * recien entonces el pedido pasa a Aceptado (RF-18).
     */
    @Transactional
    void recibirAviso(String xSignature, String xRequestId, String dataId) {
        if (!VerificadorFirma.valida(xSignature, xRequestId, dataId, secretoWebhook)) {
            throw ErrorNegocio.noAutenticado("Firma inválida.");
        }
        pasarela.consultar(dataId).filter(PasarelaPago.PagoExterno::aprobado)
                .ifPresent(pago -> registrar(pago.pedidoId(), pago.referencia()));
    }

    /** Registra la sena y la comision. Si el aviso llega repetido, no hace nada. */
    private void registrar(long pedidoId, String referencia) {
        if (pagos.findByPedidoId(pedidoId).isPresent()) {
            return;
        }
        DatosCobro datos = pedidos.datosDeCobro(pedidoId);
        if (datos.estado() != EstadoPedido.PRESUPUESTADO) {
            throw ErrorNegocio.conflicto("Este pedido no tiene un presupuesto para aceptar.");
        }
        Pago pago = new Pago();
        pago.pedidoId = pedidoId;
        pago.carpinteriaId = datos.carpinteriaId();
        pago.monto = datos.sena();
        pago.comision = CalculadorComision.calcular(datos.total(), porcentajeComision);
        pago.referencia = referencia;
        pago.creado = reloj.instant();
        pagos.save(pago);
        pedidos.confirmarSena(pedidoId);
    }

    /** Resumen de trabajos de la carpinteria: sale de los pagos confirmados (RF-30). */
    @Transactional(readOnly = true)
    Resumen resumen(long usuarioId) {
        return carpinterias.porUsuario(usuarioId).map(c -> {
            List<Pago> lista = pagos.findByCarpinteriaId(c.id());
            return new Resumen(lista.size(), lista.stream().mapToLong(p -> p.monto).sum(),
                    lista.stream().mapToLong(p -> p.comision).sum());
        }).orElse(new Resumen(0, 0, 0));
    }

    @Override
    public long cantidadDeSenas() {
        return pagos.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long montoDeSenas() {
        return pagos.findAll().stream().mapToLong(p -> p.monto).sum();
    }
}
