"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

export function Modal({ open, onClose, title, children, onConfirm, confirmLabel = "Confirm", confirmVariant = "primary" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; onConfirm?: () => void; confirmLabel?: string; confirmVariant?: "primary" | "danger" }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} className="bg-bg-card border border-border rounded-xl p-6 max-w-md w-full backdrop:bg-black/60">
      <h2 className="text-lg font-semibold text-text mb-4">{title}</h2>
      <div className="text-text-muted text-sm mb-6">{children}</div>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {onConfirm && <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>}
      </div>
    </dialog>
  );
}
