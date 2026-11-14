package com.acerrinlab.viruta.usuarios.interno;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.Sesion;
import com.acerrinlab.viruta.usuarios.VerificadorGoogle;

import jakarta.servlet.http.HttpServletRequest;

@RestController
class ControladorUsuarios {

    private final ServicioUsuarios servicio;
    private final VerificadorGoogle google;

    ControladorUsuarios(ServicioUsuarios servicio, VerificadorGoogle google) {
        this.servicio = servicio;
        this.google = google;
    }

    record SolicitudRegistro(String nombre, String email, String clave, Rol rol, Boolean consentimiento) {
    }

    record SolicitudIngreso(String email, String clave) {
    }

    record SolicitudGoogle(String credencial, Rol rol, Boolean consentimiento) {
    }

    record SolicitudTelefono(String telefono) {
    }

    record SolicitudCodigo(String codigo) {
    }

    @PostMapping("/api/auth/registro")
    @ResponseStatus(HttpStatus.CREATED)
    ServicioUsuarios.Acceso registrar(@RequestBody SolicitudRegistro s) {
        return servicio.registrar(s.nombre(), s.email(), s.clave(), s.rol(), s.consentimiento());
    }

    @PostMapping("/api/auth/ingreso")
    ServicioUsuarios.Acceso ingresar(@RequestBody SolicitudIngreso s, HttpServletRequest peticion) {
        return servicio.ingresar(s.email(), s.clave(), origen(peticion));
    }

    /** Ingreso con la credencial del boton de Google (Google Identity Services). */
    @PostMapping("/api/auth/google")
    ServicioUsuarios.Acceso google(@RequestBody SolicitudGoogle s, HttpServletRequest peticion) {
        return servicio.ingresarConGoogle(s.credencial(), s.rol(), s.consentimiento(), origen(peticion));
    }

    /** Le dice al frontend si mostrar el boton de Google. */
    @GetMapping("/api/auth/opciones")
    Map<String, Boolean> opciones() {
        return Map.of("google", google.disponible());
    }

    @GetMapping("/api/usuarios/yo")
    ServicioUsuarios.Perfil yo(@AuthenticationPrincipal Sesion sesion) {
        return servicio.perfil(sesion.id());
    }

    @GetMapping("/api/usuarios/yo/ingresos")
    List<ServicioUsuarios.VistaIngreso> ingresos(@AuthenticationPrincipal Sesion sesion) {
        return servicio.ingresosDe(sesion.id());
    }

    @PostMapping("/api/usuarios/yo/telefono")
    ServicioUsuarios.CodigoEnviado enviarCodigo(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudTelefono s) {
        return servicio.enviarCodigo(sesion.id(), s.telefono());
    }

    @PostMapping("/api/usuarios/yo/telefono/confirmar")
    ServicioUsuarios.Perfil confirmar(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudCodigo s) {
        return servicio.confirmarCodigo(sesion.id(), s.codigo());
    }

    @DeleteMapping("/api/usuarios/yo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void borrarCuenta(@AuthenticationPrincipal Sesion sesion) {
        servicio.borrarCuenta(sesion.id());
    }

    /** Panel de administracion: usuarios, registros por dia e inicios de sesion recientes. */
    @GetMapping("/api/admin/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    ServicioUsuarios.ResumenUsuarios resumen() {
        return servicio.resumen();
    }

    private static ServicioUsuarios.Origen origen(HttpServletRequest peticion) {
        String reenviada = peticion.getHeader("X-Forwarded-For");
        String ip = reenviada != null && !reenviada.isBlank() ? reenviada.split(",")[0].trim() : peticion.getRemoteAddr();
        return new ServicioUsuarios.Origen(ip, peticion.getHeader("User-Agent"));
    }
}
