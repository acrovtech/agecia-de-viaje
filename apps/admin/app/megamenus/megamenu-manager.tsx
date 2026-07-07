'use client';

import { useState } from 'react';
import { updateTourMenuGroup } from '../actions/megamenu';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

type Tour = {
  id: string;
  title: string;
  region: string | null;
  menuGroup: string | null;
  cardImage: string | null;
};

const MENU_GROUPS = [
  { value: 'none', label: 'No mostrar en Megamenú' },
  { value: 'CUSCO', label: 'Cusco (Caminatas / Destinos)' },
  { value: 'LIMA-CUSCO', label: 'Paquetes: Lima - Cusco' },
  { value: 'LIMA-AREQUIPA', label: 'Paquetes: Lima - Arequipa' },
  { value: 'LIMA-ICA', label: 'Paquetes: Lima - Ica' },
];

export function MegamenuManager({ tours }: { tours: Tour[] }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleGroupChange = async (id: string, newGroup: string) => {
    setUpdatingId(id);
    setSuccessId(null);
    try {
      await updateTourMenuGroup(id, newGroup);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el grupo. Revisa la consola.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y">
          <tr>
            <th className="px-4 py-3">Tour</th>
            <th className="px-4 py-3">Región Actual</th>
            <th className="px-4 py-3 w-[250px]">Grupo en Megamenú</th>
            <th className="px-4 py-3 w-[100px] text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tours.map(tour => (
            <tr key={tour.id} className="bg-white hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden relative shrink-0 border">
                  {tour.cardImage ? (
                    <Image src={tour.cardImage} alt={tour.title} fill className="object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400 absolute inset-0 flex items-center justify-center">N/A</span>
                  )}
                </div>
                <span className="font-medium text-gray-900">{tour.title}</span>
              </td>
              <td className="px-4 py-4 text-gray-500">
                {tour.region || 'Ninguna'}
              </td>
              <td className="px-4 py-4">
                <select
                  className="w-full border-gray-200 rounded-md text-sm shadow-sm focus:border-brand-teal focus:ring-brand-teal disabled:opacity-50"
                  defaultValue={tour.menuGroup || 'none'}
                  disabled={updatingId === tour.id}
                  onChange={(e) => handleGroupChange(tour.id, e.target.value)}
                >
                  {MENU_GROUPS.map(group => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-4 text-center">
                {updatingId === tour.id && <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />}
                {successId === tour.id && <Check className="w-5 h-5 text-green-500 mx-auto" />}
              </td>
            </tr>
          ))}
          {tours.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                No hay tours creados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
