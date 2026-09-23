# Migraciones y autenticación central

## Alcance del bloque

La API tiene login, sesión revocable, logout y lectura de membresías de la agencia autenticada. Los usuarios existentes conservan sus contraseñas bcrypt y sus roles del admin antiguo. Los permisos nuevos se obtienen exclusivamente de `AgencyMembership`; incluso `SUPERADMIN` necesita una membresía explícita para acceder a esta API. Una persona puede tener roles distintos en agencias diferentes.

Las migraciones no crean usuarios, no asignan membresías a partir de roles globales y no cambian propietarios del catálogo. Se preservan `User.agencyId`, sesiones y relaciones existentes mientras se migra el admin. Quedan pendientes canales de publicación persistentes, claves de integración, invitaciones, MFA, recuperación de contraseña propia de la API y la interfaz de administración de membresías.

## Base nueva

Definir `DATABASE_URL` explícitamente en el proceso que ejecutará los comandos y comprobar el destino. Desde la raíz:

```powershell
pnpm install --frozen-lockfile
pnpm db:deploy
```

`00000000000000_baseline` crea el esquema legado; `20260921000000_api_memberships` agrega el enum de roles y las tablas `AgencyMembership` y `ApiSession`. El arranque de web/API no aplica migraciones ni seeds. La CI aplica ambas migraciones en PostgreSQL desechable; ya no usa `db push`.

## Base existente sin historial Prisma

Primero respaldar y probar restauración en una copia. El baseline fue generado desde el schema del repositorio; no certifica que una base remota tenga exactamente ese esquema, ni representa triggers, extensiones o SQL externo no modelado en Prisma.

1. Con `DATABASE_URL` apuntando a la copia, comparar con el snapshot congelado:

   ```powershell
   pnpm --filter @repo/db exec prisma migrate diff --from-schema-datasource prisma/baseline.prisma --to-schema-datamodel prisma/baseline.prisma --exit-code
   ```

2. Solo si no hay diferencias y la revisión de objetos externos es satisfactoria, registrar el baseline existente. Este paso no ejecuta su SQL:

   ```powershell
   pnpm --filter @repo/db exec prisma migrate resolve --applied 00000000000000_baseline
   pnpm db:deploy
   ```

3. Comparar el resultado con el schema actual y probar la aplicación:

   ```powershell
   pnpm --filter @repo/db exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
   ```

Si aparece una diferencia, detener el procedimiento y reconciliarla; no marcar el baseline automáticamente ni usar `db push` para ocultarla. Una base con historial previo necesita reconciliar ese historial, no seguir a ciegas este procedimiento. `migrate deploy` rechaza una base no vacía sin baseline registrado.

Las expresiones de generación de códigos de órdenes/reservas se normalizaron a la representación de PostgreSQL, sin cambiar su comportamiento, para evitar diferencias falsas. `baseline.prisma` es un snapshot histórico: no actualizarlo al añadir modelos nuevos.

## Migración de contenido y publicación

`20260922000000_catalog_publication` añade `Tour.isPublished` y `Transfer.isPublished` con valor inicial `false`, y `VehicleType.agencyId` nullable con índice y relación. No elimina servicios, contenido, tarifas ni reservas. Los vehículos existentes quedan sin agencia: no se infiere su propietario.

**Efecto operativo:** después de aplicar la migración y desplegar el código, el catálogo existente deja de ser público hasta revisar y publicar cada servicio desde el admin SaaS. Coordinar la ventana de transición. Crear vehículos propios por agencia y configurar las tarifas de traslados que los usen; las referencias históricas de reservas no se reasignan automáticamente. La publicación también requiere el slug en `API_PUBLIC_AGENCY_SLUGS`.

Aplicar con el procedimiento de baseline/deploy anterior, con backup y ensayo en una copia antes de producción. No ejecutar seeds ni `db push` para sustituir esta migración. Se verificó localmente contra una base desechable la aplicación incremental y comparación final sin diferencias; no se ejecutó sobre producción.

## Migración de reservas manuales

