# Migración aplicada y acceso de revisión

Por autorización del propietario se migró la base configurada `dbTravel` en Oracle el 22 de septiembre de 2026.

- La comparación del esquema remoto con `baseline.prisma` no encontró diferencias. No se encontraron triggers de usuario, vistas públicas ni extensiones adicionales a `plpgsql`.
- Se generó un respaldo custom con PostgreSQL 18 y se restauró en una instancia local PostgreSQL 18. En esa copia se registró el baseline y se aplicaron ambas migraciones nuevas; la comparación final no encontró diferencias.
- Después se registró `00000000000000_baseline` en Oracle y se aplicaron `20260921000000_api_memberships` y `20260922000000_catalog_publication`. La comparación final tampoco encontró diferencias.
- Permanecen los 10 tours y 10 traslados de `incabound`, todos en borrador. No se ejecutaron seeds ni se reasignaron vehículos históricos.
- Se creó una cuenta nueva con membresía `OWNER` en Inca Bound Expeditions y rol legado `MASTER`, sin cambiar usuarios existentes. La provisión quedó auditada. No concede acceso automático a otras agencias.
- Se verificaron login, identidad OWNER y listados privados (10 tours y 10 traslados) contra Nest conectado a Oracle; las sesiones de comprobación se revocaron.

Respaldo local privado, excluido de Git: `.agents/backups/2026-09-22-before-saas/dbTravel.dump`. Credenciales nuevas: `.agents/acceso-maestro.txt`, también excluido de Git. No copiar estos archivos al repositorio ni a documentación pública.

Se configuraron `apps/api/.env` y `apps/admin/.env` para autenticación SaaS y conexión interna a `127.0.0.1:3002`. Las variables anteriores del admin se respaldaron. La API local quedó iniciada; no se desplegaron procesos en Oracle.

El puerto 3001 pertenece a otra copia del proyecto (`incabound-phase-a`). Para revisar esta copia, desde la raíz ejecutar:

```powershell
pnpm --filter admin exec next dev --port 3003 --hostname 127.0.0.1
```

Abrir `http://127.0.0.1:3003/login` con el correo y contraseña del archivo privado y el código de agencia `incabound`. Si la API ya no está iniciada, ejecutar `pnpm --filter api start` en otra terminal.

El arranque automático de Next fue rechazado por revisión automática con «blocked by policy». Queda pendiente comprobar el formulario real de login, las pantallas del admin y sus acciones desde esta copia. El login de la API sí fue comprobado; no equivale a una prueba completa del frontend.
