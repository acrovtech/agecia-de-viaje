'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = true,
  isPending = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus confirmation button initially
    setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-xl shadow-cal-elevated p-6 space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isDestructive ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#f3f4f6] text-[#111111]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-[#111111]">
                {title}
              </h3>
              <p id="confirm-dialog-desc" className="text-xs sm:text-sm text-[#6b7280] mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#898989] hover:text-[#111111] p-1 rounded-md transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="product-button-secondary"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-sm font-medium text-white shadow-product-button transition-colors disabled:opacity-50 cursor-pointer ${
              isDestructive
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] border border-[#dc2626]'
                : 'bg-[#111111] hover:bg-[#242424] border border-[#111111]'
            }`}
          >
            {isPending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
