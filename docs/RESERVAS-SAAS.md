# Reservas manuales por agencia

El módulo `/workspace/reservations` permite a OWNER, ADMIN y OPERATOR consultar y crear reservas de su agencia, revisar el precio y gestionar el estado operativo. EDITOR y VIEWER no acceden a esta sección ni a sus endpoints, que contienen datos de contacto y pasajeros.

## Flujo del operador

1. Abrir **Reservas → Crear reserva manual** y elegir un tour o traslado publicado. Un traslado también debe estar activo. Publicar previamente los borradores desde el catálogo.
2. Indicar modalidad, fecha del servicio y número de pasajeros; en traslados privados, elegir un vehículo propio activo con capacidad suficiente.
3. Cotizar. Nest obtiene las tarifas de la base y devuelve el precio: compartidos por persona, tours privados por persona para la cantidad exacta configurada, traslados privados por vehículo. No se interpola una tarifa privada inexistente.
4. Revisar el importe, completar contacto y nombres de todos los pasajeros, opcionalmente documentos/recojo/observaciones, y crear la reserva pendiente.
5. Coordinar disponibilidad y confirmar desde la ficha con un motivo. Después del servicio, completar la reserva. Cancelar requiere un motivo; los estados cancelado y completado son terminales.

La fecha representa un día calendario de Perú (`America/Lima`), guardado a medianoche UTC sin convertirlo en hora de salida. Se rechazan días inexistentes y creación con fechas anteriores a hoy. La hora de recojo es una hora local opcional. No se permite completar servicios con fecha futura.

## Dinero, concurrencia e historial

Los importes nuevos se guardan en centavos enteros USD junto con nombre de servicio, modalidad, unidad de tarifa y nombre de vehículo cuando corresponde. Los campos Float anteriores se conservan por compatibilidad. Cambiar el catálogo después no modifica el precio acordado. La cotización se recalcula dentro de la transacción de creación: si la versión o los datos cotizados cambiaron, responde 409 y exige volver a revisar el precio.

Cada formulario nuevo recibe una clave UUID de solicitud. La combinación agencia/clave es única en PostgreSQL; el cuerpo normalizado se compara mediante SHA-256. Repetir la misma solicitud devuelve la misma reserva; reutilizar la clave con otros datos responde 409. Esto cubre reenvíos de una misma solicitud, no detecta reservas similares iniciadas deliberadamente con claves diferentes. Ante una respuesta incierta, repetir el mismo envío o revisar el listado antes de abrir un formulario nuevo.

Creación, pasajeros, evento y auditoría se guardan en una transacción Serializable. Los cambios de estado requieren el `updatedAt` actual y guardan actor, fecha, estado anterior/nuevo y motivo. Solo se admite un cambio concurrente por versión. No se reintentan automáticamente operaciones ambiguas.

El estado operativo es independiente del pago. Confirmar/completar no marca como pagada la reserva. Cancelar no emite un reembolso. Este módulo no cobra, envía mensajes, aplica cupones, calcula recargos/impuestos, garantiza cupos ni asigna automáticamente operadores o vehículos físicos. La capacidad validada es la capacidad del tipo de vehículo, no su disponibilidad horaria. El importe corresponde a la tarifa de catálogo sin componentes adicionales; checkout y pagos requieren su siguiente bloque.

## Compatibilidad y migración

`20260923000000_manual_reservations` agrega columnas nullable a `Reservation`, el enum `OperationalStatus`, la clave única por agencia y la tabla `ReservationEvent`. No modifica precios, estados ni propietarios de registros anteriores y no crea reservas de ejemplo.

Las reservas anteriores con agencia se listan y muestran en modo consulta. No se infieren estados operativos a partir de un pago histórico. Las reservas sin agencia no aparecen; requieren revisar su propiedad antes de incorporarlas. Nuevas reservas tienen origen `MANUAL_SAAS`. Los pedidos de `Order` del checkout anterior aún no están integrados en este listado. El panel legacy sigue fuera del flujo SaaS; no usar otra copia antigua del admin para operar estas reservas.

## Contrato privado

Prefijo: `/v1/agencies/:agencyId/reservations`, requiere `API_AUTH_ENABLED=true`, bearer central y membresía OWNER/ADMIN/OPERATOR en esa agencia.

| Método y ruta | Uso |
| --- | --- |
| `GET /?after=cursor&status=PENDING` | Listado, máximo 30; filtros opcionales y cursor opaco |
| `GET /:id` | Detalle, pasajeros e historial; sin credenciales ni claves de solicitud |
| `POST /quote` | Selección `{kind,serviceId,modality,date,pax,vehicleId}`; devuelve importes y `quoteHash` |
| `POST /` | Selección, cotización aceptada, clave UUID, contacto, pasajeros y recojo/observaciones |
| `PUT /:id/status` | `{expectedUpdatedAt,status,note}` |

`kind`: TOUR/TRANSFER; `modality`: shared/private; `vehicleId`: null salvo traslado privado. `date`: YYYY-MM-DD; `pax`: entero 1–100. La creación recibe `selection`, `quoteHash`, `requestKey`, `customerFirstName`, `customerLastName`, `customerEmail`, `customerPhone`, `passengers`, `pickupHotel`, `pickupTime`, `specialRequirements`. Cada pasajero tiene `firstName`, `lastName`, `docType` (DNI/PASAPORTE/CE) y `docNumber` (puede ser vacío). El número de pasajeros debe coincidir y los documentos no vacíos no pueden repetirse. Campos desconocidos, precios aportados por el cliente y cambios de agencia se rechazan.

Consultar [Admin SaaS](ADMIN-SAAS.md) para configuración y [Migraciones](MIGRACIONES-Y-AUTENTICACION.md) para despliegue.

## Validación y activación realizadas

- 96 pruebas Vitest, 22 HTTP y 44 reportadas con PostgreSQL (incluyen contenedores) aprobadas. Las pruebas de reservas usan fixtures locales propios: cálculos compartidos/privados, capacidad, entradas forjadas, aislamiento, permisos, idempotencia concurrente, estados concurrentes, rollback al fallar auditoría, precios conservados y compatibilidad de consulta.
- API, admin y web compilaron; lint de API y de los archivos nuevos del admin aprobado.
- Respaldo de Oracle en `.agents/backups/before-manual-reservations/dbTravel.dump`, excluido de Git. Restauración local y migración ensayadas antes de aplicarla en Oracle; ambas comparaciones finales de schema sin diferencias.
- Comparación de los registros de reservas, pasajeros, ítems, tours y traslados contra el respaldo sin cambios. Las 13 reservas existentes tienen `agencyId = null`; su asignación histórica sigue pendiente, por eso el listado SaaS inicialmente está vacío.
- Se reinició la API local en `127.0.0.1:3002` y se verificaron login OWNER, listado autorizado y rechazo de consultas sin sesión. No se crearon reservas de prueba en Oracle.

El admin de esta copia se revisa en `http://127.0.0.1:3003/workspace/reservations`, después de iniciarlo con `pnpm --filter admin exec next dev --port 3003 --hostname 127.0.0.1`. El puerto 3001 pertenece a otra copia antigua. El arranque automático de Next había sido rechazado con «blocked by policy»; no se reintentó. La revisión visual y prueba completa del formulario en navegador siguen pendientes.
