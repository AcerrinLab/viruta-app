# Viruta: traspaso completo (estado al 14/11/2026)

Este documento sirve para que cualquier persona, o cualquier Claude desde otra cuenta, pueda seguir el
proyecto sin preguntar nada. Tiene tres partes: qué hace falta para que funcionen todas las APIs, cómo
correr y probar, y el detalle de cada cambio que se hizo.

---

## 1. Estado del repositorio

- Repo: `AcerrinLab/viruta-app`, con dos carpetas: `Viruta-backend` (Spring Boot 4, Java 21) y `Viruta-frontend` (React 18 + Vite 5 + React Three Fiber).
- Ramas:
  - `main`: MVP original.
  - `develop`: incluye el rediseño (`feature/001-nueva-version-diseno`, mergeado por el PR #1).
  - `feature/002-comunidad-relicario-y-admin`: rama actual. Sale de `develop` y todavía no está mergeada. Tiene 7 commits (ver la sección 5).
- Pruebas: el backend tiene 153 pruebas (JUnit + MockMvc con H2 en memoria) y pasan todas. El frontend tiene 14 pruebas con Vitest y el build de Vite compila.
- Convenciones: nombres en español (clases, variables, endpoints), sin emojis en la interfaz, monolito modular (un módulo nunca importa el paquete `interno` de otro; lo verifica `ArquitecturaModulosTest`), pruebas primero para la lógica de negocio.

---

## 2. Qué hace falta para que funcionen TODAS las APIs

### 2.1 Backend: variables de entorno

Todas se leen en `Viruta-backend/src/main/resources/application.properties`. El ejemplo completo está en `.env.example`, en la raíz del repo.

| Variable | Para qué | Obligatoria | Cómo conseguirla |
|---|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | MySQL 8 en producción | Sí (prod) | Railway/Render crean la base. En desarrollo el perfil `dev` usa H2 en archivo (`./data/viruta`). |
| `JWT_SECRETO` | Firma de los tokens de sesión (HS256) | Sí | Cadena al azar de 32+ caracteres. |
| `CORS_ORIGENES` | Orígenes que pueden llamar a la API, separados por coma | Sí | URL de Vercel + `http://localhost:5173`. |
| `FRONTEND_URL`, `BACKEND_URL` | Direcciones públicas (retorno de pagos y webhooks) | Sí (prod) | Las URLs de Vercel y del backend. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Un admin simple (compatibilidad con el MVP) | No | Cualquiera. En `dev`: `admin@viruta.local` / `admin12345`. |
| `VIRUTA_ADMINS` | Administradores maestros (panel `/admin`) | Recomendada | Formato `Nombre|email|clave;Nombre|email|clave`. Sin clave (`Nombre|email`) entra solo con Google. Al arrancar se crean o se ascienden a ADMIN. |
| `GOOGLE_CLIENT_ID` | Ingreso con Google (el backend valida el ID token) | No (sin ella el botón no aparece) | Ver 2.3. |
| `WISHLIST_SHEETS_URL` | Contador de la lista de espera desde Google Sheets | No (sin ella usa la lista local) | Ver 2.4. |
| `PAGOS_MODO` | `simulado` (demo) o `mercadopago` | Sí | `simulado` hasta tener Mercado Pago. |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRETO` | Cobro real de señas con Mercado Pago | Solo con `mercadopago` | Ver 2.5. |
| `N8N_WEBHOOK_URL` | Flujo de n8n que reenvía avisos por WhatsApp | No | Ver 2.6. |
| `WHATSAPP_HABILITADO` | Prende WhatsApp: verificación de teléfono y avisos | No (por defecto `false`) | Ponelo en `true` solo cuando n8n ya mande por la API de Meta. |
| `COMISION_PORCENTAJE`, `SENA_PORCENTAJE` | Negocio (comisión del taller y seña) | Tienen valor por defecto | 10 y 50. |

### 2.2 Frontend (Vercel): variables

En `Viruta-frontend/.env.local` para desarrollo, o en Vercel > Settings > Environment Variables:

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL pública del backend, sin barra al final. |
| `VITE_GOOGLE_CLIENT_ID` | El mismo client id que `GOOGLE_CLIENT_ID`. Sin esta variable no aparece el botón; en desarrollo se ve un aviso "falta configurar". |
| `VITE_WISHLIST_URL` | Página pública de la lista de espera. Por defecto: `https://viruta-wishlist.vercel.app/`. |
| `VITE_GOOGLE_MAPS_KEY` | Opcional: mapa de carpinterías. Sin clave se muestran en lista. |

### 2.3 Google (ingreso con Google)

1. console.cloud.google.com > crear proyecto.
2. APIs y servicios > Pantalla de consentimiento de OAuth: Externa, nombre "Viruta", email de soporte.
3. Credenciales > Crear credenciales > ID de cliente de OAuth > Aplicación web.
4. Orígenes autorizados de JavaScript: `http://localhost:5173` y la URL de Vercel.
5. Copiar el client id (termina en `.apps.googleusercontent.com`) en `GOOGLE_CLIENT_ID` (backend) y en `VITE_GOOGLE_CLIENT_ID` (frontend).

El backend valida el token con Spring Security (`spring-security-oauth2-jose`): revisa la firma con las claves públicas de Google (`https://www.googleapis.com/oauth2/v3/certs`), el emisor, la audiencia (el client id) y el vencimiento. El código está en `usuarios/interno/VerificadorGoogleJwt.java`.

### 2.4 Contador de la lista de espera (Google Sheets)

La wishlist (`viruta-wishlist`, en Vercel) guarda las inscripciones en una planilla con un Apps Script (`doPost`). Para que la app pueda leer el conteo, hay que agregarle un `doGet` y volver a implementar (Implementar > Administrar implementaciones > editar > Nueva versión):

```js
function doGet() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  function filas(nombre) {
    var hoja = libro.getSheetByName(nombre);
    return hoja ? Math.max(0, hoja.getLastRow() - 1) : 0;
  }
  var datos = { clientes: filas('CLIENT'), talleres: filas('WORKSHOP') };
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}
```

Después, la URL `/exec` va en `WISHLIST_SHEETS_URL`. El backend la consulta con un timeout de 8 s y guarda el resultado 5 minutos. Si falla, usa el último valor; si nunca leyó nada, usa la lista local. `GET /api/lista-espera/contador` devuelve `fuente: "wishlist"` o `"local"`.

### 2.5 Mercado Pago (cobro de señas)

1. Crear una aplicación en mercadopago.com.ar/developers y copiar el Access Token (primero el de prueba).
2. Configurar el webhook hacia `{BACKEND_URL}/api/pagos/webhook` y copiar la clave secreta en `MP_WEBHOOK_SECRETO`.
3. `PAGOS_MODO=mercadopago`. Mientras tanto, `simulado` usa `/pago-simulado` para aprobar.

### 2.6 WhatsApp (API de Meta + n8n): APAGADO por ahora

Falta la API de Meta (WhatsApp Business Cloud API). Mientras `WHATSAPP_HABILITADO=false`:
- La verificación de teléfono responde 503 y en Cuenta > Seguridad se muestra "Verificación por WhatsApp: próximamente".
- Los avisos de pedidos y de inicios de sesión nuevos solo quedan en el log y en el panel; no se intenta enviar nada.
- `GET /api/auth/opciones` devuelve `whatsapp: false`.

Para prenderlo:
1. En Meta for Developers, crear una app de tipo Business y agregar el producto WhatsApp. Conseguir un número, el `phone_number_id` y un token permanente. Aprobar una plantilla de mensaje para los códigos y los avisos.
2. En n8n, crear un flujo con disparador Webhook (POST, recibe `{"telefono": "3884567890", "mensaje": "..."}`) y un nodo HTTP a `https://graph.facebook.com/v{versión}/{phone_number_id}/messages`, con el número en formato `549` + 10 dígitos.
3. Cargar `N8N_WEBHOOK_URL` con la URL del webhook y `WHATSAPP_HABILITADO=true`.

### 2.7 Lo que ya funciona sin configurar nada

Diseño 3D y AR, cálculo de piezas y materiales (incluido el relicario), proyectos, pedidos, presupuestos, estados, pagos simulados, panel de carpintería, testimonios y panel de administración.

---

## 3. Cómo correr y probar

### Backend
- IntelliJ: abrir `Viruta-backend`, correr `VirutaApplication` con el perfil `dev` (H2 en archivo, sin Docker).
- Línea de comandos: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`.
- Pruebas: `mvn test` (usa el perfil `test` con H2 en memoria).
- En la PC de José: `JAVA_HOME=~/.jdks/temurin-25.0.5` y Maven del wrapper en `~/.m2/wrapper/dists/apache-maven-3.10.0/.../bin/mvn`.
- Docker: `docker compose up` desde la raíz (MySQL + backend).

### Frontend
- `cd Viruta-frontend && npm install && npm run dev` (puerto 5173).
- Pruebas: `npx vitest run`. Build: `npx vite build`.

### Usuarios para probar en `dev`
- Admin: `admin@viruta.local` / `admin12345`, o los que cargues en `VIRUTA_ADMINS`.
- Clientes y carpinterías: se registran desde `/ingresar` > Crear una.

### Cuidado con bases que ya tienen datos
`spring.jpa.hibernate.ddl-auto=update` agrega columnas solo. Si una columna nueva es obligatoria, tiene que tener valor por defecto (`@ColumnDefault`), porque si no la migración falla con las filas existentes. Ya pasó con `telefono_verificado` y está corregido.

---

## 4. Mapa de la API (todos los endpoints)

Públicos: `POST /api/auth/registro`, `POST /api/auth/ingreso`, `POST /api/auth/google`, `GET /api/auth/opciones`, `GET /api/plantillas`, `POST /api/disenos/calcular`, `GET /api/carpinterias`, `GET /api/testimonios`, `GET/POST /api/lista-espera...`, `POST /api/pagos/webhook`, `GET /api/salud`.

Cualquier usuario autenticado: `GET/DELETE /api/usuarios/yo`, `GET /api/usuarios/yo/ingresos`, `POST /api/usuarios/yo/telefono`, `POST /api/usuarios/yo/telefono/confirmar`, `GET /api/testimonios/mio`, `POST /api/testimonios`, `GET /api/eventos` (SSE).

Cliente: `/api/proyectos/**`, `/api/pedidos/**` (crear, ver, rechazar, cancelar), `/api/pagos/**`.

Carpintería: `/api/carpinteria/perfil`, `/zonas`, `/resumen`, `/pedidos/**` (presupuesto, estado, cancelar).

Admin (`hasRole('ADMIN')` por ruta y con `@PreAuthorize`): `GET /api/metricas`, `GET /api/admin/usuarios`, `GET /api/admin/pedidos`, `GET/POST /api/admin/testimonios`, `PUT /api/admin/testimonios/{id}/aprobar|ocultar`, `DELETE /api/admin/testimonios/{id}`.

---

## 5. Detalle de todos los cambios

### 5.1 feature/001-nueva-version-diseno (ya en develop)

Rediseño estético sin cambios funcionales, en 7 commits:

1. **Sistema Warm Craft Minimal** (`455560c`): tokens en `src/estilos.css` (verde `#2B4C38` para clientes, nogal `#6E4E37` para talleres con `body[data-rol="taller"]`, Plus Jakarta Sans), vidrio (liquid glass) tomado de `viruta-wishlist/styles.css`, selector segmentado tipo iOS (`Selector` en `componentes/Comunes.jsx`), acceso con tarjeta partida y dos ilustraciones propias (`componentes/Ilustraciones.jsx`), texturas de madera generadas en el navegador (`lib/madera.js`) para el visor 3D y la AR.
2. **Botones e íconos** (`dafb0b4`): botones estilo iOS 27.2 (relleno suave, texto en el color del rol), íconos de línea propios (`componentes/Iconos.jsx`; los SF Symbols no se pueden usar en web por licencia), escenario del editor con cuadrícula de 10 cm, sombra y medidas, y avatar del usuario en la barra.
3. **Tema oscuro y celular** (`e18cd03`): paleta oscura (`html[data-tema="oscuro"]`), botón de tema (`lib/tema.js`) y barra de pestañas inferior en el celular.
4. **Luces y cuenta** (`7b8b616`): luces de colores detrás del vidrio y página `/cuenta` por rol (`paginas/Cuenta.jsx`).
5. **Cuenta estática y menú limpio** (`00ca7f7`): menú lateral apoyado en la página, menú de usuario como lista con interruptores, luces configurables (prender, apagar y movimiento) y hub de cuenta en el celular.
6. **Buscador y tablero** (`e5039ce`): buscador con Ctrl+K (`componentes/Buscador.jsx`), tablero del taller en grilla (`componentes/TableroTaller.jsx`), login e inicio centrados en tablet, y menú de cuenta que se pliega.
7. **Filtros y estadísticas** (`04df182`): filtro de pedidos en el celular, estadísticas en tarjetas (`componentes/TarjetasTaller.jsx`) y accesos recientes en el menú lateral.

### 5.2 feature/002-comunidad-relicario-y-admin (rama actual)

**`312ffe0` Relicario**
- `diseno/Plantilla.java`: nuevo campo `coleccion` (`CLASICOS` o `ANTIGUOS`) y plantilla `RELICARIO` (ancho 45-100 cm, alto 120-200 cm, fondo 30-50 cm, 1-5 estantes).
- `diseno/interno/GeneradorPiezas.java`: método `relicario()`, que arma laterales, base, techo, zócalo de 8 cm, fondo, estantes de vidrio de 6 mm repartidos parejo y puertas vidriadas (montantes y travesaños de 50 mm con un paño de vidrio de 4 mm). En el despiece, el largo siempre es la medida mayor.
- `materiales/RolPieza.java`: rol `VIDRIO` (sin herrajes). `CalculadorMateriales` no cuenta el vidrio en placas ni en superficie, y `ListaMateriales` informa `vidrioM2` aparte.
- `GET /api/plantillas` incluye `coleccion`.
- Frontend: `lib/diseno.js` (plantilla y `COLECCIONES`), `paginas/Disenar.jsx` (catálogo por colecciones, borde violeta `#7B5EA7` y sello "Nuevo"), `Visor3D.jsx` y `VistaAR.jsx` (vidrio translúcido), `Comunes.jsx` (nota de m² de vidrio).
- Pruebas: `RelicarioTest`, `VidrioTest`.

**`492266e` Backend de cuentas, comunidad y admin**
- `pom.xml`: se agregó `spring-security-oauth2-jose`.
- Módulo usuarios:
  - `Usuario` suma `fotoUrl`, `telefono`, `telefonoVerificado`, `googleId` y `ultimoIngreso`.
  - Entidades nuevas: `Ingreso` (cada intento de ingreso, con IP, dispositivo, método y resultado) y `CodigoVerificacion` (solo la huella SHA-256 con sal del código).
  - Clases puras con prueba: `Telefonos` (normaliza números de Argentina a 10 dígitos), `Codigos` (6 dígitos con `SecureRandom`, comparación en tiempo constante) y `ListaAdmins` (lee `VIRUTA_ADMINS`).
  - `ServicioUsuarios` (reescrito):
    - Ingreso con Google: vincula por `googleId` o por email, y crea la cuenta con rol y consentimiento.
    - Registro de cada ingreso, con aviso de dispositivo nuevo si el teléfono está verificado.
    - Verificación de teléfono: vence a los 10 minutos, permite 5 intentos y reenvío cada 60 segundos.
    - Resumen para el panel admin, y creación o ascenso de los admins maestros.
  - Interfaces públicas `VerificadorGoogle` y `PerfilGoogle`, con la implementación `VerificadorGoogleJwt`.
  - `ConfiguracionSeguridad`: `@EnableMethodSecurity`, `/api/admin/**` solo para ADMIN, y `GET /api/testimonios` público.
- Módulo nuevo `comunidad`: `Testimonio` y `ControladorTestimonios`. Cada persona deja su comentario, que queda pendiente. El admin carga, aprueba, oculta o borra. La foto sale de la cuenta (Google) cada vez que se lee.
- Módulo pedidos: `ControladorAdminPedidos` (pedidos por estado y por día, monto aceptado y talleres activos).
- Módulo tracción: `ConteoWishlist` y `FuenteWishlist` (contador desde Sheets, con respaldo local).
- Pruebas nuevas: `VerificacionTest`, `ConteoWishlistTest`, `CuentasApiTest`, `ComunidadApiTest`. `CanalDePrueba` ahora también simula a Google.

**`c6f1650` Pantallas**
- `componentes/BotonGoogle.jsx`: botón oficial de Google Identity Services.
- `componentes/SeguridadCuenta.jsx`: teléfono, inicios de sesión recientes y comentario propio.
- `componentes/Testimonios.jsx`: sección del inicio y componente `Avatar` con foto.
- `paginas/Admin.jsx`: panel `/admin` con resumen, usuarios, pedidos, testimonios, lista de espera e inicios de sesión. `/metricas` redirige al panel y se borró `Metricas.jsx`.
- `paginas/Inicio.jsx`: la lista de espera ya no pide email; muestra los contadores y lleva a la wishlist.
- `paginas/Cuenta.jsx`: secciones "Mi comentario" y "Seguridad" nuevas, y fotos de perfil.

**`0fa8afb`** Guía de configuración en `GUIA_DESPLIEGUE.md`.

**`3c3f94e`** `telefono_verificado` con `@ColumnDefault("false")`. Sin eso, la app no arrancaba sobre una base con usuarios.

**`1408181`** El aro del avatar grande abraza solo al avatar (antes se estiraba a todo el ancho). En desarrollo se ve un aviso si falta el client id de Google.

**`4bedace` Correcciones**
- Relicario: frente de 3 paños de vidrio desde 75 cm (1 hasta 60 cm, 2 hasta 74 cm), ancho inicial de 90 cm.
- Visor 3D: al sumar estantes, las piezas quedaban con el material equivocado (franjas blancas, puertas opacas). El motivo era que React reutilizaba el mismo material de three.js al pasar de vidrio a madera, y three.js no recompila el shader. Se arregló con una `key` por material y por rol.
- WhatsApp apagado por defecto (`viruta.whatsapp.habilitado`). `CanalWhatsapp` suma `disponible()`, `CanalN8n` solo envía si está habilitado y hay webhook, la verificación devuelve 503 y la cuenta muestra "próximamente".
- Mis pedidos: filtros por estado (agrupados) y por carpintería, orden por precio y miniatura de frente del mueble (`componentes/Miniatura.jsx`). La bandeja del taller también muestra la miniatura.
- Pruebas: tres paños del relicario y `CanalN8nTest`.

---

## 6. Pendiente y decisiones abiertas

- **Testimonios:** no hay ninguno cargado. Se cargan desde `/admin/testimonios` y no se inventan.
- **Google:** falta crear el client id (2.3).
- **WhatsApp:** falta la API de Meta (2.6).
- **Wishlist:** falta agregar el `doGet` a la planilla (2.4).
- **Relicario:** hoy es una vitrina rectangular. El visor solo dibuja cajas alineadas a los ejes, así que la versión esquinera con laterales en ángulo (como la foto de referencia) necesita piezas rotadas en el modelo y en el visor.
- **Push:** José sube los cambios. Para esta rama: `git push -u origin feature/002-comunidad-relicario-y-admin` y después un PR hacia `develop`.
