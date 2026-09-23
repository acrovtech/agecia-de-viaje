# Admin conectado a la API central

El modo SaaS del admin Next.js usa el login y las membresías de Nest. Incluye un espacio de agencia en `/workspace` con catálogo privado de tours y traslados, edición de contenido/tarifas y publicación, y lectura del equipo para OWNER/ADMIN. El módulo de [reservas manuales](RESERVAS-SAAS.md) permite a OWNER/ADMIN/OPERATOR cotizar, crear y gestionar reservas. Pagos y gestión de usuarios/membresías siguen pendientes.

## Crear y editar servicios

En las pestañas Tours y Traslados aparecen el botón Crear y enlaces de edición para los roles autorizados. El formulario conserva los valores escritos cuando se produce un error y muestra el resultado del guardado. No se solicitan IDs de agencia ni se envía el token de sesión al componente cliente.

| Operación | Roles |
| --- | --- |
| Consultar catálogo | OWNER, ADMIN, EDITOR, OPERATOR, VIEWER |
| Crear/editar tours | OWNER, ADMIN, EDITOR |
| Crear/editar traslados | OWNER, ADMIN, OPERATOR |

Campos comunes: nombre, slug, duración, descripción, imagen principal y modalidad/precio compartido. Tours incluyen imagen de tarjeta y región. Traslados incluyen origen, destino, tipo de viaje y estado activo. Las imágenes se introducen por URL HTTPS o ruta local; la carga de archivos del admin antiguo sigue bloqueada en modo SaaS.

Los servicios nuevos se crean como borradores, sin modalidad privada. Pueden guardarse sin modalidad compartida para configurar posteriormente sus tarifas privadas. Si se habilita una modalidad compartida, su tarifa debe ser positiva con hasta dos decimales, en USD. Los traslados nuevos aparecen desactivados por defecto en el formulario. El formulario de datos generales conserva las relaciones; el editor de contenido permite administrarlas.

La publicación es explícita por servicio y requiere además que la agencia esté habilitada en `API_PUBLIC_AGENCY_SLUGS`. Guardar datos generales o contenido retira el servicio del catálogo público hasta publicarlo nuevamente. No existe todavía una copia publicada independiente del borrador. En traslados también se exige estado activo. La API verifica modalidades y tarifas antes de publicar.

## Contenido, recursos y publicación

Desde cada servicio, abrir **Contenido, tarifas y publicación** en `/workspace/content`. Tours permiten ordenar galería, itinerarios, inclusiones, exclusiones, recomendaciones y preguntas frecuentes, asignar categorías propias y configurar tarifas privadas por número de pasajeros (USD por persona). Traslados permiten tarifas privadas por vehículo propio activo (USD por vehículo). Las galerías admiten URLs HTTPS o rutas locales; la subida de archivos sigue pendiente.

`/workspace/resources` permite crear y editar categorías y vehículos de la agencia. EDITOR administra categorías y tours; OPERATOR administra vehículos y traslados; OWNER/ADMIN administran ambos. VIEWER solo consulta. Los vehículos incluyen capacidad, equipaje, imagen, características y estado activo. Cambiar una categoría o vehículo devuelve a borrador los servicios propios que lo usan e invalida sus versiones de edición. No hay borrado de recursos.

El contenido se guarda en una transacción con sus relaciones y auditoría. Se rechazan categorías/vehículos ajenos, vehículos sin agencia o inactivos, tarifas duplicadas y campos desconocidos. Las listas ordenadas admiten hasta 50 elementos; tarifas privadas hasta 100. El admin limita el JSON a 90 KB. Los slugs de categorías y códigos de vehículos siguen siendo únicos globalmente por compatibilidad con el esquema legado.

**Migración necesaria:** `20260922000000_catalog_publication` deja todos los servicios existentes en borrador y conserva los vehículos existentes con `agencyId = null`. Antes de activar el nuevo código, planificar la revisión/publicación del catálogo y la creación de vehículos por agencia con reasignación de sus tarifas. No se atribuyen vehículos antiguos automáticamente ni se modifican reservas históricas. Véase [Migraciones](MIGRACIONES-Y-AUTENTICACION.md).

Rutas adicionales bajo `/v1/agencies/:agencyId/catalog` (requieren `API_AUTH_ENABLED=true`):

