package com.acerrinlab.viruta.pedidos.interno;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.carpinterias.CarpinteriasApi;
import com.acerrinlab.viruta.carpinterias.DatosCarpinteria;
import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.compartido.eventos.PedidoCreado;
import com.acerrinlab.viruta.compartido.eventos.SenaPagada;
import com.acerrinlab.viruta.diseno.DatosDiseno;
import com.acerrinlab.viruta.diseno.DisenoApi;
import com.acerrinlab.viruta.pedidos.DatosCobro;
import com.acerrinlab.viruta.pedidos.EstadoPedido;
import com.acerrinlab.viruta.pedidos.PedidosApi;
import com.acerrinlab.viruta.usuarios.DatosUsuario;
import com.acerrinlab.viruta.usuarios.UsuariosApi;

@Service
class ServicioPedidos implements PedidosApi {

    /** Sin respuesta de la carpinteria en 72 horas, el pedido vence. */
    static final Duration VENCE_PENDIENTE = Duration.ofHours(72);
    /** Sin respuesta del cliente en 7 dias, el presupuesto vence. */
    static final Duration VENCE_PRESUPUESTADO = Duration.ofDays(7);

    private final RepositorioPedidos pedidos;
    private final DisenoApi diseno;
    private final CarpinteriasApi carpinterias;
    private final UsuariosApi usuarios;
    private final ApplicationEventPublisher eventos;
    private final Clock reloj;
    private final int porcentajeSena;

    ServicioPedidos(RepositorioPedidos pedidos, DisenoApi diseno, CarpinteriasApi carpinterias, UsuariosApi usuarios,
            ApplicationEventPublisher eventos, Clock reloj, @Value("${viruta.sena.porcentaje:50}") int porcentajeSena) {
        this.pedidos = pedidos;
        this.diseno = diseno;
        this.carpinterias = carpinterias;
        this.usuarios = usuarios;
        this.eventos = eventos;
        this.reloj = reloj;
        this.porcentajeSena = porcentajeSena;
    }

    // ---------- Cliente ----------

    record Creado(VistaPedido pedido, boolean nuevo) {
    }

    /**
     * Crea el pedido con una copia fija del proyecto (RF-15). El despiece se vuelve a calcular
     * en el servidor: no se confia en cantidades enviadas por el navegador.
     */
    @Transactional
    Creado crear(long clienteId, Long proyectoId, Long carpinteriaId, String claveEnvio, String telefono,
            Boolean consentimiento) {
        if (proyectoId == null || carpinteriaId == null) {
            throw ErrorNegocio.invalido("Faltan el proyecto o la carpintería.");
        }
        if (claveEnvio == null || claveEnvio.isBlank() || claveEnvio.length() > 64) {
            throw ErrorNegocio.invalido("Falta la clave de envío.");
        }
        var existente = pedidos.findByClienteIdAndClaveEnvio(clienteId, claveEnvio);
        if (existente.isPresent()) {
            return new Creado(vista(existente.get(), false, true), false);
        }
        String numero = telefono == null ? "" : telefono.replaceAll("[^0-9]", "");
        if (numero.length() < 8 || numero.length() > 15) {
            throw ErrorNegocio.invalido("Escribí un teléfono de contacto válido.");
        }
        if (!Boolean.TRUE.equals(consentimiento)) {
            throw ErrorNegocio.invalido("Necesitamos tu permiso para compartir tus datos con la carpintería.");
        }
        DatosDiseno datos = diseno.proyectoDe(proyectoId, clienteId)
                .orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese proyecto."));
        DatosCarpinteria taller = carpinterias.porId(carpinteriaId)
                .orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos esa carpintería."));
        if (!taller.materiales().contains(datos.material())) {
            throw ErrorNegocio.invalido("Esa carpintería no trabaja el material elegido.");
        }
        diseno.calcular(datos);

        Instant ahora = reloj.instant();
        Pedido p = new Pedido();
        p.clienteId = clienteId;
        p.carpinteriaId = carpinteriaId;
        p.proyectoId = proyectoId;
        p.claveEnvio = claveEnvio;
        p.telefonoCliente = numero;
        p.estado = EstadoPedido.PENDIENTE;
        p.leido = false;
        p.creado = ahora;
        p.actualizado = ahora;
        p.copiar(datos);
        p = pedidos.save(p);
        eventos.publishEvent(new PedidoCreado(p.id, p.carpinteriaId));
        return new Creado(vista(p, false, true), true);
    }

