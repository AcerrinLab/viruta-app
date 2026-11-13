package com.acerrinlab.viruta.usuarios.interno;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.Sesion;

import jakarta.servlet.http.HttpServletRequest;

@RestController
class ControladorUsuarios {

    private final ServicioUsuarios servicio;

    ControladorUsuarios(ServicioUsuarios servicio) {
        this.servicio = servicio;
    }

    record SolicitudRegistro(String nombre, String email, String clave, Rol rol, Boolean consentimiento) {
    }

    record SolicitudIngreso(String email, String clave) {
    }

    @PostMapping("/api/auth/registro")
    @ResponseStatus(HttpStatus.CREATED)
    ServicioUsuarios.Acceso registrar(@RequestBody SolicitudRegistro s) {
        return servicio.registrar(s.nombre(), s.email(), s.clave(), s.rol(), s.consentimiento());
    }

    @PostMapping("/api/auth/ingreso")
    ServicioUsuarios.Acceso ingresar(@RequestBody SolicitudIngreso s, HttpServletRequest peticion) {
        return servicio.ingresar(s.email(), s.clave(), peticion.getRemoteAddr());
    }

    @DeleteMapping("/api/usuarios/yo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void borrarCuenta(@AuthenticationPrincipal Sesion sesion) {
        servicio.borrarCuenta(sesion.id());
    }
}