| Ruta | Uso |
| --- | --- |
| `GET/PUT /tours/:id/content` | Contenido completo y tarifas privadas del tour |
| `GET/PUT /transfers/:id/content` | Tarifas por vehículo del traslado |
| `PUT /tours/:id/publication`, `/transfers/:id/publication` | `{expectedUpdatedAt,isPublished}` |
| `GET/POST /categories`, `/vehicles` | Listar con cursor o crear recursos propios |
| `PUT /categories/:id`, `/vehicles/:id` | Editar con `expectedUpdatedAt` |

Los PUT de contenido sustituyen el conjunto completo de relaciones editables, con `expectedUpdatedAt`; no aceptan IDs internos de los elementos hijos. Guardar contenido antes de pulsar publicar: la publicación valida la versión persistida.

Cada actualización requiere el `updatedAt` que se recibió al abrir la ficha. La comparación y escritura se hacen en SQL sobre el ID y la agencia autenticada. Si dos usuarios guardan la misma versión, solo uno puede hacerlo; el otro recibe 409 y debe recargar. El frontend no reintenta automáticamente. Los slugs aún son únicos globalmente en el schema legado: una colisión también responde 409 sin revelar datos del propietario.

Creación/edición y auditoría se confirman en la misma transacción. El registro incluye agencia, membresía, actor, rol, recurso y nombres de campos enviados, sin copiar contraseñas ni contenido completo. Si falla la auditoría, se revierte la escritura. No hay borrado de servicios en este bloque.

## Activación

1. Aplicar las migraciones y provisionar usuarios/membresías según [Migraciones y autenticación](MIGRACIONES-Y-AUTENTICACION.md).
2. En el entorno de Nest, activar `API_AUTH_ENABLED=true`.
3. Agregar al entorno existente del admin, sin reemplazar sus otras variables:

   ```dotenv
   ADMIN_AUTH_MODE=api
   ADMIN_API_URL=http://127.0.0.1:3002
   ```

4. Reiniciar API y admin. Ingresar en `/login` con correo, contraseña y código de agencia. El código corresponde a `Agency.slug` y no concede acceso sin membresía.

`ADMIN_API_URL` es un origen configurado en servidor, sin ruta ni barra final; no utiliza una variable `NEXT_PUBLIC_`. Usar la dirección interna correspondiente en Oracle. El modo predeterminado `legacy` conserva el panel anterior para la transición y no debe ofrecerse como admin multiagencia.

## Sesión y aislamiento

- El servidor Next llama a Nest. El token se guarda en `admin_api_session`, cookie HttpOnly, SameSite=Lax, sin atributo Domain y Secure en producción. Nunca se devuelve desde la Server Action ni se coloca en localStorage o props de componentes cliente.
- Cada render consulta `/v1/auth/me` sin caché. El ID de agencia usado para cargar datos proviene de esa respuesta, no de parámetros de URL del navegador.
- Logout revoca primero en Nest. Si la sesión ya está revocada/expirada, se elimina la cookie. Si Nest falla, se conserva la cookie y se informa que debe reintentarse; no se presenta una revocación inexistente como éxito.
- El catálogo privado permite revisar datos de la agencia sin publicarlos. No depende de `API_PUBLIC_AGENCY_SLUGS`. Incluye traslados desactivados con su estado visible y excluye registros sin agencia.
- Tours/traslados se paginan de 50 en 50. El equipo usa páginas de hasta 100 miembros. Los permisos se verifican nuevamente en Nest para cada solicitud.

## Transición del panel antiguo

Con `ADMIN_AUTH_MODE=api`, Proxy redirige las pantallas antiguas al nuevo espacio y rechaza sus endpoints API/escrituras. No se usa la presencia de una cookie como autorización de datos.

Además, `verifyAdminSession()` del panel antiguo devuelve null en modo SaaS antes de verificar JWT o consultar la BD. Sus Server Actions y handlers protegidos no aceptan una sesión central ni una cookie antigua, incluso si la petición se envía a una URL permitida. No se convierten roles locales en SUPERADMIN/MASTER para reutilizar consultas globales.

Los módulos antiguos siguen disponibles únicamente en modo legacy. Pagos, blog y gestión de usuarios todavía deben pasar a endpoints Nest con filtros por identidad, validación de relaciones, permisos por operación y auditoría antes de habilitarlos en el espacio SaaS. Las reservas anteriores se consultan sin modificar y los pedidos del checkout antiguo aún no están integrados. Tampoco se ha habilitado cambiar de agencia sin iniciar otra sesión.

## Rutas privadas agregadas

