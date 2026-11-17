"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, inputClass } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { ExportAuditItem, LoginAuditItem, Page, UserAuditItem } from "@/lib/types";

type Tab = "logins" | "users" | "exports";
const TABS: { id: Tab; label: string }[] = [
  { id: "logins", label: "Logins" },
  { id: "users", label: "Alterações de usuários" },
  { id: "exports", label: "Exportações" },
];
const LIMIT = 50;

const ACAO_LABEL: Record<string, string> = {
  convite_criado: "Convite criado",
  convite_reenviado: "Convite reenviado",
  conta_ativada: "Conta ativada",
  usuario_alterado: "Dados alterados",
  permissao_alterada: "Perfil/permissão alterados",
  senha_redefinida: "Senha redefinida",
  senha_recuperacao_pedida: "Pediu nova senha",
  usuario_criado: "Conta criada (terminal)",
};

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const who = (u: { nome: string; email: string | null } | null) => (u ? u.nome : "—");
const diff = (a: Record<string, unknown> | null, d: Record<string, unknown> | null) =>
  d
    ? Object.keys(d)
        .map((k) => (a && k in a ? `${k}: ${JSON.stringify(a[k])} → ${JSON.stringify(d[k])}` : `${k}: ${JSON.stringify(d[k])}`))
        .join(" · ")
    : "—";

function Th({ children }: { children: string }) {
  return <th className="whitespace-nowrap px-3 py-2.5 font-semibold">{children}</th>;
}

export function AuditPanel() {
  const [tab, setTab] = useState<Tab>("logins");
  const [search, setSearch] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Page<LoginAuditItem | UserAuditItem | ExportAuditItem> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
    if (search.trim()) qs.set("search", search.trim());
    if (tab === "logins" && onlySuspicious) qs.set("suspeito", "true");
    try {
      setData(await api(`/audit/${tab}?${qs}`));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tab, search, onlySuspicious, offset]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const resetPage = () => {
    setOffset(0);
    setData(null);
  };

  const rows = data?.items ?? null;
  const cols = tab === "logins" ? 7 : tab === "users" ? 5 : 6;

  return (
    <div className="rounded-app-lg bg-white p-5 shadow-app-card sm:p-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-green">Administração</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-800">Auditoria</h1>
        <p className="mt-1 text-sm text-slate-500">Quem entrou, de onde, o que mudou e o que foi exportado.</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-app-sm border border-slate-300" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                resetPage();
              }}
              className={`cursor-pointer border-r border-slate-300 px-3.5 py-1.5 text-xs font-semibold last:border-r-0 ${
                tab === t.id ? "bg-brand-green text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tab === "logins" && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                className="accent-brand-green"
                checked={onlySuspicious}
                onChange={(e) => {
                  setOnlySuspicious(e.target.checked);
                  resetPage();
                }}
              />
              Só suspeitos
            </label>
          )}
          <input
            className={`${inputClass()} w-64 !rounded-app-pill !py-2`}
            placeholder="Buscar…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            aria-label="Buscar na auditoria"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}

      <div className="mt-4 overflow-auto rounded-app-md border border-slate-200 shadow-app-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-brand-green text-white">
              {tab === "logins" && (
                <>
                  <Th>Data</Th>
                  <Th>Usuário</Th>
                  <Th>Perfil</Th>
                  <Th>IP</Th>
                  <Th>Sessão</Th>
                  <Th>Distância</Th>
                  <Th>Alertas</Th>
                </>
              )}
              {tab === "users" && (
                <>
                  <Th>Data</Th>
                  <Th>Ação</Th>
                  <Th>Feita por</Th>
                  <Th>Usuário afetado</Th>
                  <Th>Mudança</Th>
                </>
              )}
              {tab === "exports" && (
                <>
                  <Th>Data</Th>
                  <Th>Usuário</Th>
                  <Th>Página</Th>
                  <Th>Arquivo</Th>
                  <Th>Linhas</Th>
                  <Th>IP</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {!rows &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={cols} className="px-3 py-2">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {rows?.length === 0 && (
              <tr>
                <td colSpan={cols} className="px-3 py-6 text-center text-slate-500">
                  Nada registrado neste filtro.
                </td>
              </tr>
            )}
            {tab === "logins" &&
              (rows as LoginAuditItem[] | null)?.map((r) => (
                <tr key={r.id} className={`border-b border-slate-100 ${r.suspeito ? "bg-red-50/70" : "even:bg-slate-50/60"}`}>
                  <td className="whitespace-nowrap px-3 py-2">{fmt(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                    {r.nome}
                    <span className="block font-normal text-slate-500">{r.email ?? "sem e-mail"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {r.profile ?? "—"}
                    {r.scopeLabel && <span className="block text-slate-500">{r.scopeLabel}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{r.ip ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-app-pill px-2 py-0.5 text-[11px] font-semibold ${
                        r.status === "ativa" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">{r.distanciaKm === null ? "—" : `${r.distanciaKm} km`}</td>
                  <td className="px-3 py-2 text-red-700">{r.motivosSuspeita.join(" · ") || <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            {tab === "users" &&
              (rows as UserAuditItem[] | null)?.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 even:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3 py-2">{fmt(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">{ACAO_LABEL[r.acao] ?? r.acao}</td>
                  <td className="whitespace-nowrap px-3 py-2">{who(r.ator)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{who(r.alvo)}</td>
                  <td className="px-3 py-2 text-slate-600">{diff(r.antes, r.depois)}</td>
                </tr>
              ))}
            {tab === "exports" &&
              (rows as ExportAuditItem[] | null)?.map((r) => (
                <tr key={r.exportId} className="border-b border-slate-100 even:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3 py-2">{fmt(r.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{who(r.usuario)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{r.pagina}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {r.arquivo} <span className="text-slate-400">({r.formato})</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{r.totalLinhas.toLocaleString("pt-BR")}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{r.ip ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.total > LIMIT && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-600">
          <span>
            {offset + 1}–{Math.min(offset + LIMIT, data.total)} de {data.total.toLocaleString("pt-BR")}
          </span>
          <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))}>
            ← Anteriores
          </Button>
          <Button size="sm" variant="secondary" disabled={offset + LIMIT >= data.total} onClick={() => setOffset(offset + LIMIT)}>
            Próximos →
          </Button>
        </div>
      )}
    </div>
  );
}