    @Transactional(readOnly = true)
    List<VistaPedido> delCliente(long clienteId) {
        return pedidos.findByClienteIdOrderByCreadoDesc(clienteId).stream().map(p -> vista(p, false, false)).toList();
    }

    @Transactional(readOnly = true)
    VistaPedido delCliente(long id, long clienteId) {
        return vista(buscarDeCliente(id, clienteId), false, true);
    }

    @Transactional
    VistaPedido rechazar(long id, long clienteId) {
        Pedido p = buscarDeCliente(id, clienteId);
        p.pasarA(EstadoPedido.RECHAZADO, reloj.instant());
        return vista(pedidos.save(p), false, true);
    }

    @Transactional
    VistaPedido cancelarCliente(long id, long clienteId) {
        Pedido p = buscarDeCliente(id, clienteId);
        p.pasarA(EstadoPedido.CANCELADO, reloj.instant());
        return vista(pedidos.save(p), false, true);
    }

    // ---------- Carpinteria ----------

    @Transactional(readOnly = true)
    List<VistaPedido> bandeja(long usuarioId, Set<EstadoPedido> estados) {
        long carpinteriaId = carpinteriaDe(usuarioId);
        return pedidos.findByCarpinteriaIdOrderByLeidoAscCreadoDesc(carpinteriaId).stream()
                .filter(p -> estados == null || estados.isEmpty() || estados.contains(p.estado))
                .map(p -> vista(p, true, false))
                .toList();
    }

    /** Detalle para la carpinteria: lo marca como leido (RF-27, RF-28). */
    @Transactional
    VistaPedido detalleCarpinteria(long id, long usuarioId) {
        Pedido p = buscarDeCarpinteria(id, usuarioId);
        if (!p.leido) {
            p.leido = true;
            pedidos.save(p);
        }
        return vista(p, true, true);
    }

    /** La carpinteria responde separando materiales y mano de obra (RF-17). */
    @Transactional
    VistaPedido presupuestar(long id, long usuarioId, Long materiales, Long manoDeObra, Boolean clienteCompraMaterial,
            Integer plazoDias) {
        Pedido p = buscarDeCarpinteria(id, usuarioId);
        if (materiales == null || manoDeObra == null || materiales < 0 || manoDeObra <= 0) {
            throw ErrorNegocio.invalido("Cargá el costo de materiales y de mano de obra.");
        }
        if (plazoDias != null && (plazoDias < 1 || plazoDias > 365)) {
            throw ErrorNegocio.invalido("El plazo debe estar entre 1 y 365 días.");
        }
        Instant ahora = reloj.instant();
        p.pasarA(EstadoPedido.PRESUPUESTADO, ahora);
        p.montoMateriales = materiales;
        p.manoDeObra = manoDeObra;
        p.clienteCompraMaterial = Boolean.TRUE.equals(clienteCompraMaterial);
        p.plazoDias = plazoDias;
        p.presupuestadoEn = ahora;
        p.leido = true;
        return vista(pedidos.save(p), true, true);
    }

    /** Solo la carpinteria del pedido cambia estos estados, y solo en orden (RF-19). */
    @Transactional
    VistaPedido avanzar(long id, long usuarioId, EstadoPedido nuevo) {
        Pedido p = buscarDeCarpinteria(id, usuarioId);
        if (nuevo == null || !nuevo.esDeFabricacion()) {
            throw ErrorNegocio.invalido("Ese estado no lo puede marcar la carpintería.");
        }
        p.pasarA(nuevo, reloj.instant());
        return vista(pedidos.save(p), true, true);
    }

    @Transactional
    VistaPedido cancelarCarpinteria(long id, long usuarioId) {
        Pedido p = buscarDeCarpinteria(id, usuarioId);
        p.pasarA(EstadoPedido.CANCELADO, reloj.instant());
        return vista(pedidos.save(p), true, true);
    }

    // ---------- Vencimientos ----------

