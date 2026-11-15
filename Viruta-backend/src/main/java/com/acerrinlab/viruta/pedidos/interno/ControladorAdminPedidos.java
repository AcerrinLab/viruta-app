package com.acerrinlab.viruta.pedidos.interno;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.pedidos.EstadoPedido;

/** Panel de administracion: como se mueven los pedidos en toda la plataforma. */
@RestController
class ControladorAdminPedidos {

    private static final ZoneId JUJUY = ZoneId.of("America/Argentina/Jujuy");

    private final RepositorioPedidos pedidos;
    private final Clock reloj;

    ControladorAdminPedidos(RepositorioPedidos pedidos, Clock reloj) {
        this.pedidos = pedidos;
        this.reloj = reloj;
    }

    record ResumenPedidos(long total, Map<String, Long> porEstado, List<Map<String, Object>> porDia, long presupuestado,
            long carpinteriasActivas) {
    }

    @GetMapping("/api/admin/pedidos")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    ResumenPedidos resumen() {
        List<Pedido> todos = pedidos.findAll();
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoPedido e : EstadoPedido.values()) {
            porEstado.put(e.name(), 0L);
        }
        LocalDate hoy = LocalDate.now(reloj.withZone(JUJUY));
        Map<LocalDate, Long> dias = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            dias.put(hoy.minusDays(i), 0L);
        }
        long presupuestado = 0;
        for (Pedido p : todos) {
            porEstado.merge(p.estado.name(), 1L, Long::sum);
            if (p.creado != null) {
                dias.computeIfPresent(p.creado.atZone(JUJUY).toLocalDate(), (d, n) -> n + 1);
            }
            if (p.estado == EstadoPedido.ACEPTADO || p.estado == EstadoPedido.MEDIDAS_VERIFICADAS
                    || p.estado == EstadoPedido.EN_FABRICACION || p.estado == EstadoPedido.ENTREGADO) {
                presupuestado += p.total();
            }
        }
        List<Map<String, Object>> porDia = dias.entrySet().stream()
                .map(e -> Map.<String, Object>of("dia", e.getKey().toString(), "cantidad", e.getValue())).toList();
        long carpinterias = todos.stream().map(p -> p.carpinteriaId).distinct().count();
        return new ResumenPedidos(todos.size(), porEstado, porDia, presupuestado, carpinterias);
    }
}