`20260923000000_manual_reservations` agrega campos nullable de operación, precio e idempotencia a `Reservation`, el enum `OperationalStatus` y `ReservationEvent`. Los registros previos no se convierten ni se reasignan; permanecen sin estado operativo nuevo y solo pueden consultarse si tienen agencia. Detalles, pruebas y aplicación en Oracle documentados en [Reservas SaaS](RESERVAS-SAAS.md).

## Provisión explícita

El operador de infraestructura puede asignar acceso a un usuario y una agencia que ya existan y estén activos. No hay registro público ni contraseñas predeterminadas:

```powershell
pnpm --filter @repo/db membership:grant --email persona@example.com --agency agencia-ejemplo --role ADMIN
```

El comando exige `DATABASE_URL` en el entorno, no carga silenciosamente un `.env`. Crea o actualiza solo esa membresía y revoca sus sesiones anteriores en la misma transacción. No genera ni cambia contraseñas. Roles admitidos: `OWNER`, `ADMIN`, `OPERATOR`, `EDITOR`, `VIEWER`. En este bloque solo OWNER/ADMIN pueden listar miembros; los demás pueden consultar su propia sesión. La administración futura de roles deberá impedir eliminar el último propietario y registrar auditoría.

## Activación y contrato

Tras aplicar migraciones y provisionar las membresías, establecer `API_AUTH_ENABLED=true` en el entorno de la API y reiniciarla. Por defecto es `false` y estas rutas no se registran. La API no acepta cookies ni JWT del admin legado.

| Ruta | Acceso y respuesta |
| --- | --- |
| `POST /v1/auth/login` | JSON estricto `{email,password,agencySlug}`; devuelve `accessToken`, `tokenType`, `expiresAt`, `agencyId` |
| `GET /v1/auth/me` | Bearer; devuelve identidad y rol actual, sin contraseñas ni datos de sesión internos |
| `POST /v1/auth/logout` | Bearer; revoca la sesión en PostgreSQL y responde 204 |
| `GET /v1/agencies/:agencyId/memberships?after=cursor` | Bearer de esa agencia y rol OWNER/ADMIN; máximo 100 miembros, `nextCursor` para continuar |

El token es opaco, aleatorio de 256 bits y dura una hora. En la BD solo se guarda su digest SHA-256. El campo interno `passwordHash` de ApiSession es una huella SHA-256 del hash bcrypt, usada para detectar reemplazos de contraseña sin duplicar ese hash. Cada petición verifica expiración, revocación, `tokenVersion`, contraseña, bloqueo, usuario, membresía y agencia activos; el rol se lee de la BD. Desactivar impide el acceso mientras dure ese estado. Para invalidación permanente usar revocación de sesiones o incrementar `tokenVersion`; reactivar una cuenta no reemplaza una revocación.

No hay refresh token en este bloque: al expirar se inicia sesión otra vez. El admin ya conserva el token en una cookie HttpOnly propia y llama a Nest desde servidor; véase [Admin SaaS](ADMIN-SAAS.md). Los tokens de sesión no sustituyen las futuras claves de integración para sitios externos.

Login limita solicitudes a 10/minuto por IP en la instancia y bloquea la cuenta 15 minutos después de cinco contraseñas fallidas. Los límites de varias réplicas y la confianza del proxy siguen pendientes; configurar HTTPS y el proxy antes de exposición pública. Los mensajes de error no distinguen cuenta inexistente, agencia inválida o falta de membresía.

## Validación de este bloque

Pruebas locales realizadas únicamente contra PostgreSQL desechable: aplicación del baseline y la migración en una base vacía; registro del baseline y aplicación incremental en una base con esquema legado; comparación final sin diferencias en ambos casos. Tests HTTP con BD real cubren roles por agencia, revocación persistente, expiración, contraseñas, bloqueos, parámetros inválidos y provisión por CLI. No se ha migrado ni desplegado ninguna base de producción.

Referencias de implementación: [baseline de Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining) y [autenticación y guards de Nest](https://docs.nestjs.com/security/authentication). Los comandos de este documento se verificaron con la versión instalada, Prisma 5.22.
