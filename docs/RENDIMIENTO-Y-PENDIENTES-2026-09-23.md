# Rendimiento y próximos bloques

Medición del 23 de septiembre de 2026: Next y Nest en la PC, PostgreSQL remoto en Oracle. Sesión de comprobación de la cuenta OWNER revocada al terminar. No se modificaron datos de negocio ni versiones de dependencias.

| Operación | Mediana | Muestras |
| --- | ---: | ---: |
| SELECT 1 con conexión abierta | 110 ms | 5 |
| Consulta actual de autenticación Prisma | 450 ms | 5 |
| API health sin base de datos | 4 ms | 5 |
| GET /v1/auth/me | 453 ms | 5 |
| GET catálogo privado de tours | 566 ms | 5 |
| HTML completo de nueva reserva, con sesión | 1192 ms | 3 |

El log de consultas de Prisma confirmó cuatro sentencias por carga de autenticación: sesión, membresía, usuario y agencia. `centralSession()` espera `/auth/me`; después se carga el catálogo y su guard autentica otra vez. Son aproximadamente nueve viajes a la base (4 + 4 + 1). Los valores explican gran parte de la demora observada; no son una prueba de carga ni un benchmark de producción. La consulta SELECT 1 mide ida/vuelta y procesamiento, no tiempo de CPU de PostgreSQL aislado.

El error `M_ID` aportado por el usuario tiene ambas ubicaciones de stack en `chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js`. Debe reproducirse sin esa extensión para aislarlo. No hay evidencia en ese stack de un fallo originado por el módulo de reservas, ni de que explique la latencia del servidor.

## Prioridad inmediata: rendimiento

1. Consolidar la lectura de autenticación en una consulta con joins y selección explícita de campos. Mantener revocación, roles y estado de usuario/agencia vigentes en cada solicitud; no usar caché compartida de permisos para ocultar la latencia. Prisma 5.22 instalado dispone de `relationJoins` como preview; valorar el alcance de habilitarlo frente a una consulta SQL parametrizada puntual. Probar todos los casos de revocación antes de cambiarlo.
2. Reducir la cadena `/auth/me` → datos mediante un contrato autenticado que devuelva el contexto necesario con los datos. No confiar en una agencia recibida del navegador ni eliminar guards. Paralelizar solo cargas independientes; los pasos actuales tienen una dependencia real de identidad.
3. Agregar estados de carga/streaming en navegación y formularios, y medir tiempos hasta contenido útil además del HTML completo. Esto mejora percepción, pero no sustituye reducir consultas.
4. Medir un build de producción y desplegar API/base en red cercana o privada en Oracle. Verificarlo antes de atribuir mejoras; actualmente las consultas cruzan desde la PC al servidor remoto.
5. Revisar actualizaciones por compatibilidad y cambios concretos, con pruebas; no cambiar nuevamente de framework para resolver este patrón.

Referencias oficiales: [Prisma: estrategias de joins, desde 5.9](https://www.prisma.io/blog/prisma-orm-now-lets-you-choose-the-best-join-strategy-preview), [Next: carga de datos y paralelismo](https://nextjs.org/docs/app/getting-started/fetching-data), [Next: streaming](https://nextjs.org/learn/dashboard-app/streaming). Los ejemplos de documentación de versiones mayores de Prisma no deben trasladarse sin verificar compatibilidad con 5.22.

## Pendientes funcionales y operativos

1. Resolver rendimiento y revisar el flujo real en navegador sin extensiones.
2. Revisar propiedad de 13 reservas históricas sin agencia y vehículos históricos, antes de asignarlos. Revisar y publicar el catálogo.
3. Gestión de usuarios/membresías, invitaciones, recuperación de acceso y protección del último propietario.
4. Disponibilidad/cupos y operación de reservas; checkout/pagos con idempotencia, webhooks verificados, reembolsos y conciliación. Las reservas manuales actuales no garantizan cupos ni registran cobros.
5. Completar aislamiento de todas las páginas públicas, canales/dominios por agencia y credenciales de integración para webs externas.
6. Despliegue de aplicaciones en Oracle, HTTPS, límites detrás de proxy, backups/restauración automatizados, observabilidad y pruebas de carga. La base está migrada; eso no equivale a tener el SaaS desplegado.

Este diagnóstico no cambia la implementación ni afirma que la latencia ya esté corregida.
