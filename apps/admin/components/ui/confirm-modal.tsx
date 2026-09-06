'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-5">
        <DialogHeader className="flex flex-row items-start gap-3 text-left">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-1">
            <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 bg-transparent -mx-0 -mb-0 p-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs px-3.5 py-1.5 h-8 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs px-3.5 py-1.5 h-8 font-semibold text-white shadow-2xs transition-colors ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-[#008060] hover:bg-[#006e52] active:bg-[#005e46]'
            }`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
