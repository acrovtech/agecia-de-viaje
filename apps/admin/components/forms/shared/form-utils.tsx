'use client';

import React, { useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

export function SubmitSaveButton({ 
  label = 'Guardar', 
  className = '' 
}: { 
  label?: string; 
  className?: string; 
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-8 px-3.5 rounded-md bg-[#008060] hover:bg-[#006e52] text-white font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${className}`}
    >
      {pending ? 'Guardando...' : label}
    </button>
  );
}

export function AutoResizeTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value, props.defaultValue]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    if (props.onInput) props.onInput(e);
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      onInput={handleInput}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 leading-relaxed overflow-hidden resize-none transition-[height] duration-75 ${props.className || ''}`}
    />
  );
}

export { getStorefrontUrl } from '@/lib/site-config';
