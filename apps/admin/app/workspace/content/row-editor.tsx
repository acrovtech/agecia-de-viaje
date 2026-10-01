'use client';

export type Row = Record<string, string>;
export type RowField = { key: string; label: string; type?: 'number' | 'long'; optional?: boolean; options?: { value: string; label: string }[] };
export function RowEditor({ title, fields, rows, onChange, limit = 50 }: { title: string; fields: RowField[]; rows: Row[]; onChange: (rows: Row[]) => void; limit?: number }) {
  const move = (index: number, offset: number) => { const next = [...rows]; [next[index], next[index + offset]] = [next[index + offset]!, next[index]!]; onChange(next); };
  return (
    <div className="space-y-3 pt-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">{title}</h4>
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg p-3 space-y-2 bg-[#f8f9fa]">
          <div className="grid sm:grid-cols-2 gap-3">
            {fields.map((field) => {
              const props = {
                value: row[field.key] ?? '',
                required: !field.optional,
                className: 'w-full border border-[#e5e7eb] rounded-lg px-3 py-1.5 mt-1 bg-white text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]',
                onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                  onChange(rows.map((value, i) => (i === index ? { ...value, [field.key]: event.target.value } : value))),
              };
              return (
                <label key={field.key} className="text-xs font-medium text-[#374151] block">
                  {field.label}
                  {field.options ? (
                    <select {...props}>
                      <option value="">Selecciona…</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'long' ? (
                    <textarea {...props} maxLength={5000} rows={3} />
                  ) : (
                    <input {...props} type={field.type ?? 'text'} step={field.type === 'number' ? 'any' : undefined} maxLength={2000} />
                  )}
                </label>
              );
            })}
          </div>
          <div className="flex gap-3 text-xs text-[#6b7280] pt-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              className="hover:text-[#111111] disabled:opacity-30 cursor-pointer"
              aria-label={`Subir elemento ${index + 1} de ${title}`}
            >
              Subir
            </button>
            <button
              type="button"
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
              className="hover:text-[#111111] disabled:opacity-30 cursor-pointer"
              aria-label={`Bajar elemento ${index + 1} de ${title}`}
            >
              Bajar
            </button>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-[#dc2626] hover:underline cursor-pointer"
              aria-label={`Quitar elemento ${index + 1} de ${title}`}
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= limit}
        onClick={() => onChange([...rows, Object.fromEntries(fields.map((field) => [field.key, '']))])}
        className="h-9 shadow-cal-ring bg-white hover:bg-[#f8f9fa] rounded-lg px-3.5 text-xs font-semibold text-[#111111] cursor-pointer disabled:opacity-40 transition-colors"
      >
        Añadir {title.toLowerCase()}
      </button>
    </div>
  );
}
