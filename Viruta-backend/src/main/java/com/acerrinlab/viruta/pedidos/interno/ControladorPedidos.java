package com.acerrinlab.viruta.pedidos.interno;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.pedidos.EstadoPedido;
import com.acerrinlab.viruta.usuarios.Sesion;

@RestController
class ControladorPedidos {

    private final ServicioPedidos servicio;

    ControladorPedidos(ServicioPedidos servicio) {
        this.servicio = servicio;
    }

    record SolicitudPedido(Long proyectoId, Long carpinteriaId, String claveEnvio, String telefono, Boolean consentimiento) {
    }

    record SolicitudPresupuesto(Long materiales, Long manoDeObra, Boolean clienteCompraMaterial, Integer plazoDias) {
    }

    record SolicitudEstado(EstadoPedido estado) {
    }

    // ---------- Cliente ----------

    /** Devuelve 201 si el pedido es nuevo y 200 si es un reintento con la misma clave de envio. */
    @PostMapping("/api/pedidos")
    ResponseEntity<VistaPedido> crear(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudPedido s) {
        ServicioPedidos.Creado creado = servicio.crear(sesion.id(), s.proyectoId(), s.carpinteriaId(), s.claveEnvio(),
                s.telefono(), s.consentimiento());
        return ResponseEntity.status(creado.nuevo() ? HttpStatus.CREATED : HttpStatus.OK).body(creado.pedido());
    }

    @GetMapping("/api/pedidos")
    List<VistaPedido> misPedidos(@AuthenticationPrincipal Sesion sesion) {
        return servicio.delCliente(sesion.id());
    }

    @GetMapping("/api/pedidos/{id}")
    VistaPedido miPedido(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.delCliente(id, sesion.id());
    }

    @PostMapping("/api/pedidos/{id}/rechazar")
    VistaPedido rechazar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.rechazar(id, sesion.id());
    }

    @PostMapping("/api/pedidos/{id}/cancelar")
    VistaPedido cancelar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.cancelarCliente(id, sesion.id());
    }

    // ---------- Carpinteria ----------

    @GetMapping("/api/carpinteria/pedidos")
    List<VistaPedido> bandeja(@AuthenticationPrincipal Sesion sesion,
            @RequestParam(name = "estados", required = false) Set<EstadoPedido> estados) {
        return servicio.bandeja(sesion.id(), estados);
    }

    @GetMapping("/api/carpinteria/pedidos/{id}")
    VistaPedido detalle(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.detalleCarpinteria(id, sesion.id());
    }

    @PostMapping("/api/carpinteria/pedidos/{id}/presupuesto")
    VistaPedido presupuestar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id,
            @RequestBody SolicitudPresupuesto s) {
        return servicio.presupuestar(id, sesion.id(), s.materiales(), s.manoDeObra(), s.clienteCompraMaterial(),
                s.plazoDias());
    }

    @PostMapping("/api/carpinteria/pedidos/{id}/estado")
    VistaPedido avanzar(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id,
            @RequestBody SolicitudEstado s) {
        return servicio.avanzar(id, sesion.id(), s.estado());
    }

    @PostMapping("/api/carpinteria/pedidos/{id}/cancelar")
    VistaPedido cancelarCarpinteria(@AuthenticationPrincipal Sesion sesion, @PathVariable("id") long id) {
        return servicio.cancelarCarpinteria(id, sesion.id());
    }
}
