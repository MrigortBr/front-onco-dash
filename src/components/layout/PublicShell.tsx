import type { ReactNode } from "react";
import { BottomBar } from "./BottomBar";
import { TopBar } from "./TopBar";

/** Moldura das páginas públicas (login, convite, senha): cartão centralizado. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-4 pt-24 pb-20">{children}</main>
      <BottomBar />
    </div>
  );
}

/** Cartão branco com o selo da marca, usado nos formulários públicos. */
export function AuthCard({ title, subtitle, children, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"} animate-app-fade-in-up rounded-app-lg bg-white p-8 shadow-app-card sm:p-10`}>
      <div className="mb-7 flex flex-col items-center text-center">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-app-sm bg-brand-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
            <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
          </svg>
        </span>
        <h1 className="text-xl font-extrabold tracking-wide text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
