import { prisma } from '@repo/db';
import { MegamenuManager } from './megamenu-manager';

export const dynamic = 'force-dynamic';

export default async function MegamenusPage() {
  const tours = await prisma.tour.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      region: true,
      menuGroup: true,
      cardImage: true,
    }
  });

  return (
    <div className="w-full">
      
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold mb-2">Administrar los items de los Megamenús</h2>
        <p className="text-gray-500 text-sm mb-6">
          Asigna los tours a los diferentes grupos del megamenú de la web. Los grupos principales son "LIMA-CUSCO", "PAQUETES" y "CUSCO". Si dejas un tour sin grupo, no aparecerá en el menú principal desplegable, pero seguirá disponible en el catálogo de tours.
        </p>
        
        <MegamenuManager tours={tours} />
      </div>
    </div>
  );
}