    @Scheduled(fixedDelay = 3_600_000, initialDelay = 60_000)
    @Transactional
    public void vencer() {
        Instant ahora = reloj.instant();
        for (Pedido p : pedidos.findByEstadoAndCreadoBefore(EstadoPedido.PENDIENTE, ahora.minus(VENCE_PENDIENTE))) {
            p.pasarA(EstadoPedido.VENCIDO, ahora);
            pedidos.save(p);
        }
        for (Pedido p : pedidos.findByEstadoAndPresupuestadoEnBefore(EstadoPedido.PRESUPUESTADO,
                ahora.minus(VENCE_PRESUPUESTADO))) {
            p.pasarA(EstadoPedido.VENCIDO, ahora);
            pedidos.save(p);
        }
    }

    // ---------- PedidosApi ----------

    @Override
    @Transactional(readOnly = true)
    public DatosCobro datosDeCobro(long pedidoId) {
        return cobro(pedidos.findById(pedidoId).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese pedido.")));
    }

    @Override
    @Transactional(readOnly = true)
    public DatosCobro datosDeCobroDe(long pedidoId, long clienteId) {
        return cobro(buscarDeCliente(pedidoId, clienteId));
    }

    @Override
    @Transactional
    public void confirmarSena(long pedidoId) {
        Pedido p = pedidos.findById(pedidoId).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese pedido."));
        if (p.estado.senaPagada()) {
            return;
        }
        p.pasarA(EstadoPedido.ACEPTADO, reloj.instant());
        pedidos.save(p);
        eventos.publishEvent(new SenaPagada(p.id, p.carpinteriaId));
    }

    @Override
    public long contar() {
        return pedidos.count();
    }

    // ---------- Internos ----------

    private DatosCobro cobro(Pedido p) {
        return new DatosCobro(p.id, p.carpinteriaId, "Seña - " + p.nombre, p.total(), sena(p), p.estado);
    }

    private long sena(Pedido p) {
        return Math.round(p.total() * porcentajeSena / 100.0);
    }

    private long carpinteriaDe(long usuarioId) {
        return carpinterias.porUsuario(usuarioId)
                .orElseThrow(() -> ErrorNegocio.conflicto("Primero completá el perfil de tu carpintería."))
                .id();
    }

    /** Conocer el numero de un pedido no alcanza para verlo: siempre se verifica el dueno (RNF-08). */
    private Pedido buscarDeCliente(long id, long clienteId) {
        Pedido p = pedidos.findById(id).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese pedido."));
        if (!p.clienteId.equals(clienteId)) {
            throw ErrorNegocio.prohibido("Ese pedido no es tuyo.");
        }
        return p;
    }

    private Pedido buscarDeCarpinteria(long id, long usuarioId) {
        long carpinteriaId = carpinteriaDe(usuarioId);
        Pedido p = pedidos.findById(id).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese pedido."));
        if (!p.carpinteriaId.equals(carpinteriaId)) {
            throw ErrorNegocio.prohibido("Ese pedido es de otra carpintería.");
        }
        return p;
    }

    private VistaPedido vista(Pedido p, boolean paraCarpinteria, boolean conCalculo) {
        DatosDiseno datos = p.diseno();
        VistaPedido.Presupuesto presupuesto = p.presupuestadoEn == null ? null
                : new VistaPedido.Presupuesto(p.montoMateriales, p.manoDeObra, p.clienteCompraMaterial, p.plazoDias,
                        p.total(), sena(p));
        boolean verPrivado = paraCarpinteria || p.estado.senaPagada();
        VistaPedido.Taller taller = carpinterias.porId(p.carpinteriaId)
                .map(c -> new VistaPedido.Taller(c.id(), c.nombre(), c.zona() == null ? "" : c.zona().etiqueta,
                        verPrivado ? c.whatsapp() : null, verPrivado ? c.direccion() : null))
                .orElse(null);
        VistaPedido.Cliente cliente = null;
        if (paraCarpinteria) {
            String nombre = usuarios.buscar(p.clienteId).map(DatosUsuario::nombre).orElse("Cliente");
            cliente = new VistaPedido.Cliente(nombre, p.telefonoCliente);
        }
        return new VistaPedido(p.id, p.estado, String.valueOf(p.creado), p.leido, datos,
                conCalculo ? diseno.calcular(datos) : null, presupuesto, taller, cliente);
    }
}
