# API central NestJS

Primera implementación de la migración SaaS: NestJS 12, REST v1 y catálogo de tours y traslados de solo lectura acotado por agencia. Comparte el schema Prisma existente, sin aplicar migraciones ni seeds. Next permite probar el detalle de tours y la página de transporte como consumidores de la API. La migración de autenticación, reservas y cobros todavía no está terminada.

## Desarrollo

Desde la raíz:

```powershell
pnpm install
Copy-Item apps/api/.env.example apps/api/.env
pnpm dev:api
```

Configurar `DATABASE_URL` con una BD de desarrollo. Los comandos pnpm del paquete ejecutan desde `apps/api`; solo se carga su `.env`, sin recurrir al de otras aplicaciones. Las variables del proceso tienen precedencia. Puerto local: 3002; interfaz local por defecto. Para contenedores usar `API_HOST=0.0.0.0` detrás del proxy.

`API_PUBLIC_AGENCY_SLUGS` es una lista explícita de slugs separados por comas. Vacía por defecto: el catálogo responde 404 para todas las agencias. Habilitar un slug publica **todo su catálogo de tours asociado**, porque el schema legado aún no tiene un estado de publicación ni canales. Revisar propiedad y contenido antes de habilitarlo. Los registros sin agencia nunca se incluyen. Este mecanismo temporal será sustituido por StorefrontChannel y publicación por recurso mediante migraciones.

## Rutas disponibles

| Método y ruta | Comportamiento |
| --- | --- |
| `GET /health/live` | Proceso disponible, sin consultar PostgreSQL |
| `GET /health/ready` | Prueba de conexión; 503 si PostgreSQL falla |
| `GET /v1/storefronts/{slugAgencia}/tours?page=1&limit=20` | Lista pública paginada; máximo 100, indicador `hasMore` |
| `GET /v1/storefronts/{slugAgencia}/tours/{slugTour}` | Resumen público del tour de esa agencia; 404 si pertenece a otra |
| `GET /v1/storefronts/{slugAgencia}/transfers` | Lista paginada de traslados activos de esa agencia |
| `GET /v1/storefronts/{slugAgencia}/transfers/{slugTraslado}` | Detalle público y opciones de vehículo |
| `GET /docs`, `GET /openapi.json` | Swagger y contrato; solo si `API_DOCS_ENABLED=true` |

El resumen entrega campos explícitos sin IDs de agencia, reservas, documentos, credenciales ni relaciones internas. `sharedPrice` conserva el precio legado de referencia en USD y se oculta si la modalidad compartida está deshabilitada. No es una cotización ni una garantía de disponibilidad. El cambio a dinero en centavos y cotizaciones autoritativas pertenece a la fase financiera.

Las rutas sin política explícita se rechazan con 401. Con `API_AUTH_ENABLED=true` se habilitan login, sesión, logout y membresías; requieren las migraciones y provisión descritas en [Migraciones y autenticación](../../docs/MIGRACIONES-Y-AUTENTICACION.md). No se aceptan JWT ni cookies del admin legado. El `agencyId` del cliente nunca concede autorización. Los controladores experimentales de checkout e IPN solo se registran con `NODE_ENV=test`; en desarrollo y producción no existen esas rutas. No configurar un despliegue con entorno de prueba. Falta validar cuerpos, idempotencia concurrente, límites de cupones, credenciales por comercio y contrato real del proveedor antes de habilitar pagos. La clave de firma no tiene valor conocido por defecto; el secreto de prueba se suministra únicamente desde los tests.

## Frontend piloto

El admin tiene un modo separado conectado a esta API: [Admin SaaS](../../docs/ADMIN-SAAS.md). Usa sesiones centrales, catálogo privado, contenido, categorías, vehículos, tarifas y publicación explícita. Incluye [reservas manuales](../../docs/RESERVAS-SAAS.md) con cotización autoritativa, idempotencia por agencia e historial operativo independiente del pago. Pagos y otros módulos antiguos todavía no están migrados.

En el entorno del proceso `web`, configurar `CATALOG_SOURCE=api`, `API_INTERNAL_URL=http://127.0.0.1:3002` y `STOREFRONT_SLUG=slug-de-agencia`. Habilitar ese mismo slug en la API. Estas variables se usan en servidor. El modo predeterminado sigue siendo el legado; habilitar API es una prueba parcial, no convierte todo Next en multitenant.

El detalle de tours y la página de transporte consultan la API sin caché. Ante un 404, error o catálogo vacío, no consultan la base global ni muestran los seeds. Inicio, listados restantes, menú, blog, sitemap y checkout siguen pendientes de migración. No ofrecer aún este frontend como sitio aislado para una segunda agencia.

## Operación y pruebas

```powershell
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api check-types
pnpm test:api
pnpm start:api
```

Las pruebas HTTP construyen la aplicación real y sustituyen únicamente el cliente de BD. Comprueban aislamiento, paginación, validación, errores, rutas privadas, CORS, límites y OpenAPI. Para comprobar las consultas con PostgreSQL real, preparar una base **desechable local** llamada `api_test_…`, aplicar el schema ahí y ejecutar:

```powershell
$env:API_TEST_DATABASE_URL='postgresql://test:test@127.0.0.1:55441/api_test_catalog'
pnpm --filter api test:integration
```

El test rechaza hosts remotos/nombres no reservados para pruebas, crea sus fixtures y borra solo sus propios registros. No ejecuta `db push` ni seeds por sí mismo. El schema debe prepararse expresamente contra esa base desechable; jamás contra producción.

La API valida variables al arrancar, emite un `X-Request-Id` generado por servidor, usa Helmet y oculta detalles de errores. Las respuestas de catálogo no se cachean en este primer bloque. El límite de peticiones es por IP y memoria del proceso: apropiado para una réplica inicial; necesita almacenamiento compartido o límites en gateway antes de escalar. No se confía en `X-Forwarded-For`: detrás de proxy, el límite agrupa clientes por dirección del proxy. Configurar una política de confianza explícita y controles en el proxy antes de exponer producción. CORS limita navegadores, no autentica lectores del catálogo público.

El arranque raíz no aplica cambios ni seeds a la base. `pnpm db:deploy` aplica el historial versionado; una base existente exige reconciliar y registrar su baseline primero. La migración `20260922000000_catalog_publication` deja servicios existentes en borrador y vehículos existentes sin agencia, sin eliminarlos. Revisar y publicar servicios explícitamente; crear vehículos propios antes de configurar tarifas privadas. La API pública exige `isPublished=true`, además de la agencia habilitada y el estado activo del traslado. Editar retira la publicación; editar categorías/vehículos también retira servicios propios relacionados.

La API todavía no reúne todos los requisitos del piloto: siguen pendientes gestión de membresías desde el admin, claves de integración, canales persistentes, migración completa del frontend, checkout, workers y despliegue Oracle.

Referencias: [Nest](https://docs.nestjs.com/first-steps), [OpenAPI](https://docs.nestjs.com/openapi/introduction), [versionado](https://docs.nestjs.com/techniques/versioning).
