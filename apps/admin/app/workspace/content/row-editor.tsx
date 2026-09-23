'use client';

export type Row = Record<string, string>;
export type RowField = { key: string; label: string; type?: 'number' | 'long'; optional?: boolean; options?: { value: string; label: string }[] };
export function RowEditor({ title, fields, rows, onChange, limit = 50 }: { title: string; fields: RowField[]; rows: Row[]; onChange: (rows: Row[]) => void; limit?: number }) {
  const move = (index: number, offset: number) => { const next = [...rows]; [next[index], next[index + offset]] = [next[index + offset]!, next[index]!]; onChange(next); };
  return <fieldset className="border rounded-xl p-4 space-y-3"><legend className="px-2 font-semibold">{title}</legend>
    {rows.map((row, index) => <div key={index} className="border rounded-lg p-3 space-y-2 bg-slate-50">
      <div className="grid sm:grid-cols-2 gap-3">{fields.map((field) => {
        const props = { value: row[field.key] ?? '', required: !field.optional, className: 'w-full border rounded-lg p-2 mt-1 bg-white', onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(rows.map((value, i) => i === index ? { ...value, [field.key]: event.target.value } : value)) };
        return <label key={field.key} className="text-sm">{field.label}{field.options ? <select {...props}><option value="">Selecciona…</option>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'long' ? <textarea {...props} maxLength={5000} rows={3} /> : <input {...props} type={field.type ?? 'text'} step={field.type === 'number' ? 'any' : undefined} maxLength={2000} />}</label>;
      })}</div>
      <div className="flex gap-3 text-sm"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="underline disabled:opacity-30" aria-label={`Subir elemento ${index + 1} de ${title}`}>Subir</button><button type="button" disabled={index === rows.length - 1} onClick={() => move(index, 1)} className="underline disabled:opacity-30" aria-label={`Bajar elemento ${index + 1} de ${title}`}>Bajar</button><button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="text-red-700 underline" aria-label={`Quitar elemento ${index + 1} de ${title}`}>Quitar</button></div>
    </div>)}
    <button type="button" disabled={rows.length >= limit} onClick={() => onChange([...rows, Object.fromEntries(fields.map((field) => [field.key, '']))])} className="border bg-white rounded-lg px-3 py-2 text-sm disabled:opacity-40">Añadir {title.toLowerCase()}</button>
  </fieldset>;
}
