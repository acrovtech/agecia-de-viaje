'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadMediaAction } from '../../app/workspace/media-actions';

export type MediaKind =
  | 'AGENCY_LOGO'
  | 'AGENCY_ICON'
  | 'TOUR_BANNER'
  | 'TOUR_CARD'
  | 'TOUR_GALLERY'
  | 'TRANSFER'
  | 'VEHICLE'
  | 'BLOG';

interface MediaUploaderProps {
  name: string;
  label: string;
  kind: MediaKind;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MiB

export function MediaUploader({
  name,
  label,
  kind,
  value = '',
  onChange,
  required = false,
  placeholder = 'https://...',
  helpText,
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setErrorMessage(null);
    setSuccessNotice(false);

    // Client-side quick validation
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('El archivo excede el tamaño máximo permitido de 8 MiB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formato no permitido. Solo se aceptan JPEG, PNG, WEBP y AVIF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const result = await uploadMediaAction(formData);

      if (result.success && result.url) {
        onChange(result.url);
        setSuccessNotice(true);
        setTimeout(() => setSuccessNotice(false), 4000);
      } else {
        setErrorMessage(result.error || 'No se pudo subir la imagen.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión al subir imagen.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setErrorMessage(null);
    setSuccessNotice(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={`media-input-${name}`} className="block text-sm font-medium text-slate-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {helpText && <span className="text-xs text-slate-500">{helpText}</span>}
      </div>

      {/* Hidden native input for form submission compatibility */}
      <input
        type="hidden"
        name={name}
        id={`media-input-${name}`}
        value={value}
        required={required}
      />

      {/* Preview and controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {value ? (
          <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 w-24 h-16 shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for broken URLs
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Quitar imagen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-16 shrink-0 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Sin imagen</span>
          </div>
        )}

        <div className="flex-1 w-full space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={isUploading}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#062918] focus:border-[#062918]"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                  <span>Subir R2</span>
                </>
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />

          {errorMessage && (
            <p className="flex items-center gap-1 text-xs text-red-600 mt-1" role="alert">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}

          {successNotice && (
            <p className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Imagen subida exitosamente a R2.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
