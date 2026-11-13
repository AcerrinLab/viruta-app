# Traspaso: MVP de Viruta (para que otro Claude continúe)

Última actualización: 13/11/2026, 10:35 (hora Argentina).

## Quién y qué
- Usuario: Maximo Acosta Gloss (Maxi), equipo AcerrinLab con José Manuel Fernández. Hackatón del Tren Solar (Jujuy). Habla en español rioplatense.
- Repo de documentación: https://github.com/AcerrinLab/acerrinLab-data (carpeta `doc/`). Los requisitos válidos son DOC-02A (funcionales) y DOC-02B (no funcionales) V0.3; DOC-01, 04A, 05 y 06 fueron reescritos por Claude. RF-10 (costo estimado) fue QUITADO por José.
- Maxi sube los cambios al repo él mismo. No hacer push.

## Pedido del usuario (textual resumido)
1. Generar un MVP local en `C:\Users\Maxi\Desktop\Hackaton` con los monolitos Spring Boot, basado en requisitos funcionales, no funcionales y tecnologías de los DOC.
2. Construir pensando en las pruebas (TDD) y respetarlas.
3. Interfaz intuitiva y minimalista: información concentrada en tarjetas, poco texto, nada abrumador.
4. Sin emojis.
5. Al terminar: guía para subirlo a la web.
6. Si se acerca el límite de tokens de 5 h: detenerse y actualizar este archivo para que otro Claude siga.

## Restricciones del entorno
- Maven Central está bloqueado en el contenedor: el backend NO se puede compilar acá. Las clases sin dependencias de Spring se verificaron con un "shim" de JUnit propio (ver abajo). El usuario va a correr `mvn test` en IntelliJ (File > Open > Viruta-backend > pestaña Maven > Lifecycle > test) y pegar errores si aparecen.
- La conexión con la PC del usuario (herramientas mcp__remote-devices__) estaba caída a las 10:17. Si vuelve, copiar `/home/claude/Viruta` a `C:\Users\Maxi\Desktop\Hackaton\Viruta` (sin node_modules ni dist) con device_commit_files (requiere pasar por /mnt/user-data/outputs). Si no vuelve, entregar un .zip con SendUserFile.
- npm sí funciona.

## Estado (dónde está todo): /home/claude/Viruta
### Viruta-backend (Java 21, Spring Boot 4.0.0, monolito modular) -- código completo
- Paquete `com.acerrinlab.viruta`. Cada módulo expone `XxxApi` y oculta lo demás en `interno/`.
- Módulos: usuarios (JWT HS256 propio, BCrypt, límite 5 intentos/min, roles CLIENTE/CARPINTERIA/ADMIN), diseno (plantillas ESTANTE/MESA/BAJO_MESADA con rangos en mm, GeneradorPiezas, ValidadorEspacio, proyectos), materiales (Strategy por material, CalculadorPlacas con redondeo hacia arriba, tornillos/bisagras/litros), carpinterias (perfil, zonas de Jujuy, ficha pública sin WhatsApp/dirección), pedidos (copia fija del diseño, clave de envío idempotente, máquina de estados EstadoPedido, vencimientos 72 h/7 días), pagos (Adapter simulado y Mercado Pago, webhook con firma HMAC, comisión 10% configurable, seña 50%), notificaciones (n8n con reintentos, SSE en /api/eventos), traccion (lista de espera, /api/metricas solo ADMIN).
- Configuración: `application.properties` lee todo de variables de entorno; perfil `dev` usa H2 en archivo; pruebas usan perfil `test` (H2 en memoria).
- Pruebas: 10 clases unitarias (68 pruebas, TODAS PASAN con el shim) + 4 de integración en `src/test/.../api/` (DisenoApiTest, SeguridadApiTest, PedidosApiTest, TraccionApiTest; base PruebaApi y CanalDePrueba). Las de integración NO se ejecutaron (necesitan Spring). ArquitecturaModulosTest verifica que ningún módulo importe el `interno` de otro.
- Para re-verificar unitarias sin Maven: el shim está en /tmp/shim (puede haberse borrado; es un Test.java, Assertions.java y runner.Run mínimos). Compilar con javac los archivos sin imports de springframework/jakarta/slf4j/jayway (excluir VistaProyecto.java) y correr runner.Run con las clases *Test.

### Viruta-frontend (React 18 + Vite 5 + React Three Fiber + model-viewer) -- código completo
- `npm install`, `npx vitest run` (14 pruebas pasan), `npx vite build` (compila). three fue subido a ^0.183.0 por el peer de model-viewer.
- Páginas: Inicio (lista de espera con contador), Disenar (3 pasos: plantilla, medir y ajustar con visor 3D y AR, qué comprar), Acceso, Carpinterias (mapa Google si hay VITE_GOOGLE_MAPS_KEY, si no lista), MisPedidos, PagoSimulado, Panel (perfil, bandeja con pestañas, detalle con presupuesto y estados, resumen), Metricas.
- Variables: VITE_API_URL, VITE_GOOGLE_MAPS_KEY. `vercel.json` con rewrite a index.html.

## Falta (en este orden)
1. [x] Docker: `Viruta-backend/Dockerfile` (multi-stage maven:3.9-eclipse-temurin-21 -> eclipse-temurin:21-jre), `docker-compose.yml` en la raíz con MySQL 8 + backend, `.env.example` en la raíz (DB_*, JWT_SECRETO, CORS_ORIGENES, FRONTEND_URL, BACKEND_URL, ADMIN_EMAIL/PASSWORD, PAGOS_MODO, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRETO, N8N_WEBHOOK_URL, COMISION_PORCENTAJE, SENA_PORCENTAJE), `.gitignore`.
2. [x] README.md de la raíz: qué es, cómo correr local (IntelliJ con perfil dev, o docker compose), cómo correr pruebas, mapa de requisitos a pruebas.
3. [x] GUIA_DESPLIEGUE.md: frontend en Vercel; backend + MySQL en un servicio con Docker (ej. Render/Railway); variables; Mercado Pago (webhook a /api/pagos/webhook); n8n; checklist de seguridad (sin claves en el repo).
4. [ ] Copiar todo a la carpeta del usuario (ver restricciones) o mandar zip.
5. [ ] Avisar al usuario: qué está verificado y qué no (integración backend sin ejecutar), y pedirle que corra `mvn test` en IntelliJ.
