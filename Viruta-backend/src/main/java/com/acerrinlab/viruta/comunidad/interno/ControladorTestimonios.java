package com.acerrinlab.viruta.comunidad.interno;

import java.time.Clock;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.usuarios.DatosUsuario;
import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.Sesion;
import com.acerrinlab.viruta.usuarios.UsuariosApi;

/**
 * Testimonios de la version de testing. La portada solo muestra los aprobados; cada persona puede
 * dejar el suyo (queda pendiente) y los administradores los cargan, aprueban o borran.
 * Si la cuenta entro con Google, el testimonio toma su foto de perfil.
 */
@RestController
class ControladorTestimonios {

    private final RepositorioTestimonios testimonios;
    private final UsuariosApi usuarios;
    private final Clock reloj;

    ControladorTestimonios(RepositorioTestimonios testimonios, UsuariosApi usuarios, Clock reloj) {
        this.testimonios = testimonios;
        this.usuarios = usuarios;
        this.reloj = reloj;
    }

    record Vista(long id, String nombre, String detalle, String texto, String fotoUrl, boolean aprobado, String creado) {
    }

    record SolicitudPropia(String texto, String detalle) {
    }

    record SolicitudAdmin(String nombre, String detalle, String texto, String fotoUrl, Boolean aprobado) {
    }

    @GetMapping("/api/testimonios")
    List<Vista> publicados() {
        return testimonios.findByAprobadoTrueOrderByCreadoDesc().stream().map(this::vista).toList();
    }

    /** El comentario propio, si ya dejo uno (204 si no). */
    @GetMapping("/api/testimonios/mio")
    ResponseEntity<Vista> mio(@AuthenticationPrincipal Sesion sesion) {
        return testimonios.findFirstByUsuarioIdOrderByCreadoDesc(sesion.id()).map(this::vista)
                .map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    /** Cada cuenta deja o actualiza su comentario; vuelve a quedar pendiente de aprobacion. */
    @PostMapping("/api/testimonios")
    @Transactional
    Vista dejar(@AuthenticationPrincipal Sesion sesion, @RequestBody SolicitudPropia s) {
        DatosUsuario u = usuarios.buscar(sesion.id()).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos tu cuenta."));
        Testimonio t = testimonios.findFirstByUsuarioIdOrderByCreadoDesc(u.id()).orElseGet(Testimonio::new);
        t.usuarioId = u.id();
        t.nombre = u.nombre();
        t.detalle = detalle(s.detalle(), u.rol());
        t.texto = texto(s.texto());
        t.fotoUrl = u.fotoUrl();
        t.aprobado = false;
        t.creado = reloj.instant();
        return vista(testimonios.save(t));
    }

    @GetMapping("/api/admin/testimonios")
    @PreAuthorize("hasRole('ADMIN')")
    List<Vista> todos() {
        return testimonios.findAllByOrderByAprobadoAscCreadoDesc().stream().map(this::vista).toList();
    }

    @PostMapping("/api/admin/testimonios")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Vista cargar(@RequestBody SolicitudAdmin s) {
        if (s.nombre() == null || s.nombre().isBlank() || s.nombre().length() > 80) {
            throw ErrorNegocio.invalido("Escribí el nombre de la persona.");
        }
        Testimonio t = new Testimonio();
        t.nombre = s.nombre().trim();
        t.detalle = s.detalle() == null || s.detalle().isBlank() ? null : recortar(s.detalle().trim(), 120);
        t.texto = texto(s.texto());
        t.fotoUrl = foto(s.fotoUrl());
        t.aprobado = !Boolean.FALSE.equals(s.aprobado());
        t.creado = reloj.instant();
        return vista(testimonios.save(t));
    }

    @PutMapping("/api/admin/testimonios/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Vista aprobar(@PathVariable long id) {
        Testimonio t = buscar(id);
        t.aprobado = true;
        return vista(testimonios.save(t));
    }

    @PutMapping("/api/admin/testimonios/{id}/ocultar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    Vista ocultar(@PathVariable long id) {
        Testimonio t = buscar(id);
        t.aprobado = false;
        return vista(testimonios.save(t));
    }

    @DeleteMapping("/api/admin/testimonios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void borrar(@PathVariable long id) {
        testimonios.delete(buscar(id));
    }

    private Testimonio buscar(long id) {
        return testimonios.findById(id).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos ese testimonio."));
    }

    private Vista vista(Testimonio t) {
        // La foto se toma de la cuenta en cada lectura: si despues entra con Google, aparece.
        String foto = t.fotoUrl;
        if (t.usuarioId != null) {
            foto = usuarios.buscar(t.usuarioId).map(DatosUsuario::fotoUrl).filter(f -> f != null && !f.isBlank()).orElse(foto);
        }
        return new Vista(t.id, t.nombre, t.detalle, t.texto, foto, t.aprobado, t.creado == null ? null : t.creado.toString());
    }

    private static String texto(String texto) {
        if (texto == null || texto.trim().length() < 10) {
            throw ErrorNegocio.invalido("Contanos un poco más (al menos 10 caracteres).");
        }
        if (texto.trim().length() > 600) {
            throw ErrorNegocio.invalido("El comentario puede tener hasta 600 caracteres.");
        }
        return texto.trim();
    }

    private static String detalle(String detalle, Rol rol) {
        if (detalle != null && !detalle.isBlank()) {
            return recortar(detalle.trim(), 120);
        }
        return rol == Rol.CARPINTERIA ? "Carpintería, versión de testing" : "Cliente, versión de testing";
    }

    private static String foto(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        if (!url.startsWith("https://") || url.length() > 500) {
            throw ErrorNegocio.invalido("La foto tiene que ser un enlace https.");
        }
        return url;
    }

    private static String recortar(String texto, int maximo) {
        return texto.length() > maximo ? texto.substring(0, maximo) : texto;
    }
}