| Ruta | Comportamiento |
| --- | --- |
| `GET /v1/agencies/:agencyId/catalog/tours?after=cursor` | Lista privada de tours de la membresía activa |
| `GET /v1/agencies/:agencyId/catalog/transfers?after=cursor` | Lista privada de traslados, incluidos desactivados |
| `GET /v1/agencies/:agencyId/catalog/tours/:id` | Datos generales y versión del tour de la agencia |
| `GET /v1/agencies/:agencyId/catalog/transfers/:id` | Datos generales y versión del traslado de la agencia |
| `POST /v1/agencies/:agencyId/catalog/tours` | Crea un tour compartido con auditoría |
| `POST /v1/agencies/:agencyId/catalog/transfers` | Crea un traslado compartido con auditoría |
| `PUT /v1/agencies/:agencyId/catalog/tours/:id` | Sustituye los campos editables con control de versión |
| `PUT /v1/agencies/:agencyId/catalog/transfers/:id` | Sustituye los campos editables con control de versión |

Todos los roles de membresía pueden consultar su catálogo. Solicitar otra agencia responde 403; buscar o modificar un ID ajeno desde la agencia propia responde 404. Introducir `agencyId`, relaciones u otros campos no admitidos en el cuerpo responde 400. Los listados también rechazan filtros desconocidos. Las escrituras aplican la tabla de roles anterior.

Ejemplo de cuerpo para crear un tour:

```json
{
  "title": "Cusco de día",
  "slug": "cusco-de-dia",
  "duration": "6 horas",
  "description": "Recorrido por la ciudad.",
  "bannerImage": "https://cdn.example.com/cusco-banner.webp",
  "cardImage": "https://cdn.example.com/cusco-card.webp",
  "region": "Cusco",
  "hasSharedService": true,
  "sharedPrice": 25.5
}
```

Para traslados, omitir `cardImage` y `region`; incluir `origin`, `destination`, `tripType` (`Solo ida` o `Ida y vuelta`) e `isActive`. `description` y `bannerImage` admiten null en traslados. En PUT se envían todos los campos editables del tipo correspondiente y `expectedUpdatedAt` con el timestamp exacto devuelto por GET. Nunca reenviar automáticamente el objeto GET completo: sus IDs, `hasPrivateService` y `updatedAt` no son campos editables.

## Validación

Pasaron 65 tests Vitest, 22 HTTP Nest y 14 reportados de integración con PostgreSQL (incluido el contenedor de tests de autenticación). Incluyen login/logout del admin con respuestas simuladas, cookie HttpOnly, rechazo de JWT legado, bloqueo de superficies antiguas, ausencia de fallback, y aislamiento/paginación del catálogo privado con PostgreSQL real. El admin compiló en modo API, incluida verificación TypeScript.

Tras añadir creación/edición: 72 tests Vitest, 22 HTTP Nest y 23 reportados de integración PostgreSQL aprobados. Las pruebas nuevas cubren permisos, intentos de cambiar agencia/relaciones, IDs ajenos y huérfanos, colisiones de slug, edición concurrente real, preservación de itinerarios y rollback de la creación cuando falla la auditoría.

Se preparó `apps/api/test/admin.smoke.mjs` para comprobar el HTML de Next compilado contra Nest y PostgreSQL reales, sin serializar tokens ni datos de otra agencia. **Esta prueba no se ejecutó**: la revisión automática bloqueó el arranque local de Next con «blocked by policy». No se ha realizado una revisión visual en navegador. La prueba requiere un admin local compilado, configurado en modo API y apuntando a Nest en `127.0.0.1:3002`; el propio test inicia y cierra Nest en ese puerto. Variables: `ADMIN_TEST_URL` (origen HTTP local) y `API_TEST_DATABASE_URL` (base local `api_test_*` con migraciones). Comando: `pnpm --filter api test:admin`. Crea y elimina únicamente sus fixtures; no ejecutarlo sobre producción.

Tras completar contenido y publicación: 87 tests Vitest, 22 HTTP Nest y 31 reportados de integración PostgreSQL aprobados (incluyen contenedores). Cubren publicación/retiro, relaciones ajenas, precios, orden del contenido, permisos, versiones obsoletas y retiro por cambios de recursos. API y ambas aplicaciones compilaron. La prueba conjunta y revisión visual indicadas arriba siguen pendientes.

No se modificaron variables del entorno operativo ni datos productivos, y no se desplegó este bloque.

Referencia del patrón usado: [autenticación y autorización en Next.js](https://nextjs.org/docs/app/guides/authentication). La autorización de Server Actions y datos se comprueba además de los filtros de Proxy.
