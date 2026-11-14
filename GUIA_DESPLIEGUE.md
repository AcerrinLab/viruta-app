# Guía para subir Viruta a la web

Tres piezas:

| Pieza | Dónde | Por qué |
|---|---|---|
| Frontend | Vercel | Lo indica DOC-02B (RNF-13). Despliega solo desde GitHub. |
| Backend + MySQL | Un servicio que corra Docker (en esta guía, Railway) | El backend ya tiene `Dockerfile`. |
| Avisos por WhatsApp | n8n | Opcional. Sin n8n, los pedidos igual llegan al panel. |

Orden: primero el backend (para tener su dirección), después el frontend, y al final volver al backend para cargar la dirección del frontend.

Antes de empezar: revisá los planes y límites vigentes de cada servicio, y configurá límites de uso (RNF-14).

---

## Paso 0. Subir el código a GitHub

1. Creá un repositorio (por ejemplo `AcerrinLab/viruta-app`) y subí la carpeta `Viruta` completa.
2. Comprobá que **no** se subió ningún `.env`. El `.gitignore` ya los excluye.
3. En GitHub: **Settings > Code security** y activá **Secret scanning** (RNF-08).

## Paso 1. Backend y base de datos (Railway)

1. Entrá a railway.com con tu cuenta de GitHub y creá un proyecto nuevo.
2. **Add > Database > MySQL**. Railway crea la base y sus variables (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`).
3. **Add > GitHub Repo** y elegí tu repositorio. En la configuración del servicio poné **Root Directory** = `Viruta-backend`. Railway detecta el `Dockerfile`.
4. En **Variables** del backend cargá:

| Variable | Valor |
|---|---|
| `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=true&serverTimezone=UTC` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `JWT_SECRETO` | Una cadena al azar de 32 caracteres o más |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tu usuario para ver las métricas |
| `PAGOS_MODO` | `simulado` por ahora |
| `COMISION_PORCENTAJE` | `10` |
| `SENA_PORCENTAJE` | `50` |
| `CORS_ORIGENES`, `FRONTEND_URL` | Se completan en el paso 3 |
| `BACKEND_URL` | La dirección pública del backend (paso 5) |

5. **Settings > Networking > Generate Domain**. Anotá la dirección, por ejemplo `https://viruta-backend.up.railway.app`, y cargala en `BACKEND_URL`.
6. Comprobá que responde: `https://<tu-backend>/api/salud` debe mostrar `{"estado":"ok"}`.

Para generar `JWT_SECRETO` en PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | % {[char]$_})
```

## Paso 2. Frontend (Vercel)

1. Entrá a vercel.com con GitHub: **Add New > Project** y elegí el repositorio.
2. **Root Directory** = `Viruta-frontend`. Vercel detecta Vite solo.
3. En **Environment Variables**:
   - `VITE_API_URL` = la dirección del backend del paso 1, sin barra al final.
   - `VITE_GOOGLE_MAPS_KEY` = tu clave (opcional, ver paso 6).
4. **Deploy**. Anotá la dirección, por ejemplo `https://viruta.vercel.app`.

## Paso 3. Conectar los dos

En Railway, en las variables del backend:

- `CORS_ORIGENES` = `https://viruta.vercel.app`
- `FRONTEND_URL` = `https://viruta.vercel.app`

Guardá: Railway redespliega solo. Probá registrarte y diseñar un mueble desde el celular.

## Paso 4. Probar con personas (H5 de DOC-05)

Seguí el recorrido de la sección 1 del `README.md` con el pago simulado. Registrá qué les costó a las personas y sacá capturas de las métricas (`/metricas` con el usuario administrador): son la evidencia de tracción.

## Paso 5. Cobrar señas de verdad con Mercado Pago

1. En developers.mercadopago.com creá una aplicación (Checkout Pro). Copiá el **Access Token** de producción.
2. En la aplicación, **Webhooks > Configurar notificaciones**:
   - URL: `https://<tu-backend>/api/pagos/webhook`
   - Evento: **Pagos**
   - Copiá la **clave secreta** que muestra.
3. En Railway:
   - `PAGOS_MODO` = `mercadopago`
   - `MP_ACCESS_TOKEN` = el Access Token
   - `MP_WEBHOOK_SECRETO` = la clave secreta del webhook
4. Hacé una prueba con un monto chico. El pedido pasa a *Seña pagada* solo cuando llega el aviso firmado de Mercado Pago.

Probá primero con las credenciales de prueba de Mercado Pago antes de pasar a producción.

