# Viruta – MVP

Diseñá tu mueble, probalo en tu espacio, sabé qué comprar y encargalo a una carpintería de Jujuy.

| Carpeta | Qué es | Tecnología |
|---|---|---|
| `Viruta-backend` | API: monolito modular | Java 21, Spring Boot 4, MySQL, JWT |
| `Viruta-frontend` | Aplicación web, mobile first | React 18, Vite, React Three Fiber, model-viewer |

Bases: DOC-02A (requisitos funcionales), DOC-02B (no funcionales), DOC-04A (flujo de arquitectura), DOC-06 (pruebas) del repositorio `acerrinLab-data`.

---

## 1. Correr en tu computadora

Necesitás Java 21, Node 20 o más nuevo, e IntelliJ (o Maven).

### Backend, modo rápido (sin MySQL)

1. En IntelliJ: **File > Open** y elegí la carpeta `Viruta-backend`.
2. Abrí `VirutaApplication` y en **Run > Edit Configurations** poné en *Active profiles*: `dev`.
3. Ejecutá. La API queda en http://localhost:8080 y la documentación en http://localhost:8080/swagger-ui.html

El perfil `dev` usa una base H2 guardada en `Viruta-backend/data/` y crea el usuario administrador `admin@viruta.local` / `admin12345`.

### Backend con MySQL (igual que en producción)

```bash
cp .env.example .env        # completá JWT_SECRETO, claves y ADMIN_*
docker compose up --build
```

### Frontend

```bash
cd Viruta-frontend
npm install
npm run dev
```

Abrí http://localhost:5173. Para que el mapa sea de Google, creá `Viruta-frontend/.env` con `VITE_GOOGLE_MAPS_KEY=...`; sin clave, las carpinterías se muestran en lista.

### Probar el recorrido completo

1. En una ventana normal: **Ingresar > Crear una cuenta > Soy carpintería**. Completá nombre, zona, WhatsApp y materiales.
2. En una ventana privada: diseñá un estante, guardalo, pedí presupuesto a esa carpintería.
3. Como carpintería: el pedido aparece en **Panel** sin recargar. Abrilo y enviá el presupuesto.
4. Como cliente: **Mis pedidos > Aceptar y pagar seña > Aprobar pago** (pago simulado).
5. Como carpintería: marcá medidas verificadas, en fabricación y entregado. El resumen muestra la seña y la comisión.

---

## 2. Pruebas

```bash
cd Viruta-backend && mvn verify     # o en IntelliJ: pestaña Maven > Lifecycle > verify
cd Viruta-frontend && npm test
```

`mvn verify` además exige 80% de cobertura en el motor de materiales (RNF-12). El reporte queda en `Viruta-backend/target/site/jacoco/index.html`.

| Prueba | Qué comprueba | DOC-06 |
|---|---|---|
| `GeneradorPiezasTest` | Casos A (estante) y B (mesa), sus modificaciones y medidas inválidas | N02, N09 |
| `ValidadorEspacioTest` | Caso E: no entra en el espacio, fondo distinto adelante y atrás | N03 |
| `CalculadorPlacasTest` | Casos C1 y C2: placas redondeadas hacia arriba | N10 |
| `CalculadorMaterialesTest` | Despiece, tornillos, bisagras, barniz o pintura | N09, N11 |
| `EstadoPedidoTest` | Máquina de estados del pedido | R12 |
| `CalculadorComisionTest`, `VerificadorFirmaTest` | Comisión y firma del aviso de Mercado Pago | R10, R11 |
| `ServicioJwtTest`, `LimitadorIntentosTest` | Tokens y límite de intentos de ingreso | R01, RNF-08 |
| `ReintentadorTest` | Reintentos del aviso por WhatsApp | R08 |
| `ArquitecturaModulosTest` | Ningún módulo usa el interior de otro | RNF-06 |
| `DisenoApiTest` | Cálculo, plantillas, guardar y reabrir proyectos | N02, N03, N07 |
| `SeguridadApiTest` | Roles, registro, ingreso, pedidos ajenos | R01, R17 |
| `PedidosApiTest` | Mapa, pedido, copia fija, duplicados, WhatsApp, presupuesto, seña, estados, bandeja, resumen | R02 a R16 |
| `TraccionApiTest` | Lista de espera y métricas | N12, N13 |
| `pruebas.test.js` (frontend) | Unidades, rangos, modelo 3D a escala real, estados | N06 |

Las pruebas con persona y dispositivo real (N05, N15, N16 de DOC-06: AR en Android e iPhone, primer mueble en menos de 5 minutos, 30 fps) se hacen a mano.

---

## 3. Cómo está organizado el backend

Cada módulo es un paquete con una interfaz pública (`XxxApi`) y su implementación en `interno/`. Los módulos se hablan solo por esas interfaces o por eventos (`PedidoCreado`, `SenaPagada`).

| Módulo | Responsabilidad | Patrón |
|---|---|---|
| `usuarios` | Registro, ingreso, roles, JWT, límite de intentos | — |
| `diseno` | Plantillas, rangos, piezas, espacio, proyectos | — |
| `materiales` | Despiece, placas, herrajes, terminación | Strategy |
| `carpinterias` | Perfil y búsqueda por material | — |
| `pedidos` | Copia fija, presupuesto, estados, vencimientos | State |
| `pagos` | Seña, webhook firmado, comisión | Adapter |
| `notificaciones` | WhatsApp vía n8n con reintentos, tiempo real (SSE) | Adapter, eventos |
| `traccion` | Lista de espera y métricas | — |

Medidas: siempre milímetros enteros. Origen en la esquina frontal izquierda inferior; X a la derecha, Y al fondo, Z hacia arriba.

## 4. Subirlo a la web

Ver [`GUIA_DESPLIEGUE.md`](GUIA_DESPLIEGUE.md).
