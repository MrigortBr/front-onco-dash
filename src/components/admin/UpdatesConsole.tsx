"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { streamSync, SYNC_DONE_EVENT, type SyncRunHistoryItem, type SyncStatus } from "@/lib/sync";
import type { Page } from "@/lib/types";

const PAGE = 20;

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" }) : "nunca";

function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min ${s % 60 ? `${s % 60}s` : ""}`.trim();
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.7-6.4" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}

function lineColor(text: string): string {
  if (text.startsWith("[ERRO]")) return "text-red-300";
  if (text.startsWith("[AVISO]")) return "text-amber-300";
  if (/concluída/i.test(text)) return "text-green-300";
  return "text-slate-200";
}

/** Histórico de execuções (auditoria do "Atualizar"), recarregado ao fim de cada execução manual. */
function History({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SyncRunHistoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback((offset: number, append: boolean) => {
    api<Page<SyncRunHistoryItem>>(`/sync/history?limit=${PAGE}&offset=${offset}`).then(
      (p) => {
        setItems((prev) => (append && prev ? [...prev, ...p.items] : p.items));
        setTotal(p.total);
        setError(null);
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  useEffect(() => {
    load(0, false);
  }, [load, refreshKey]);

  return (
    <div className="mt-5 rounded-app-lg bg-white p-5 shadow-app-card sm:p-6">
      <h2 className="text-base font-extrabold text-slate-800">Histórico de atualizações</h2>
      <p className="mt-1 text-sm text-slate-500">Cada execução, automática ou manual, com quem disparou e o resultado.</p>
      {error && (
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
      )}
      <div className="mt-4 overflow-auto rounded-app-md border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-brand-green text-white">
              {["Quando", "Disparado por", "Resultado", "Registros", "Duração", ""].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!items &&
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-3 py-2">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {items?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Nenhuma atualização registrada ainda.
                </td>
              </tr>
            )}
            {items?.map((it) => (
              <Fragment key={it.id}>
                <tr className="border-b border-slate-100 even:bg-slate-50/60">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{fmtDateTime(it.startedAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {it.trigger === "automatico" ? (
                      <span className="text-slate-500">Automático (agendamento)</span>
                    ) : (
                      (it.triggeredByNome ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-app-pill px-2 py-0.5 text-[11px] font-semibold ${
                        it.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {it.success ? "Sucesso" : "Falhou"}
                    </span>
                    {it.error && (
                      <span className="mt-1 block max-w-md truncate text-[11px] text-red-600" title={it.error}>
                        {it.error}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {it.totalRead.toLocaleString("pt-BR")} lido(s), {it.totalWritten.toLocaleString("pt-BR")} alterado(s)
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{fmtDuration(it.durationMs)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {it.tables.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setOpen(open === it.id ? null : it.id)}>
                        {open === it.id ? "Ocultar" : "Tabelas"}
                      </Button>
                    )}
                  </td>
                </tr>
                {open === it.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-3 py-2">
                      <div className="grid gap-x-6 gap-y-1 text-[11px] text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                        {it.tables.map((t) => (
                          <span key={t.name} className="flex justify-between gap-3 border-b border-slate-200/70 py-0.5">
                            <span className="font-mono">{t.name}</span>
                            <span className="tabular-nums">
                              {t.read} lido(s) · {t.written} gravado(s)
                              {t.removed ? ` · ${t.removed} removido(s)` : ""}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {items && items.length < total && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => load(items.length, true)}>
            Carregar mais ({items.length} de {total})
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Atualização de dados (Desenvolvedor e Gestor federal) — igual ao SIMDASH:
 * situação da última cópia do APAC Onco, botão "Atualizar agora" com o
 * andamento ao vivo e o histórico de execuções.
 */
export function UpdatesConsole() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Array<{ time: string; text: string }>>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshStatus = useCallback(() => {
    api<SyncStatus>("/sync/status").then(
      (s) => {
        setStatus(s);
        setError(null);
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setLines([]);
    const controller = new AbortController();
    abortRef.current = controller;
    const add = (text: string) => {
      if (text) setLines((prev) => [...prev, { time: new Date().toLocaleTimeString("pt-BR"), text }]);
    };
    try {
      await streamSync((e) => {
        add(e.msg);
        if (e.done) setResult(e.success ? "success" : "error");
      }, controller.signal);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        add(`[ERRO] ${(e as Error).message}`);
        setResult("error");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
      refreshStatus();
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event(SYNC_DONE_EVENT));
    }
  };

  const busy = running || !!status?.running;

  return (
    <div>
      <div className="rounded-app-lg bg-white p-5 shadow-app-card sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-green">Administração</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-800">Atualização de dados</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Copia as solicitações, os domínios e os usuários do banco do APAC Onco para o OncoDash. Roda sozinha todo
              dia às 9h, 13h e 17h (horário de Brasília) ou agora, pelo botão.
            </p>
          </div>
          <Button onClick={() => void run()} disabled={busy || status?.configured === false}>
            <RefreshIcon spin={busy} />
            {busy ? "Atualizando…" : "Atualizar agora"}
          </Button>
        </div>

        {error && (
          <div className="mt-4">
            <FormError>{error}</FormError>
          </div>
        )}
        {status?.configured === false && (
          <p className="mt-4 rounded-app-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            A conexão com o banco do APAC Onco não está configurada na API (variáveis SOURCE_DB_*). Enquanto isso não
            for feito, nem o agendamento nem o botão atualizam os dados.
          </p>
        )}

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-app-md bg-app-bg px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Última atualização</dt>
            <dd className="mt-0.5 text-base font-bold text-slate-800">
              {status ? fmtDateTime(status.updatedAt) : <Skeleton className="h-5 w-32" />}
            </dd>
          </div>
          <div className="rounded-app-md bg-app-bg px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Situação</dt>
            <dd className="mt-0.5 text-base font-bold text-slate-800">{busy ? "Atualizando agora" : "Parado"}</dd>
          </div>
          <div className="rounded-app-md bg-app-bg px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Agendamento</dt>
            <dd className="mt-0.5 text-base font-bold text-slate-800">9h · 13h · 17h</dd>
          </div>
        </dl>

        {(lines.length > 0 || running) && (
          <div className="mt-4">
            <div className="flex items-center justify-between rounded-t-app-md bg-navy px-4 py-2 text-xs font-semibold text-white">
              <span>Andamento</span>
              {running ? (
                <span className="flex items-center gap-1.5 text-green-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> ao vivo
                </span>
              ) : result === "success" ? (
                <span className="text-green-300">Concluído</span>
              ) : result === "error" ? (
                <span className="text-red-300">Terminou com erro</span>
              ) : null}
            </div>
            <div ref={consoleRef} className="max-h-80 overflow-auto rounded-b-app-md bg-[#0f1b2d] px-4 py-3 font-mono text-[11.5px] leading-relaxed">
              {lines.map((l, i) => (
                <div key={i} className={lineColor(l.text)}>
                  <span className="mr-2 text-slate-500">{l.time}</span>
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <History refreshKey={refreshKey} />
    </div>
  );
}
