package com.acerrinlab.viruta.traccion.interno;

import java.time.Clock;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.diseno.DisenoApi;
import com.acerrinlab.viruta.pagos.PagosApi;
import com.acerrinlab.viruta.pedidos.PedidosApi;
import com.acerrinlab.viruta.usuarios.UsuariosApi;

/**
 * Soporte a la traccion: lista de espera con contador (RF-20) y metricas internas (RF-21).
 * Todos los numeros salen de la base de datos (RNF-10).
 */
@RestController
class ControladorTraccion {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final RepositorioInscriptos inscriptos;
    private final UsuariosApi usuarios;
    private final DisenoApi diseno;
    private final PedidosApi pedidos;
    private final PagosApi pagos;
    private final Clock reloj;

    ControladorTraccion(RepositorioInscriptos inscriptos, UsuariosApi usuarios, DisenoApi diseno, PedidosApi pedidos,
            PagosApi pagos, Clock reloj) {
        this.inscriptos = inscriptos;
        this.usuarios = usuarios;
        this.diseno = diseno;
        this.pedidos = pedidos;
        this.pagos = pagos;
        this.reloj = reloj;
    }

    record SolicitudInscripcion(String email, String tipo, Boolean consentimiento) {
    }

    record Contador(long total, long clientes, long carpinterias) {
    }

    @PostMapping("/api/lista-espera")
    @Transactional
    Contador inscribir(@RequestBody SolicitudInscripcion s) {
        String email = s.email() == null ? "" : s.email().trim().toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(email).matches() || email.length() > 120) {
            throw ErrorNegocio.invalido("El email no es válido.");
        }
        String tipo = "CARPINTERIA".equals(s.tipo()) ? "CARPINTERIA" : "CLIENTE";
        if (!Boolean.TRUE.equals(s.consentimiento())) {
            throw ErrorNegocio.invalido("Necesitamos tu consentimiento para guardar tu email.");
        }
        if (!inscriptos.existsByEmailAndTipo(email, tipo)) {
            Inscripto i = new Inscripto();
            i.email = email;
            i.tipo = tipo;
            i.creado = reloj.instant();
            inscriptos.save(i);
        }
        return contador();
    }

    @GetMapping("/api/lista-espera/contador")
    Contador contador() {
        long clientes = inscriptos.countByTipo("CLIENTE");
        long carpinterias = inscriptos.countByTipo("CARPINTERIA");
        return new Contador(clientes + carpinterias, clientes, carpinterias);
    }

    @GetMapping("/api/metricas")
    Map<String, Long> metricas() {
        return Map.of(
                "usuarios", usuarios.contar(),
                "proyectos", diseno.contarProyectos(),
                "pedidos", pedidos.contar(),
                "senas", pagos.cantidadDeSenas(),
                "montoSenas", pagos.montoDeSenas(),
                "inscriptos", inscriptos.count());
    }

    @GetMapping("/api/salud")
    Map<String, String> salud() {
        return Map.of("estado", "ok");
    }
}
