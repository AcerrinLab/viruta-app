package com.acerrinlab.viruta.diseno.interno;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.diseno.Plantilla;
import com.acerrinlab.viruta.diseno.ResultadoDiseno;
import com.acerrinlab.viruta.usuarios.Sesion;

@RestController
class ControladorDiseno {

    private final ServicioDiseno servicio;

    ControladorDiseno(ServicioDiseno servicio) {
        this.servicio = servicio;
    }

    /** Plantillas con sus rangos, para que la interfaz limite las medidas. Publico. */
    @GetMapping("/api/plantillas")
    List<Map<String, Object>> plantillas() {
        return Arrays.stream(Plantilla.values()).map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.name());
            m.put("etiqueta", p.etiqueta);
            m.put("ancho", List.of(p.anchoMin, p.anchoMax));
            m.put("alto", List.of(p.altoMin, p.altoMax));
            m.put("profundidad", List.of(p.profundidadMin, p.profundidadMax));
            m.put("estantes", List.of(p.estantesMin, p.estantesMax));
            return m;
        }).toList();
    }

    /** Calcula piezas, avisos y materiales sin guardar nada. Publico: se puede disenar sin cuenta. */
    @PostMapping("/api/disenos/calcular")
    ResultadoDiseno calcular(@RequestBody SolicitudDiseno solicitud) {
        return servicio.calcular(solicitud.aDatos());
    }

    @GetMapping("/api/proyectos")
    List<VistaProyecto> listar(@AuthenticationPrincipal Sesion sesion) {
        return servicio.listar(sesion.id());
    }

    @PostMapping("/api/proyectos")
    @ResponseStatus(HttpStatus.CREATED)
    VistaProyecto crear(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudDiseno solicitud) {
        return servicio.crear(sesion.id(), solicitud.aDatos());
    }

    @GetMapping("/api/proyectos/{id}")
    VistaProyecto obtener(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.obtener(id, sesion.id());
    }

    @PutMapping("/api/proyectos/{id}")
    VistaProyecto actualizar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id,
            @RequestBody SolicitudDiseno solicitud) {
        return servicio.actualizar(id, sesion.id(), solicitud.aDatos());
    }

    @DeleteMapping("/api/proyectos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void borrar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        servicio.borrar(id, sesion.id());
    }
}
