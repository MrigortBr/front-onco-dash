"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SYNC_DONE_EVENT } from "@/lib/sync";

/** Data da última cópia do APAC Onco (só nas telas logadas). */
function LastUpdate() {
  const [updatedAt, setUpdatedAt] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const load = () =>
      api<{ updatedAt: string | null }>("/sync/last-update").then(
        (r) => setUpdatedAt(r.updatedAt),
        () => setUpdatedAt(undefined),
      );
    load();
    // A tela de Atualização avisa quando termina uma execução manual.
    window.addEventListener(SYNC_DONE_EVENT, load);
    return () => window.removeEventListener(SYNC_DONE_EVENT, load);
  }, []);
  if (updatedAt === undefined) return null;
  return (
    <span className="whitespace-nowrap">
      Dados atualizados em{" "}
      {updatedAt ? new Date(updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
    </span>
  );
}

/** Rodapé fixo verde com a logo do Ministério da Saúde (padrão SIMDASH/UMAE). */
export function BottomBar({ showLastUpdate = false }: { showLastUpdate?: boolean }) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex h-12 items-center justify-between gap-3 bg-brand-green px-3 sm:px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-ms-branca.png" alt="SUS · Ministério da Saúde · Governo do Brasil" className="h-8 w-auto flex-shrink-0" />
      <span className="flex items-center gap-3 truncate text-right text-xs text-white/75">
        {showLastUpdate && <LastUpdate />}
        <span className="hidden md:inline">Autorização Prévia de Medicamentos Oncológicos</span>
      </span>
    </footer>
  );
}
