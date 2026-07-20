import { prisma, Reservation, Tour } from '@repo/db';

type ReservationWithTour = Reservation & { tour: Tour | null };

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
  let reservas: ReservationWithTour[] = [];
  try {
    reservas = await prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tour: true }
    });
  } catch (error) {
    console.error("Error fetching reservas:", error);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas y Pagos</h1>
          <p className="text-gray-500">Administra todas las reservas hechas por los clientes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Tour</th>
                <th className="px-6 py-4 font-semibold">Fecha Viaje</th>
                <th className="px-6 py-4 font-semibold">Pax</th>
                <th className="px-6 py-4 font-semibold">Monto</th>
                <th className="px-6 py-4 font-semibold">Estado (Izipay)</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aún no hay reservas registradas.
                  </td>
                </tr>
              )}
              {reservas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{reserva.customerFirstName} {reserva.customerLastName}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div>{reserva.customerEmail}</div>
                    <div className="text-xs">{reserva.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-[#062918]">{reserva.tour?.title || 'Tour Eliminado'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(reserva.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{reserva.pax}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">${reserva.totalPrice} USD</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      reserva.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                      reserva.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {reserva.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-900 font-medium">Ver detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
