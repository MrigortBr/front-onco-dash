"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { ADMIN_PROFILES } from "@/lib/types";
import { BottomBar } from "./BottomBar";
import { TopBar } from "./TopBar";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center whitespace-nowrap rounded-app-pill px-3.5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand-green text-white" : "text-white/65 hover:bg-navy-light hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function initials(nome: string): string {
  const base = nome.trim();
  const parts = base.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Moldura das telas logadas: cabeçalho com abas e usuário, rodapé verde. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const isAdmin = !!user?.profile && ADMIN_PROFILES.includes(user.profile);
  const canManageUsers = !!user?.profile && user.profile !== "Unidade";

  const nav = user ? (
    <nav className="flex gap-1" aria-label="Navegação principal">
      {/* O painel é uma página à parte (public/painel): navegação completa, não client-side. */}
      <a
        href="/"
        className="inline-flex items-center whitespace-nowrap rounded-app-pill px-3.5 py-2 text-sm font-semibold text-white/65 transition-colors hover:bg-navy-light hover:text-white"
      >
        Painel
      </a>
      {canManageUsers && <NavLink href="/admin/usuarios" label="Usuários" active={pathname.startsWith("/admin/usuarios")} />}
      {isAdmin && <NavLink href="/admin/auditoria" label="Auditoria" active={pathname.startsWith("/admin/auditoria")} />}
      {isAdmin && <NavLink href="/admin/atualizacao" label="Atualização" active={pathname.startsWith("/admin/atualizacao")} />}
    </nav>
  ) : null;

  const actions = user ? (
    <>
      <span className="hidden text-right text-xs leading-tight text-white lg:block">
        {user.nome}
        <span className="block text-muted">{user.profile ?? "Sem perfil"}</span>
      </span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-light text-xs font-bold text-white" aria-hidden>
        {initials(user.nome)}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        className="cursor-pointer rounded-app-pill border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10"
      >
        Sair
      </button>
    </>
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <TopBar nav={nav} actions={actions} />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 pt-20 pb-20 sm:px-6">{children}</main>
      <BottomBar showLastUpdate={!!user} />
    </div>
  );
}
