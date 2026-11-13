package com.acerrinlab.viruta.carpinterias.interno;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.carpinterias.Zona;
import com.acerrinlab.viruta.materiales.Material;
import com.acerrinlab.viruta.usuarios.Sesion;

@RestController
class ControladorCarpinterias {

    private final ServicioCarpinterias servicio;

    ControladorCarpinterias(ServicioCarpinterias servicio) {
        this.servicio = servicio;
    }

    record SolicitudPerfil(String nombre, Zona zona, String whatsapp, String direccion, Set<Material> materiales) {
    }

    /** Carpinterias para el mapa, filtradas por material. Publico. */
    @GetMapping("/api/carpinterias")
    List<ServicioCarpinterias.FichaPublica> buscar(@RequestParam(name = "material", required = false) Material material) {
        return servicio.buscar(material);
    }

    @GetMapping("/api/carpinteria/zonas")
    List<Map<String, String>> zonas() {
        return Arrays.stream(Zona.values()).map(z -> Map.of("id", z.name(), "etiqueta", z.etiqueta)).toList();
    }

    @GetMapping("/api/carpinteria/perfil")
    ServicioCarpinterias.Perfil perfil(@AuthenticationPrincipal Sesion sesion) {
        return servicio.perfil(sesion.id());
    }

    @PutMapping("/api/carpinteria/perfil")
    ServicioCarpinterias.Perfil guardar(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudPerfil s) {
        return servicio.guardar(sesion.id(), s.nombre(), s.zona(), s.whatsapp(), s.direccion(), s.materiales());
    }
}
