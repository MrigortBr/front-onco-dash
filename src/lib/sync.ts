import { ApiError } from "./api";
import { getDeviceFingerprint } from "./fingerprint";

/** Evento do navegador disparado quando uma atualização manual termina (o rodapé recarrega a data). */
export const SYNC_DONE_EVENT = "oncodash:sync-done";

export interface SyncStatus {
  updatedAt: string | null;
  running: boolean;
  /** SOURCE_DB_* configuradas na API. */
  configured: boolean;
}

export interface SyncTableResult {
  name: string;
  read: number;
  written: number;
  removed?: number;
}

export interface SyncRunHistoryItem {
  id: number;
  trigger: "manual" | "automatico";
  triggeredByNome: string | null;
  triggeredByEmail: string | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  error: string | null;
  tables: SyncTableResult[];
  totalRead: number;
  totalWritten: number;
}

export interface SyncEvent {
  msg: string;
  done: boolean;
  success: boolean;
}

/**
 * Dispara a atualização e lê o andamento em tempo real (Server-Sent Events
 * de GET /sync/stream). Usa fetch em vez de EventSource para mandar o header
 * do dispositivo junto com o cookie de sessão.
 */
export async function streamSync(onEvent: (e: SyncEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/sync/stream", {
    headers: { "X-Device-Fingerprint": getDeviceFingerprint(), Accept: "text/event-stream" },
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? "Não foi possível iniciar a atualização.", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const bloco = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = bloco
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (data) onEvent(JSON.parse(data) as SyncEvent);
    }
  }
}
