package com.acerrinlab.viruta.usuarios.interno;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.acerrinlab.viruta.compartido.ErrorNegocio;
import com.acerrinlab.viruta.notificaciones.CanalWhatsapp;
import com.acerrinlab.viruta.usuarios.DatosUsuario;
import com.acerrinlab.viruta.usuarios.PerfilGoogle;
import com.acerrinlab.viruta.usuarios.Rol;
import com.acerrinlab.viruta.usuarios.UsuariosApi;
import com.acerrinlab.viruta.usuarios.VerificadorGoogle;

@Service
class ServicioUsuarios implements UsuariosApi, CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ServicioUsuarios.class);
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Duration VIGENCIA_CODIGO = Duration.ofMinutes(10);
    private static final Duration ESPERA_REENVIO = Duration.ofSeconds(60);
    private static final int INTENTOS_CODIGO = 5;
    private static final ZoneId JUJUY = ZoneId.of("America/Argentina/Jujuy");

    private final RepositorioUsuarios usuarios;
    private final RepositorioIngresos ingresos;
    private final RepositorioCodigos codigos;
    private final PasswordEncoder codificador;
    private final ServicioJwt jwt;
    private final LimitadorIntentos limitador;
    private final VerificadorGoogle google;
    private final CanalWhatsapp whatsapp;
    private final Clock reloj;
    private final String adminEmail;
    private final String adminClave;
    private final List<ListaAdmins.Admin> admins;

    ServicioUsuarios(RepositorioUsuarios usuarios, RepositorioIngresos ingresos, RepositorioCodigos codigos,
            PasswordEncoder codificador, ServicioJwt jwt, Clock reloj, VerificadorGoogle google, CanalWhatsapp whatsapp,
            @Value("${viruta.admin.email:}") String adminEmail,
            @Value("${viruta.admin.password:}") String adminClave,
            @Value("${viruta.admins:}") String admins) {
        this.usuarios = usuarios;
        this.ingresos = ingresos;
        this.codigos = codigos;
        this.codificador = codificador;
        this.jwt = jwt;
        this.reloj = reloj;
        this.google = google;
        this.whatsapp = whatsapp;
        this.limitador = new LimitadorIntentos(5, Duration.ofMinutes(1), reloj);
        this.adminEmail = adminEmail;
        this.adminClave = adminClave;
        this.admins = ListaAdmins.leer(admins);
    }

    /** Lo que recibe el frontend al entrar. */
    record Acceso(String token, long id, String nombre, Rol rol, String email, String fotoUrl, boolean telefonoVerificado) {
    }

    record Perfil(long id, String nombre, String email, Rol rol, String fotoUrl, String telefono, boolean telefonoVerificado,
            boolean conGoogle, boolean conClave) {
    }

    record VistaIngreso(String instante, String metodo, boolean exitoso, String ip, String dispositivo) {
    }

    record CodigoEnviado(String telefono, long venceEnSegundos) {
    }

    /** Datos del cliente HTTP para registrar el inicio de sesion. */
    record Origen(String ip, String agente) {
    }

    // ---------------------------------------------------------------- registro e ingreso

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
        validarRolYConsentimiento(rol, consentimiento);
        if (usuarios.findByEmail(correo).isPresent()) {
            throw ErrorNegocio.conflicto("Ya hay una cuenta con ese email.");
        }
        Usuario u = crear(nombre.trim(), correo, clave, rol);
        return acceso(u);
    }

    @Transactional(noRollbackFor = ErrorNegocio.class)
    Acceso ingresar(String email, String clave, Origen origen) {
        String correo = normalizar(email);
        String llave = origen.ip() + "|" + correo;
        if (!limitador.permitir(llave)) {
            throw new ErrorNegocio(429, "Demasiados intentos. Probá de nuevo en un minuto.");
        }
        Usuario u = usuarios.findByEmail(correo).orElse(null);
        boolean valido = u != null && u.activo && clave != null && u.clave != null && !u.clave.isEmpty()
                && codificador.matches(clave, u.clave);
        if (!valido) {
            registrarIngreso(u, correo, origen, "CLAVE", false);
            throw ErrorNegocio.noAutenticado("Email o contraseña incorrectos.");
        }
        limitador.reiniciar(llave);
        return entrar(u, origen, "CLAVE");
    }

    /**
     * Ingreso con Google: si la cuenta existe (por id de Google o por email) se vincula; si no,
     * se crea con el rol elegido. Los admins maestros quedan como ADMIN.
     */
    @Transactional(noRollbackFor = ErrorNegocio.class)
    Acceso ingresarConGoogle(String credencial, Rol rol, Boolean consentimiento, Origen origen) {
        if (!google.disponible()) {
            throw new ErrorNegocio(503, "El ingreso con Google todavía no está configurado.");
        }
        PerfilGoogle p = google.verificar(credencial)
                .orElseThrow(() -> ErrorNegocio.noAutenticado("No pudimos validar tu cuenta de Google."));
        if (!p.emailVerificado() || p.email() == null) {
            throw ErrorNegocio.noAutenticado("Tu cuenta de Google no tiene el email verificado.");
        }
        String correo = normalizar(p.email());
        Usuario u = usuarios.findByGoogleId(p.id()).or(() -> usuarios.findByEmail(correo)).orElse(null);
        if (u != null && !u.activo) {
            throw ErrorNegocio.noAutenticado("Esta cuenta está desactivada.");
        }
        boolean esAdmin = admins.stream().anyMatch(a -> a.email().equals(correo));
        if (u == null) {
            if (!esAdmin) {
                validarRolYConsentimiento(rol, consentimiento);
            }
            String nombre = p.nombre() == null || p.nombre().isBlank() ? correo.substring(0, correo.indexOf('@')) : p.nombre();
            u = crear(nombre.length() > 80 ? nombre.substring(0, 80) : nombre, correo, null, esAdmin ? Rol.ADMIN : rol);
        }
        u.googleId = p.id();
        if (p.foto() != null && !p.foto().isBlank()) {
            u.fotoUrl = p.foto();
        }
        if (esAdmin) {
            u.rol = Rol.ADMIN;
        }
        usuarios.save(u);
        return entrar(u, origen, "GOOGLE");
    }

    private Acceso entrar(Usuario u, Origen origen, String metodo) {
        String agente = recortar(origen.agente());
        boolean conocido = ingresos.existsByUsuarioIdAndIpAndAgenteAndExitosoTrue(u.id, origen.ip(), agente);
        boolean primero = ingresos.findTop10ByUsuarioIdOrderByInstanteDesc(u.id).stream().noneMatch(i -> i.exitoso);
        registrarIngreso(u, u.email, origen, metodo, true);
        u.ultimoIngreso = reloj.instant();
        usuarios.save(u);
        // Aviso de ingreso desde un dispositivo nuevo, solo si el telefono esta verificado.
        if (!conocido && !primero && u.telefonoVerificado && u.telefono != null && whatsapp.disponible()) {
            avisarSinFallar(u.telefono, "Viruta: se inició sesión en tu cuenta desde un dispositivo nuevo ("
                    + dispositivo(origen.agente()) + "). Si no fuiste vos, cambiá tu contraseña.");
        }
        return acceso(u);
    }

    private void registrarIngreso(Usuario u, String correo, Origen origen, String metodo, boolean exitoso) {
        Ingreso i = new Ingreso();
        i.usuarioId = u == null ? null : u.id;
        i.email = correo.length() > 120 ? correo.substring(0, 120) : correo;
        i.instante = reloj.instant();
        i.ip = origen.ip();
        i.agente = recortar(origen.agente());
        i.metodo = metodo;
        i.exitoso = exitoso;
        ingresos.save(i);
    }

    // ---------------------------------------------------------------- perfil y seguridad

    @Transactional(readOnly = true)
    Perfil perfil(long id) {
        Usuario u = buscarActivo(id);
        return new Perfil(u.id, u.nombre, u.email, u.rol, u.fotoUrl, u.telefono, u.telefonoVerificado,
                u.googleId != null, u.clave != null && !u.clave.isEmpty());
    }

    @Transactional(readOnly = true)
    List<VistaIngreso> ingresosDe(long id) {
        return ingresos.findTop10ByUsuarioIdOrderByInstanteDesc(id).stream().map(ServicioUsuarios::vista).toList();
    }

    /** Manda un codigo de 6 digitos por WhatsApp al telefono indicado. */
    @Transactional
    CodigoEnviado enviarCodigo(long id, String telefono) {
        if (!whatsapp.disponible()) {
            throw new ErrorNegocio(503, "La verificación por WhatsApp todavía no está disponible.");
        }
        Usuario u = buscarActivo(id);
        String tel = Telefonos.normalizar(telefono)
                .orElseThrow(() -> ErrorNegocio.invalido("Escribí el teléfono con código de área, por ejemplo 388 456-7890."));
        Instant ahora = reloj.instant();
        Optional<CodigoVerificacion> previo = codigos.findById(u.id);
        if (previo.isPresent() && previo.get().enviado != null
                && Duration.between(previo.get().enviado, ahora).compareTo(ESPERA_REENVIO) < 0) {
            throw new ErrorNegocio(429, "Esperá un minuto antes de pedir otro código.");
        }
        String codigo = Codigos.nuevo();
        CodigoVerificacion c = previo.orElseGet(CodigoVerificacion::new);
        c.usuarioId = u.id;
        c.telefono = tel;
        c.sal = Codigos.sal();
        c.huella = Codigos.huella(codigo, c.sal);
        c.enviado = ahora;
        c.vence = ahora.plus(VIGENCIA_CODIGO);
        c.intentos = 0;
        codigos.save(c);
        try {
            whatsapp.enviar(tel, "Viruta: tu código de verificación es " + codigo + ". Vence en 10 minutos. No lo compartas.");
        } catch (RuntimeException e) {
            log.warn("No se pudo enviar el codigo por WhatsApp: {}", e.getMessage());
            throw new ErrorNegocio(502, "No pudimos enviar el código. Probá de nuevo en unos minutos.");
        }
        return new CodigoEnviado(Telefonos.ocultar(tel), VIGENCIA_CODIGO.toSeconds());
    }

    @Transactional(noRollbackFor = ErrorNegocio.class)
    Perfil confirmarCodigo(long id, String codigo) {
        Usuario u = buscarActivo(id);
        CodigoVerificacion c = codigos.findById(u.id)
                .orElseThrow(() -> ErrorNegocio.invalido("Primero pedí un código."));
        if (reloj.instant().isAfter(c.vence)) {
            codigos.delete(c);
            throw ErrorNegocio.invalido("El código venció. Pedí uno nuevo.");
        }
        if (c.intentos >= INTENTOS_CODIGO) {
            codigos.delete(c);
            throw new ErrorNegocio(429, "Demasiados intentos. Pedí un código nuevo.");
        }
        if (!Codigos.coincide(codigo, c.sal, c.huella)) {
            c.intentos++;
            codigos.save(c);
            throw ErrorNegocio.invalido("El código no es correcto.");
        }
        u.telefono = c.telefono;
        u.telefonoVerificado = true;
        usuarios.save(u);
        codigos.delete(c);
        return perfil(u.id);
    }

    /** Borra la cuenta: se anonimizan los datos personales y se desactiva (RNF-09). */
    @Transactional
    void borrarCuenta(long id) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos la cuenta."));
        u.nombre = "Cuenta eliminada";
        u.email = "eliminado-" + u.id + "@viruta.invalid";
        u.clave = "";
        u.activo = false;
        u.fotoUrl = null;
        u.telefono = null;
        u.telefonoVerificado = false;
        u.googleId = null;
        usuarios.save(u);
    }

    // ---------------------------------------------------------------- administracion

    record ResumenUsuarios(long total, Map<String, Long> porRol, long telefonosVerificados, long conGoogle,
            long ingresosFallidos, List<Map<String, Object>> registrosPorDia, List<Map<String, Object>> ultimos,
            List<Map<String, Object>> ingresos) {
    }

    @Transactional(readOnly = true)
    ResumenUsuarios resumen() {
        Map<String, Long> porRol = new LinkedHashMap<>();
        for (Rol r : Rol.values()) {
            porRol.put(r.name(), usuarios.countByActivoTrueAndRol(r));
        }
        LocalDate hoy = LocalDate.now(reloj.withZone(JUJUY));
        Map<LocalDate, Long> dias = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            dias.put(hoy.minusDays(i), 0L);
        }
        for (Usuario u : usuarios.findByActivoTrueAndCreadoAfter(hoy.minusDays(30).atStartOfDay(JUJUY).toInstant())) {
            dias.computeIfPresent(u.creado.atZone(JUJUY).toLocalDate(), (d, n) -> n + 1);
        }
        List<Map<String, Object>> registros = dias.entrySet().stream()
                .map(e -> Map.<String, Object>of("dia", e.getKey().toString(), "cantidad", e.getValue())).toList();
        List<Map<String, Object>> ultimos = usuarios.findTop10ByActivoTrueOrderByCreadoDesc().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.id);
            m.put("nombre", u.nombre);
            m.put("email", u.email);
            m.put("rol", u.rol.name());
            m.put("fotoUrl", u.fotoUrl);
            m.put("creado", u.creado == null ? null : u.creado.toString());
            m.put("telefonoVerificado", u.telefonoVerificado);
            m.put("conGoogle", u.googleId != null);
            return m;
        }).toList();
        List<Map<String, Object>> recientes = ingresos.findTop20ByOrderByInstanteDesc().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("email", i.email);
            m.put("instante", i.instante.toString());
            m.put("metodo", i.metodo);
            m.put("exitoso", i.exitoso);
            m.put("dispositivo", dispositivo(i.agente));
            return m;
        }).toList();
        return new ResumenUsuarios(usuarios.countByActivoTrue(), porRol,
                usuarios.countByActivoTrueAndTelefonoVerificadoTrue(), usuarios.countByActivoTrueAndGoogleIdIsNotNull(),
                ingresos.countByExitosoFalse(), registros, ultimos, recientes);
    }

    boolean whatsappDisponible() {
        return whatsapp.disponible();
    }

    // ---------------------------------------------------------------- API para otros modulos

    @Override
    @Transactional(readOnly = true)
    public Optional<DatosUsuario> buscar(long id) {
        return usuarios.findById(id).map(u -> new DatosUsuario(u.id, u.nombre, u.email, u.rol, u.fotoUrl));
    }

    @Override
    public long contar() {
        return usuarios.countByActivoTrue();
    }

    /** Crea o asciende a los administradores configurados por variables de entorno. */
    @Override
    @Transactional
    public void run(String... args) {
        if (!adminEmail.isBlank() && adminClave.length() >= 8) {
            asegurarAdmin("Administrador", normalizar(adminEmail), adminClave);
        }
        for (ListaAdmins.Admin a : admins) {
            asegurarAdmin(a.nombre(), a.email(), a.clave());
        }
    }

    private void asegurarAdmin(String nombre, String correo, String clave) {
        Optional<Usuario> existente = usuarios.findByEmail(correo);
        if (existente.isEmpty()) {
            crear(nombre, correo, clave.isEmpty() ? null : clave, Rol.ADMIN);
            log.info("Administrador creado: {}", correo);
        } else if (existente.get().rol != Rol.ADMIN) {
            Usuario u = existente.get();
            u.rol = Rol.ADMIN;
            usuarios.save(u);
            log.info("Usuario ascendido a administrador: {}", correo);
        }
    }

    // ---------------------------------------------------------------- utilidades

    private Usuario buscarActivo(long id) {
        return usuarios.findById(id).filter(u -> u.activo)
                .orElseThrow(() -> ErrorNegocio.noEncontrado("No encontramos la cuenta."));
    }

    private Acceso acceso(Usuario u) {
        return new Acceso(jwt.generar(u.id, u.rol), u.id, u.nombre, u.rol, u.email, u.fotoUrl, u.telefonoVerificado);
    }

    private static void validarRolYConsentimiento(Rol rol, Boolean consentimiento) {
        if (rol != Rol.CLIENTE && rol != Rol.CARPINTERIA) {
            throw ErrorNegocio.invalido("Elegí si sos cliente o carpintería.");
        }
        if (!Boolean.TRUE.equals(consentimiento)) {
            throw ErrorNegocio.invalido("Necesitamos tu consentimiento para usar tus datos.");
        }
    }

    /** clave null: cuenta sin contrasena (solo Google). Se guarda una cadena vacia que nunca coincide. */
    private Usuario crear(String nombre, String correo, String clave, Rol rol) {
        Usuario u = new Usuario();
        u.nombre = nombre;
        u.email = correo;
        u.clave = clave == null ? "" : codificador.encode(clave);
        u.rol = rol;
        u.activo = true;
        u.consentimiento = true;
        u.creado = reloj.instant();
        return usuarios.save(u);
    }

    private void avisarSinFallar(String telefono, String mensaje) {
        try {
            whatsapp.enviar(telefono, mensaje);
        } catch (RuntimeException e) {
            log.warn("No se pudo enviar el aviso de ingreso: {}", e.getMessage());
        }
    }

    private static VistaIngreso vista(Ingreso i) {
        return new VistaIngreso(i.instante.toString(), i.metodo, i.exitoso, ocultarIp(i.ip), dispositivo(i.agente));
    }

    private static String ocultarIp(String ip) {
        if (ip == null) {
            return "";
        }
        int corte = ip.lastIndexOf('.');
        return corte > 0 ? ip.substring(0, corte) + ".x" : ip;
    }

    /** Nombre corto del navegador y sistema, para que la persona reconozca el dispositivo. */
    static String dispositivo(String agente) {
        if (agente == null || agente.isBlank()) {
            return "Dispositivo desconocido";
        }
        String a = agente.toLowerCase(Locale.ROOT);
        String sistema = a.contains("android") ? "Android" : a.contains("iphone") || a.contains("ipad") ? "iOS"
                : a.contains("windows") ? "Windows" : a.contains("mac os") ? "Mac" : a.contains("linux") ? "Linux" : "Otro";
        String navegador = a.contains("edg/") ? "Edge" : a.contains("chrome") ? "Chrome" : a.contains("firefox") ? "Firefox"
                : a.contains("safari") ? "Safari" : "Navegador";
        return navegador + " en " + sistema;
    }

    private static String recortar(String agente) {
        if (agente == null) {
            return "";
        }
        return agente.length() > 250 ? agente.substring(0, 250) : agente;
    }

    private static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