## Paso 6. Mapa de Google (opcional)

1. En console.cloud.google.com creá un proyecto y activá **Maps JavaScript API**.
2. Creá una clave y restringila: **Application restrictions > Websites** con tu dirección de Vercel, y **API restrictions > Maps JavaScript API**.
3. Cargala en Vercel como `VITE_GOOGLE_MAPS_KEY` y redesplegá.

Si Maps falla o no hay clave, la app muestra la lista de carpinterías (RNF-11).

## Paso 7. Aviso por WhatsApp con n8n (opcional)

1. En n8n creá un flujo: **Webhook** (método POST) seguido de un nodo **WhatsApp Business Cloud > Send message**.
2. En el nodo de WhatsApp usá `{{$json.body.telefono}}` como destinatario y `{{$json.body.mensaje}}` como texto.
3. Activá el flujo y copiá la **Production URL** del webhook.
4. En Railway: `N8N_WEBHOOK_URL` = esa dirección.

Si n8n falla, el backend reintenta tres veces y el pedido queda igual en el panel (RF-16).

---

## Antes de mostrarlo

- [ ] `/api/salud` responde en la dirección pública.
- [ ] El sitio abre con `https://` en Android y en iPhone.
- [ ] No hay claves en el repositorio y el escaneo de secretos está activo.
- [ ] `JWT_SECRETO` y las contraseñas son distintos a los de los ejemplos.
- [ ] El usuario administrador ve `/metricas` y los números coinciden con la base.
- [ ] Si `PAGOS_MODO=mercadopago`, el webhook tiene su clave secreta cargada.
- [ ] Límites de uso configurados en Railway, Vercel y Google Cloud.

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El backend no arranca y dice `JWT_SECRETO debe tener al menos 32 caracteres` | Falta esa variable o es corta. |
| El frontend dice "No pudimos conectar" | `VITE_API_URL` mal escrita, o `CORS_ORIGENES` no tiene la dirección exacta de Vercel. |
| Al recargar una página de Vercel aparece 404 | Falta `vercel.json` en `Viruta-frontend`. |
| El pago queda en *Presupuesto listo* | El webhook de Mercado Pago no llega o la clave secreta no coincide. |
| No aparece la carpintería en el mapa | Le falta la zona o el WhatsApp en su perfil, o no trabaja ese material. |

## Funciones nuevas (feature/002): qué configurar

### Administradores maestros
En el backend, `VIRUTA_ADMINS` con el formato `Nombre|email|clave;Nombre|email|clave`.
Si una persona va sin clave (`Nombre|email`), entra solo con Google usando ese email.
Al arrancar, el backend crea esas cuentas o las asciende a administrador. El panel está en `/admin`.

### Ingreso con Google
1. En console.cloud.google.com > APIs y servicios > Credenciales, creá un "ID de cliente de OAuth" de tipo Aplicación web.
2. En "Orígenes autorizados de JavaScript" agregá la URL del frontend (y `http://localhost:5173` para desarrollo).
3. El mismo client id va en dos lugares: `GOOGLE_CLIENT_ID` (backend) y `VITE_GOOGLE_CLIENT_ID` (frontend, Vercel).
Sin esas variables, el botón no aparece y todo lo demás funciona igual.

### Verificación de teléfono y avisos de ingreso
El código de 6 dígitos y el aviso de "inicio de sesión desde un dispositivo nuevo" salen por el mismo
webhook de n8n que los avisos de pedidos (`N8N_WEBHOOK_URL`). Sin n8n, el mensaje queda solo en el log.
WhatsApp está apagado por defecto hasta tener la API de Meta: cuando el flujo de n8n ya envíe por Meta, poné `WHATSAPP_HABILITADO=true`. Detalle completo en TRASPASO_VIRUTA.md.

### Contador de la lista de espera desde Google Sheets
En el Apps Script de la planilla de la wishlist, agregá esta función junto a `doPost` y volvé a implementar
(Implementar > Administrar implementaciones > editar > Nueva versión):

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

Después poné la URL `/exec` en `WISHLIST_SHEETS_URL` (backend). El inicio muestra esos números
(se actualizan cada 5 minutos) y el botón lleva a la wishlist (`VITE_WISHLIST_URL`, por defecto
https://viruta-wishlist.vercel.app/).

### Testimonios
Se cargan y aprueban desde `/admin/testimonios`. Cada usuario también puede dejar el suyo desde
Cuenta > Mi comentario; queda pendiente hasta que un admin lo aprueba. Si la cuenta entró con Google,
se muestra su foto de perfil.
