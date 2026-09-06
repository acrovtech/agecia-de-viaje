import { Users } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

export type Passenger = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
};

interface CheckoutPassengerFieldsProps {
  passengers: Passenger[];
  onPassengerChange: (index: number, field: keyof Passenger, value: string) => void;
  inputBaseStyle: string;
}

export function CheckoutPassengerFields({
  passengers,
  onPassengerChange,
  inputBaseStyle,
}: CheckoutPassengerFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Users size={16} className="text-[#062918]" /> Lista de Pasajeros ({passengers.length})
        </h3>
      </div>

      <div className="space-y-6 divide-y divide-gray-100">
        {passengers.map((pax, index) => (
          <div key={index} className="pt-5 first:pt-0 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <span className="w-5 h-5 rounded-full bg-[#062918] text-white flex items-center justify-center text-[10px] font-semibold">
                {index + 1}
              </span>
              <span>Pasajero {index + 1}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={pax.firstName}
                  onChange={(e) => onPassengerChange(index, 'firstName', e.target.value)}
                  placeholder="Nombres completos"
                  className={inputBaseStyle}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={pax.lastName}
                  onChange={(e) => onPassengerChange(index, 'lastName', e.target.value)}
                  placeholder="Apellidos completos"
                  className={inputBaseStyle}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Tipo de Documento *</label>
                <Select
                  value={pax.documentType}
                  onValueChange={(val) => onPassengerChange(index, 'documentType', val || 'DNI')}
                >
                  <SelectTrigger className="w-full h-[38px] rounded-lg border border-gray-300 bg-white text-gray-900 text-xs">
                    {pax.documentType || 'DNI'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI (Nacional)</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte (Extranjero)</SelectItem>
                    <SelectItem value="Carnet Extranjeria">Carnet de Extranjería</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Número de Documento *</label>
                <input
                  type="text"
                  required
                  value={pax.documentNumber}
                  onChange={(e) => onPassengerChange(index, 'documentNumber', e.target.value)}
                  placeholder="Ej. 72819283 / A12345678"
                  className={inputBaseStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
