# Avance de implementación SaaS — 21 de septiembre de 2026

La arquitectura acordada es NestJS como API central, PostgreSQL/Prisma y frontends independientes. Se conserva Next.js durante la migración; Vue no es requisito para consumir la API.

## Sexto bloque: reservas manuales y operación

Implementados cotización autoritativa, creación manual, contacto/pasajeros, precio guardado en centavos, listado/detalle y estados pendiente, confirmado, cancelado y completado. Operan OWNER/ADMIN/OPERATOR; los datos se aíslan por agencia. Una clave única por agencia evita duplicar reenvíos, las versiones evitan sobrescribir cambios concurrentes y cada operación guarda historial y auditoría transaccional. El estado del pago permanece independiente.

La migración `20260923000000_manual_reservations` se ensayó localmente, también sobre una restauración del respaldo reciente, y se aplicó en Oracle. Comparación de schema sin diferencias. Los datos de Reservation, ReservationPassenger, ReservationItem, Tour y Transfer coinciden con el respaldo. Hay 13 reservas históricas sin agencia: permanecen conservadas y excluidas del listado SaaS hasta revisar su propiedad.

Validación: 96 pruebas Vitest, 22 HTTP y 44 reportadas de integración PostgreSQL (incluyen contenedores) aprobadas; lint API y archivos nuevos del admin, tipos y compilación API/admin/web aprobados. Login de la cuenta maestra y lectura de reservas verificados contra la API local conectada a Oracle. La API local quedó reiniciada. Sigue pendiente revisión visual y prueba completa del formulario Next; no se intentó el arranque previamente rechazado por revisión automática. Contrato y límites en [Reservas SaaS](RESERVAS-SAAS.md).

## Quinto bloque: contenido y publicación

Implementados en Nest y admin los editores de galería por URL, itinerarios, categorías, inclusiones/exclusiones, recomendaciones, FAQ, tarifas privadas y vehículos por agencia. Creación en borrador y publicación explícita validada por servicio. Guardar cambios retira la publicación; cambiar categorías o vehículos también devuelve a borrador los servicios propios relacionados. Relaciones ajenas se rechazan, con versiones optimistas y auditoría transaccional.

La migración aditiva `20260922000000_catalog_publication` conserva datos, deja servicios existentes en borrador y vehículos históricos sin agencia. Requiere revisión/publicación y configuración de vehículos propios durante la transición. No se aplicó a producción. Se verificó aplicación local y ausencia de diferencias con el schema.

Validación: 87 tests Vitest, 22 HTTP Nest y 31 reportados de integración PostgreSQL (incluyen contenedores); lint API y compilación API/admin/web aprobados. Falta la prueba conjunta de Next/Nest y revisión visual descritas en [Admin SaaS](ADMIN-SAAS.md). El frontend legado filtra servicios no publicados, pero aún no tiene aislamiento completo por agencia. Los bloques siguientes son registro histórico.

## Cuarto bloque: escritura del catálogo

El espacio SaaS permite crear y editar los datos generales y tarifa compartida de tours/traslados mediante Nest. Las escrituras se limitan por membresía y rol, rechazan IDs ajenos y datos de relaciones, registran auditoría transaccional y detectan conflictos de edición. No se modificó el schema ni se ejecutaron migraciones en este bloque. Tarifas privadas, itinerarios y otras relaciones conservan sus datos existentes; sus editores aún están pendientes. Contrato y alcance actualizados en [Admin SaaS](ADMIN-SAAS.md).

## Tercer bloque: conexión del admin

Implementado login del admin mediante Nest y un espacio de agencia de consulta con catálogo privado y equipo. En modo SaaS se rechazan las sesiones y acciones del admin antiguo; no se reutilizan sus consultas globales. El CRUD antiguo aún debe migrarse a endpoints con permisos y filtros por agencia. Detalles de activación, validación y prueba HTTP conjunta pendiente en [Admin SaaS](ADMIN-SAAS.md).

## Segundo bloque: autenticación y migraciones

Implementado después del bloque de catálogo descrito abajo:

