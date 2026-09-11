'use client';

import { useState, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  Users, 
  Phone, 
  Calendar, 
  DollarSign, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export interface MarketingContact {
  email: string;
  fullName: string;
  phone: string | null;
  reservationsCount: number;
  totalSpent: number;
  lastReservationDate: string;
  lastStatus: string;
}

interface MarketingClientProps {
  initialContacts: MarketingContact[];
}

export function MarketingClient({ initialContacts }: MarketingClientProps) {
  const [contacts] = useState<MarketingContact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Estadísticas agregadas
  const metrics = useMemo(() => {
    const total = contacts.length;
    const withPhone = contacts.filter((c) => Boolean(c.phone && c.phone.trim().length > 4)).length;
    const recurrent = contacts.filter((c) => c.reservationsCount > 1).length;
    const totalRevenue = contacts.reduce((sum, c) => sum + c.totalSpent, 0);

    return { total, withPhone, recurrent, totalRevenue };
  }, [contacts]);

  // Filtrado de contactos
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        c.email.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query));

      let matchesFilter = true;
      if (filterType === 'PHONE') {
        matchesFilter = Boolean(c.phone && c.phone.trim().length > 4);
      } else if (filterType === 'RECURRENT') {
        matchesFilter = c.reservationsCount > 1;
      } else if (filterType === 'PAID') {
        matchesFilter = c.lastStatus === 'PAID';
      }

      return matchesQuery && matchesFilter;
    });
  }, [contacts, searchQuery, filterType]);

  // Checkboxes de Selección
  const isAllSelected = filteredContacts.length > 0 && selectedEmails.length === filteredContacts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredContacts.map((c) => c.email));
    }
  };

  const toggleSelect = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  // Copiar correos al portapapeles
  const handleCopyEmails = () => {
    const emailsToCopy = selectedEmails.length > 0 
      ? selectedEmails 
      : filteredContacts.map((c) => c.email);
    
    if (emailsToCopy.length === 0) return;

    navigator.clipboard.writeText(emailsToCopy.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const dataToExport = selectedEmails.length > 0
      ? filteredContacts.filter((c) => selectedEmails.includes(c.email))
      : filteredContacts;

    if (dataToExport.length === 0) return;

    const headers = ['Nombre Completo', 'Correo Electrónico', 'Teléfono', 'Reservas', 'Total Gastado (USD)', 'Última Reserva', 'Estado'];
    const rows = dataToExport.map((c) => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      c.reservationsCount,
      c.totalSpent.toFixed(2),
      c.lastReservationDate,
      c.lastStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contactos_marketing_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || filterType !== 'ALL';
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
  };

  return (
    <div className="space-y-4 font-sans select-none w-full min-w-0">
      
      {/* 1. Header con Título y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-5 h-5 text-[#2f2f2f] shrink-0" />
          <h1 className="text-[1.125rem] font-semibold tracking-tight text-[#2f2f2f] truncate">
            Email Marketing & Contactos
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Badge Contador de Contactos */}
          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 shadow-2xs select-none">
            <span className="text-slate-400 font-normal">Base de datos:</span>
            <span className="text-slate-900 font-bold">{contacts.length}</span>
            <span className="text-slate-500 font-medium">{contacts.length === 1 ? 'cliente' : 'clientes'}</span>
          </div>

          {/* Botón Copiar Correos */}
          <button
            type="button"
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all border border-slate-200 cursor-pointer shrink-0"
            title="Copiar lista de correos separados por comas para Mailchimp, Brevo o Resend"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? '¡Copiados!' : selectedEmails.length > 0 ? `Copiar (${selectedEmails.length})` : 'Copiar Correos'}</span>
          </button>

          {/* Botón Exportar CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8 bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46] text-white font-semibold text-xs rounded-lg shadow-2xs transition-all border border-[#006e52] cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Marketing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Contactos Únicos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Contactos
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                100% verificados
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.total}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Clientes que completaron reservas
            </p>
          </div>
        </div>

        {/* KPI 2: Con Teléfono / WhatsApp */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                WhatsApp Ready
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                {metrics.total > 0 ? Math.round((metrics.withPhone / metrics.total) * 100) : 0}% con móvil
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.withPhone}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Contactos con número telefónico
            </p>
          </div>
        </div>

        {/* KPI 3: Clientes Recurrentes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Recurrentes
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                Fidelizados
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                {metrics.recurrent}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Clientes con más de 1 reserva
            </p>
          </div>
        </div>

        {/* KPI 4: Valor Total de Cartera */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Valor Cartera
              </span>
              <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300/80">
                USD
              </span>
            </div>
            <div className="mt-2.5 mb-0.5">
              <span className="text-2xl md:text-3xl font-bold text-[#2f2f2f] tracking-tight font-sans">
                ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Volumen acumulado por los clientes
            </p>
          </div>
        </div>

      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          
          {/* Input de Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o teléfono..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F9F9F9] border border-slate-200 rounded-lg text-xs text-[#2f2f2f] focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
            {/* Dropdown de Segmentación */}
            <Select value={filterType} onValueChange={(val) => setFilterType(val ?? 'ALL')}>
              <SelectTrigger className="h-8 w-[190px] bg-white border border-slate-200 text-xs font-semibold px-2.5 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {filterType === 'ALL' && 'Todos los contactos'}
                    {filterType === 'PHONE' && 'Con número móvil'}
                    {filterType === 'RECURRENT' && 'Clientes recurrentes'}
                    {filterType === 'PAID' && 'Último pago confirmado'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent 
                alignItemWithTrigger={false} 
                align="start" 
                side="bottom" 
                sideOffset={6}
                className="w-[200px] bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span>Todos los contactos</span>
                    <span className="text-[11px] text-slate-400 font-normal">({contacts.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="PHONE" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-blue-700 font-semibold">Con teléfono móvil</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.withPhone})</span>
                  </div>
                </SelectItem>
                <SelectItem value="RECURRENT" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-purple-700 font-semibold">Recurrentes (+1)</span>
                    <span className="text-[11px] text-slate-400 font-normal">({metrics.recurrent})</span>
                  </div>
                </SelectItem>
                <SelectItem value="PAID" className="text-xs font-medium cursor-pointer py-1.5 px-2 rounded-lg">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-emerald-700 font-semibold">Pagos confirmados</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Botón Limpiar */}
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all shrink-0 shadow-2xs ${
                hasActiveFilters
                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer'
                  : 'text-slate-400 bg-slate-50/70 border-slate-200/80 cursor-not-allowed opacity-50'
              }`}
              title={hasActiveFilters ? 'Restablecer todos los filtros' : 'No hay filtros activos'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>

          </div>
        </div>
      </div>

      {/* 4. Tabla de Contactos de Marketing */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-2xs">
          <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="font-semibold text-slate-600 text-sm">No se encontraron contactos</p>
          <p className="text-xs text-slate-400 mt-1">Los contactos aparecerán automáticamente cuando los clientes completen reservas en el portal web.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[28%]" />
                <col className="w-[27%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                {selectedEmails.length > 0 ? (
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-800 text-xs font-medium animate-in fade-in duration-150">
                    <th className="px-4 py-2.5 text-center w-10">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                      />
                    </th>
                    <th colSpan={5} className="px-3 py-2.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs">
                          {selectedEmails.length} {selectedEmails.length === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyEmails}
                            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Copy size={13} />
                            <span>Copiar correos</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportCSV}
                            className="px-3 py-1 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download size={13} />
                            <span>Exportar selección</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  </tr>
                ) : (
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Correo Electrónico</th>
                    <th className="px-4 py-3 text-left">Teléfono / WhatsApp</th>
                    <th className="px-4 py-3 text-center">Reservas</th>
                    <th className="px-4 py-3 text-right">Inversión Total</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedEmails.includes(contact.email);

                  return (
                    <tr 
                      key={contact.email} 
                      className={`transition-colors group ${
                        isSelected ? 'bg-slate-50/90' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox fijado */}
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(contact.email)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer" 
                        />
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3 text-slate-900">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold text-[10.5px] shrink-0 shadow-2xs">
                            {contact.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 truncate text-xs">
                            {contact.fullName}
                          </span>
                        </div>
                      </td>

                      {/* Correo Electrónico */}
                      <td className="px-4 py-3">
                        <span className="text-slate-700 font-mono text-xs truncate select-text">
                          {contact.email}
                        </span>
                      </td>

                      {/* Teléfono */}
                      <td className="px-4 py-3">
                        {contact.phone ? (
                          <a
                            href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 hover:text-emerald-700 transition-colors"
                            title="Hacer clic para abrir chat de WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{contact.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No registrado</span>
                        )}
                      </td>

                      {/* Reservas */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          contact.reservationsCount > 1 
                            ? 'bg-purple-50 text-purple-700 border-purple-200/80' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {contact.reservationsCount} {contact.reservationsCount === 1 ? 'reserva' : 'reservas'}
                        </span>
                      </td>

                      {/* Total Gastado */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900 text-xs">
                          ${contact.totalSpent.toFixed(2)} USD
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
