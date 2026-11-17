import type { ReactNode } from "react";

/** Cabeçalho fixo navy (padrão SIMDASH/UMAE): marca à esquerda, abas no meio, usuário à direita. */
export function TopBar({ nav, actions }: { nav?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-3 bg-navy px-3 shadow-app-nav sm:px-6">
      <a href="/" className="flex flex-shrink-0 items-center gap-3" aria-label="OncoDash, início">
        <span className="flex h-9 w-9 items-center justify-center rounded-app-sm bg-brand-green">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
            <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
          </svg>
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-lg font-extrabold tracking-wide text-white">ONCODASH</span>
          <span className="block text-[11px] font-medium text-muted">Painel de Monitoramento</span>
        </span>
      </a>
      <div className="flex min-w-0 flex-1 items-center justify-center overflow-x-auto">{nav}</div>
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">{actions}</div>
    </header>
  );
}