- Baseline versionado y migración aditiva para `AgencyMembership` y `ApiSession`, sin backfill implícito de usuarios ni datos.
- Login central por membresía, tokens opacos de una hora, logout persistente y comprobación de revocación/estado/permisos en cada petición.
- Roles independientes por agencia y lectura paginada de miembros solo para OWNER/ADMIN de la agencia autenticada. Los roles globales del admin legado no otorgan acceso a la API.
- Provisión explícita por CLI para usuarios existentes; cambios de acceso revocan sesiones anteriores de esa membresía.
- Activación con `API_AUTH_ENABLED=true` después de migrar y provisionar; deshabilitado por defecto. El admin Next todavía no consume este login.
- CI actualizada para aplicar migraciones sobre una base vacía. También se verificó localmente la incorporación de una base con esquema legado y la ausencia de diferencias tras migrar.
- Validación del bloque: 39 tests Vitest, 22 tests HTTP y 13 tests reportados de integración PostgreSQL aprobados (incluyen el test contenedor de autenticación). Lint y compilación de API aprobados.

Procedimiento operativo y pendientes: [Migraciones y autenticación](MIGRACIONES-Y-AUTENTICACION.md). El estado del primer bloque que sigue se conserva como registro histórico; las referencias a membresías y baseline pendientes corresponden a ese momento.

## Bloque verificable

- API REST v1 con catálogo de tours y traslados filtrado por agencia activa, publicación mediante lista explícita, paginación, DTOs públicos y OpenAPI opcional.
- Validación de configuración, rutas privadas denegadas por defecto, Helmet, CORS explícito, límites por IP y errores sin detalles de conexión.
- Conexión opcional de detalle de tour y página de transporte en Next mediante `CATALOG_SOURCE=api`. Un error o 404 nunca deriva a consultas globales de BD. El consumidor usa el identificador del tour del contrato real, sin convertir a la fuerza un DTO incompleto al modelo Prisma.
- Checkout e IPN conservados como prototipos solo para tests; no se registran en desarrollo ni producción. Se eliminó la clave de firma predeterminada conocida.
- Arranque raíz sin seeds ni cambios automáticos de schema. `db:deploy` exige preparar primero el baseline de migraciones. `.dockerignore` evita incluir dependencias y archivos locales de entorno.
- Next actualizado a 16.3.5. Workflow de CI con PostgreSQL desechable, tests, lint de API y compilación de ambas aplicaciones. Su ejecución remota queda pendiente de subir los cambios.

## Validación local

- `pnpm test`: 39 tests Vitest y 22 tests HTTP de Nest aprobados.
- `pnpm --filter api lint`: sin errores ni advertencias.
- Integración con PostgreSQL 17 local desechable: aprobada. Incluye dos agencias, registros sin agencia, tours, traslados, traslado desactivado y agencia desactivada; limpieza limitada a fixtures propios.
- `pnpm --filter web build` y `pnpm --filter admin build`: aprobados, con verificación TypeScript y una base vacía de prueba.

Estos resultados no equivalen a validar pagos reales, migraciones productivas o despliegue en Oracle. Los tests financieros usan un adaptador simulado, sin garantías de concurrencia. El lint del frontend mantiene deuda previa y todavía no es un requisito del workflow.

## Siguiente bloque

1. Preparar baseline de Prisma y migración de membresías, canales y publicación; revisar la propiedad de datos existentes antes del backfill.
2. Implementar autenticación central, autorización por agencia, revocación de sesiones y credenciales de integración con permisos.
3. Migrar consultas restantes del frontend y del admin. Inicio, menú, listados, blog y sitemap todavía no ofrecen aislamiento SaaS completo.
4. Validar checkout y webhooks con esquema estricto, claves idempotentes únicas, transacciones concurrentes, importes persistidos en unidades menores, credenciales por comercio y outbox con worker.
5. Preparar despliegue Oracle después de verificar recursos, red, backups, restauración y observabilidad.

No se modificaron datos de producción ni se desplegó este bloque. Consultar [instrucciones de API](../apps/api/README.md), [auditoría original](AUDITORIA-SAAS-2026-09-20.md) y [plan de arquitectura](PLAN-SAAS-Y-TECNOLOGIAS.md).
