package com.acerrinlab.viruta.usuarios.interno;

import java.time.Clock;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.usuarios.DatosUsuario;
import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.UsuariosApi;

@Service
class ServicioUsuarios implements UsuariosApi, CommandLineRunner {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final RepositorioUsuarios usuarios;
    private final PasswordEncoder codificador;
    private final ServicioJwt jwt;
    private final LimitadorIntentos limitador;
    private final Clock reloj;
    private final String adminEmail;
    private final String adminClave;

    ServicioUsuarios(RepositorioUsuarios usuarios, PasswordEncoder codificador, ServicioJwt jwt, Clock reloj,
            @Value("${viruta.admin.email:}") String adminEmail,
            @Value("${viruta.admin.password:}") String adminClave) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.jwt = jwt;
        this.reloj = reloj;
        this.limitador = new LimitadorIntentos(5, Duration.ofMinutes(1), reloj);
        this.adminEmail = adminEmail;
        this.adminClave = adminClave;
    }

    record Acceso(String token, long id, String nombre, Rol rol) {
    }

    @Transactional
    Acceso registrar(String nombre, String email, String clave, Rol rol, Boolean consentimiento) {
        if (nombre == null || nombre.isBlank() || nombre.length() > 80) {
            throw ErrorNegocio.invalido("Escribí tu nombre.");
        }
        String correo = normalizar(email);
        if (!EMAIL.matcher(correo).matches() || correo.length() > 120) {
            throw ErrorNegocio.invalido("El email no es válido.");
        }
        if (clave == null || clave.length() < 8 || clave.length() > 72) {
            throw ErrorNegocio.invalido("La contraseña debe tener al menos 8 caracteres.");
        }
        if (rol != Rol.CLIENTE && rol != Rol.CARPINTERIA) {
            throw ErrorNegocio.invalido("Elegí si sos cliente o carpintería.");
        }
        if (!Boolean.TRUE.equals(consentimiento)) {
            throw ErrorNegocio.invalido("Necesitamos tu consentimiento para usar tus datos.");
        }
        if (usuarios.findByEmail(correo).isPresent()) {
            throw ErrorNegocio.conflicto("Ya hay una cuenta con ese email.");
        }
        Usuario u = crear(nombre.trim(), correo, clave, rol);
        return new Acceso(jwt.generar(u.id, u.rol), u.id, u.nombre, u.rol);
    }

    @Transactional(readOnly = true)
    Acceso ingresar(String email, String clave, String origen) {
        String correo = normalizar(email);
        String llave = origen + "|" + correo;
        if (!limitador.permitir(llave)) {
            throw new ErrorNegocio(429, "Demasiados intentos. Probá de nuevo en un minuto.");
        }
        Usuario u = usuarios.findByEmail(correo).orElse(null);
        if (u == null || !u.activo || clave == null || !codificador.matches(clave, u.clave)) {
            throw ErrorNegocio.noAutenticado("Email o contraseña incorrectos.");
        }
        limitador.reiniciar(llave);
        return new Acceso(jwt.generar(u.id, u.rol), u.id, u.nombre, u.rol);
    }

    /** Borra la cuenta: se anonimizan los datos personales y se desactiva (RNF-09). */
    @Transactional
    void borrarCuenta(long id) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos la cuenta."));
        u.nombre = "Cuenta eliminada";
        u.email = "eliminado-" + u.id + "@viruta.invalid";
        u.clave = "";
        u.activo = false;
        usuarios.save(u);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosUsuario> buscar(long id) {
        return usuarios.findById(id).map(u -> new DatosUsuario(u.id, u.nombre, u.email, u.rol));
    }

    @Override
    public long contar() {
        return usuarios.countByActivoTrue();
    }

    /** Crea el usuario administrador al iniciar, si esta configurado por variables de entorno. */
    @Override
    @Transactional
    public void run(String... args) {
        if (adminEmail.isBlank() || adminClave.length() < 8) {
            return;
        }
        String correo = normalizar(adminEmail);
        if (usuarios.findByEmail(correo).isEmpty()) {
            crear("Administrador", correo, adminClave, Rol.ADMIN);
        }
    }

    private Usuario crear(String nombre, String correo, String clave, Rol rol) {
        Usuario u = new Usuario();
        u.nombre = nombre;
        u.email = correo;
        u.clave = codificador.encode(clave);
        u.rol = rol;
        u.activo = true;
        u.consentimiento = true;
        u.creado = reloj.instant();
        return usuarios.save(u);
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
