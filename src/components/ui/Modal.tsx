"use client";

import { useEffect, type ReactNode } from "react";

/** Popup no padrão do DetailModal do SIMDASH: fundo escurecido, cartão branco, fecha com Esc. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex h-full max-h-full w-full ${wide ? "max-w-3xl" : "max-w-lg"} animate-app-fade-in-up flex-col overflow-hidden bg-white shadow-app-card sm:h-auto sm:max-h-[90vh] sm:rounded-app-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
